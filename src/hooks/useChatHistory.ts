import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useEffect } from "react";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  customer_id: string;
  content: string;
  message_type: string;
  is_automated: boolean;
  ai_agent_phase: string | null;
  created_at: string;
  media_url: string | null;
  media_type: string | null;
}

export interface ChatSummary {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  last_message: string;
  last_message_at: string;
  last_message_type: string;
  message_count: number;
  chat_status: string;
  conversation_mode: string;
}

export type ChatFilter = "all" | "ai" | "revision" | "buenos" | "ventas";

const PAGE_SIZE = 50;
const MESSAGES_PAGE_SIZE = 50;

export interface ChatListResult {
  data: ChatSummary[];
  isLoading: boolean;
  error: unknown;
  totalCount: number;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
}

/**
 * Optimized chat list using chat_list_view (LATERAL JOIN, no N+1).
 * Falls back to a two-query approach if the view doesn't exist yet.
 */
export function useChatList(search: string, filterStatus: ChatFilter, page: number): Omit<ChatListResult, 'page' | 'setPage' | 'totalPages'> & { totalCount: number } {
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["chat-list", search, filterStatus, page],
    queryFn: async () => {
      // Try the optimized view first
      try {
        return await fetchFromView(search, filterStatus, page);
      } catch (viewError) {
        console.warn("chat_list_view not available, falling back to two-query approach", viewError);
        return await fetchFallback(search, filterStatus, page);
      }
    },
    staleTime: 30_000, // 30s before refetch
  });

  return {
    data: data?.items ?? [],
    isLoading,
    error,
    totalCount: data?.totalCount ?? 0,
  };
}

async function fetchFromView(search: string, filterStatus: ChatFilter, page: number) {
  let query = supabase
    .from("chat_list_view" as any)
    .select("*", { count: "exact" });

  // Apply filters
  if (search) {
    query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
  }
  if (filterStatus === "ai") {
    query = query.eq("conversation_mode", "ai");
  } else if (filterStatus === "revision") {
    query = query.eq("chat_status", "revision");
  } else if (filterStatus === "buenos") {
    query = query.eq("chat_status", "bueno");
  } else if (filterStatus === "ventas") {
    query = query.eq("chat_status", "venta");
  }

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await query
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (error) throw error;

  const items: ChatSummary[] = (data || []).map((row: any) => ({
    customer_id: row.customer_id,
    customer_name: row.customer_name || "Sin nombre",
    customer_phone: row.customer_phone,
    last_message: row.last_message || "",
    last_message_at: row.last_message_at || "",
    message_count: row.message_count || 0,
    chat_status: row.chat_status || "revision",
    conversation_mode: row.conversation_mode || "ai",
  }));

  return { items, totalCount: count ?? 0 };
}

/**
 * Fallback: two queries (customers paginated + last message per customer batch).
 * Still far better than loading ALL whatsapp_logs.
 */
async function fetchFallback(search: string, filterStatus: ChatFilter, page: number) {
  // 1. Query customers with filters + pagination
  let customerQuery = supabase
    .from("customers")
    .select("id, name, phone, conversation_mode, chat_status", { count: "exact" });

  if (search) {
    customerQuery = customerQuery.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  }
  if (filterStatus === "ai") {
    customerQuery = customerQuery.eq("conversation_mode", "ai");
  } else if (filterStatus === "revision") {
    customerQuery = customerQuery.eq("chat_status", "revision");
  } else if (filterStatus === "buenos") {
    customerQuery = customerQuery.eq("chat_status", "bueno");
  } else if (filterStatus === "ventas") {
    customerQuery = customerQuery.eq("chat_status", "venta");
  }

  // We need to sort by last message time, but we don't have it on customers table.
  // So fetch a larger batch sorted by updated_at and then re-sort client side.
  // This is the fallback - not perfect but much better than loading all logs.
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: customers, error: custError, count } = await customerQuery
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (custError) throw custError;
  if (!customers || customers.length === 0) {
    return { items: [], totalCount: count ?? 0 };
  }

  // 2. For these customers, get last message using DISTINCT ON pattern via RPC
  // Since we can't do DISTINCT ON via PostgREST, fetch last message per customer
  const customerIds = customers.map(c => c.id);

  // Batch: get the most recent log per customer in this page
  const { data: lastMessages, error: msgError } = await supabase
    .from("whatsapp_logs")
    .select("customer_id, content, message_type, created_at")
    .in("customer_id", customerIds)
    .order("created_at", { ascending: false });

  if (msgError) throw msgError;

  // Deduplicate: keep only first (most recent) per customer
  const lastMsgMap = new Map<string, { content: string; message_type: string; created_at: string }>();
  for (const msg of (lastMessages || [])) {
    if (!lastMsgMap.has(msg.customer_id)) {
      lastMsgMap.set(msg.customer_id, msg);
    }
  }

  const items: ChatSummary[] = customers.map(c => {
    const msg = lastMsgMap.get(c.id);
    return {
      customer_id: c.id,
      customer_name: c.name || "Sin nombre",
      customer_phone: c.phone,
      last_message: msg?.content || "",
      last_message_at: msg?.created_at || "",
      message_count: 0, // Not available in fallback without expensive count
      chat_status: (c as any).chat_status || "revision",
      conversation_mode: c.conversation_mode || "ai",
    };
  });

  // Sort by last_message_at descending
  items.sort((a, b) => {
    if (!a.last_message_at && !b.last_message_at) return 0;
    if (!a.last_message_at) return 1;
    if (!b.last_message_at) return -1;
    return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
  });

  return { items, totalCount: count ?? 0 };
}

/**
 * Paginated messages for a single conversation.
 * Loads MESSAGES_PAGE_SIZE at a time, newest first, then reverses for display.
 */
export function useChatMessages(customerId: string | null) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ["chat-messages", customerId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!customerId) return { messages: [], nextPage: null, totalCount: 0 };

      const from = pageParam * MESSAGES_PAGE_SIZE;
      const to = from + MESSAGES_PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from("whatsapp_logs")
        .select("id, customer_id, content, message_type, is_automated, ai_agent_phase, created_at, media_url, media_type", { count: "exact" })
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const messages = (data as ChatMessage[]) || [];
      const totalCount = count ?? 0;
      const hasMore = (pageParam + 1) * MESSAGES_PAGE_SIZE < totalCount;

      return {
        messages,
        nextPage: hasMore ? pageParam + 1 : null,
        totalCount,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!customerId,
  });

  // Flatten all pages into a single array, reversed to show oldest first
  const allMessages = useMemo(() => {
    if (!query.data) return [];
    const msgs = query.data.pages.flatMap(p => p.messages);
    // Messages are fetched newest-first; reverse for chronological display
    return msgs.reverse();
  }, [query.data]);

  const totalCount = query.data?.pages[0]?.totalCount ?? 0;

  // Realtime subscription for new messages
  useEffect(() => {
    if (!customerId) return;

    const channel = supabase
      .channel(`whatsapp_logs:${customerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "whatsapp_logs",
          filter: `customer_id=eq.${customerId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chat-messages", customerId] });
          queryClient.invalidateQueries({ queryKey: ["chat-list"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerId, queryClient]);

  return {
    data: allMessages,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    totalCount,
  };
}

const MANUAL_MESSAGE_WEBHOOK_URL = "https://n8n.groupquimera.com/webhook/3f5c16f0-3b20-4429-abbe-ba2a87c25718";

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      customerId,
      content,
      customerPhone,
      customerName,
    }: {
      customerId: string;
      content: string;
      customerPhone?: string;
      customerName?: string;
    }) => {
      const { error } = await supabase.from("whatsapp_logs").insert({
        customer_id: customerId,
        content,
        message_type: "outgoing",
        is_automated: false,
        ai_agent_phase: "manual",
      });
      if (error) throw error;

      try {
        await fetch(MANUAL_MESSAGE_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          mode: "no-cors",
          body: JSON.stringify({
            customer_id: customerId,
            customer_phone: customerPhone || "",
            customer_name: customerName || "",
            content,
          }),
        });
      } catch (webhookError) {
        console.error("Webhook delivery failed:", webhookError);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", variables.customerId] });
      queryClient.invalidateQueries({ queryKey: ["chat-list"] });
    },
    onError: (err: Error) => toast.error("Error al enviar: " + err.message),
  });
}

export function useSetChatClassification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ customerId, status }: { customerId: string; status: string }) => {
      const { error } = await supabase.from("customers").update({ chat_status: status }).eq("id", customerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-list"] });
      queryClient.invalidateQueries({ queryKey: ["chat-customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Clasificación actualizada");
    },
    onError: (err: Error) => toast.error("Error: " + err.message),
  });
}

export function useToggleConversationMode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ customerId, mode }: { customerId: string; mode: "ai" | "manual" }) => {
      const { error } = await supabase.from("customers").update({ conversation_mode: mode }).eq("id", customerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-list"] });
      queryClient.invalidateQueries({ queryKey: ["chat-customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Modo de conversación actualizado");
    },
    onError: (err: Error) => toast.error("Error: " + err.message),
  });
}
