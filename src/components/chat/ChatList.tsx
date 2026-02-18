import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Bot, MessageSquare, CheckCircle, ShoppingCart, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { ChatSummary, ChatFilter } from "@/hooks/useChatHistory";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChatListProps {
  chats: ChatSummary[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (customerId: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  filterStatus: ChatFilter;
  onFilterChange: (value: ChatFilter) => void;
}

export function ChatList({
  chats,
  isLoading,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  filterStatus,
  onFilterChange,
}: ChatListProps) {
  return (
    <div className="flex flex-col h-full border-r border-border">
      {/* Header */}
      <div className="p-4 space-y-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Chats
            <Badge variant="secondary" className="ml-1">{chats.length}</Badge>
          </h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-muted/50"
          />
        </div>
        {/* Filter tabs */}
        <Tabs value={filterStatus} onValueChange={(v) => onFilterChange(v as ChatFilter)} className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-8">
            <TabsTrigger value="all" className="text-[10px] px-1">Todos</TabsTrigger>
            <TabsTrigger value="revision" className="text-[10px] px-1">Revisión</TabsTrigger>
            <TabsTrigger value="buenos" className="text-[10px] px-1">Buenos</TabsTrigger>
            <TabsTrigger value="ventas" className="text-[10px] px-1">Ventas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Chat list */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <MessageSquare className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm">No se encontraron chats</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {chats.map((chat) => {
              const isSelected = selectedId === chat.customer_id;
              const initials = chat.customer_name
                .split(' ')
                .map(w => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <button
                  key={chat.customer_id}
                  onClick={() => onSelect(chat.customer_id)}
                  className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50 ${
                    isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                  }`}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-primary/20 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm text-foreground truncate">
                        {chat.customer_name}
                      </span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(chat.last_message_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {chat.last_message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {chat.conversation_mode === 'ai' && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1 border-primary/30 text-primary">
                          <Bot className="w-3 h-3" /> AI
                        </Badge>
                      )}
                      {chat.chat_status === 'revision' ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1 border-amber-500/30 text-amber-500">
                          <Eye className="w-3 h-3" /> Revisión
                        </Badge>
                      ) : chat.chat_status === 'bueno' ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1 border-green-500/30 text-green-500">
                          <CheckCircle className="w-3 h-3" /> Bueno
                        </Badge>
                      ) : chat.chat_status === 'venta' ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1 border-blue-500/30 text-blue-500">
                          <ShoppingCart className="w-3 h-3" /> Venta
                        </Badge>
                      ) : null}
                      <span className="text-[10px] text-muted-foreground">
                        {chat.message_count} msgs
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
