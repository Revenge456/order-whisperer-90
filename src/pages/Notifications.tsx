import { useState, useMemo } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationItem } from "@/components/notifications/NotificationItem";

type Filter = "all" | "orders" | "payments";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "orders", label: "Pedidos" },
  { value: "payments", label: "Pagos" },
];

export default function Notifications() {
  const { allNotifications, isLoading, isRead, markAsRead, markAllAsRead, unreadCount } =
    useNotifications();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "orders") return allNotifications.filter((n) => n.kind === "new_order");
    if (filter === "payments")
      return allNotifications.filter((n) => n.kind === "pending_payment");
    return allNotifications;
  }, [allNotifications, filter]);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary" />
              Notificaciones
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pedidos nuevos y pagos pendientes en tiempo real
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar todas como leídas
          </Button>
        </div>

        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
                filter === f.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/50 text-muted-foreground border-border hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Card>
          <CardContent className="p-4 space-y-2">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-4xl mb-3">🎉</p>
                <p className="text-foreground font-medium">Todo al día, no hay pendientes</p>
              </div>
            ) : (
              filtered.map((n) => (
                <NotificationItem
                  key={`${n.kind}-${n.id}`}
                  notification={n}
                  isRead={isRead(n.id)}
                  onClick={() => markAsRead(n.id)}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
