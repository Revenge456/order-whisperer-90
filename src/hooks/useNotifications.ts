import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useAuth";

export type NotificationKind = "new_order" | "pending_payment";

export interface AppNotification {
  id: string; // orders.id or payments.id
  kind: NotificationKind;
  order_number: string;
  customer_name: string | null;
  amount: number;
  created_at: string;
}

const STORAGE_KEY = "bf:notifications:read";

function loadReadMap(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveReadMap(map: Record<string, string[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function useNotifications(limit?: number) {
  const { user } = useSession();
  const userId = user?.id ?? "anon";

  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Load persisted read state on mount / user change
  useEffect(() => {
    const map = loadReadMap();
    setReadIds(new Set(map[userId] ?? []));
  }, [userId]);

  const query = useQuery({
    queryKey: ["notifications-feed"],
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<AppNotification[]> => {
      const [ordersRes, paymentsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, order_number, total, created_at, customer:customers(name)")
          .eq("status", "nuevo")
          .order("created_at", { ascending: false }),
        supabase
          .from("payments")
          .select(
            "id, amount, created_at, order:orders(id, order_number, customer:customers(name))",
          )
          .eq("status", "pendiente")
          .order("created_at", { ascending: false }),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      const newOrders: AppNotification[] = (ordersRes.data ?? []).map((o: any) => ({
        id: o.id,
        kind: "new_order",
        order_number: o.order_number,
        customer_name: o.customer?.name ?? null,
        amount: Number(o.total ?? 0),
        created_at: o.created_at,
      }));

      const pendingPayments: AppNotification[] = (paymentsRes.data ?? [])
        .filter((p: any) => !!p.order)
        .map((p: any) => ({
          id: p.id,
          kind: "pending_payment",
          order_number: p.order.order_number,
          customer_name: p.order.customer?.name ?? null,
          amount: Number(p.amount ?? 0),
          created_at: p.created_at,
          _order_id: p.order.id,
        }) as any);

      // Dedupe: if a new order already has a pending payment, hide the order notif.
      const orderIdsWithPendingPayment = new Set(
        (paymentsRes.data ?? [])
          .filter((p: any) => p.order?.id)
          .map((p: any) => p.order.id),
      );
      const filteredOrders = newOrders.filter((n) => !orderIdsWithPendingPayment.has(n.id));

      const merged = [...filteredOrders, ...pendingPayments].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      return merged;
    },
  });

  const all = query.data ?? [];
  const visible = typeof limit === "number" ? all.slice(0, limit) : all;
  const unreadCount = all.reduce((acc, n) => (readIds.has(n.id) ? acc : acc + 1), 0);

  const isRead = useCallback((id: string) => readIds.has(id), [readIds]);

  const markAsRead = useCallback(
    (id: string) => {
      setReadIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        const map = loadReadMap();
        map[userId] = Array.from(next);
        saveReadMap(map);
        return next;
      });
    },
    [userId],
  );

  const markAllAsRead = useCallback(() => {
    const allIds = all.map((n) => n.id);
    setReadIds((prev) => {
      const next = new Set(prev);
      allIds.forEach((id) => next.add(id));
      const map = loadReadMap();
      map[userId] = Array.from(next);
      saveReadMap(map);
      return next;
    });
  }, [all, userId]);

  return {
    notifications: visible,
    allNotifications: all,
    unreadCount,
    isLoading: query.isLoading,
    isRead,
    markAsRead,
    markAllAsRead,
  };
}
