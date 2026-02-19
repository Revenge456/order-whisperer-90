import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, User, MessageSquare, Phone, CheckCircle, ShoppingCart, Eye, Send } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ChatMessage } from "@/hooks/useChatHistory";
import { useSetChatClassification, useToggleConversationMode, useSendMessage } from "@/hooks/useChatHistory";

interface ChatConversationProps {
  messages: ChatMessage[];
  isLoading: boolean;
  customerName: string;
  customerPhone: string;
  customerId: string | null;
  chatStatus: string;
  conversationMode: string;
}

const STATUS_OPTIONS = [
  { value: 'revision', label: 'Revisión', icon: Eye, color: 'text-amber-500' },
  { value: 'bueno', label: 'Bueno', icon: CheckCircle, color: 'text-green-500' },
  { value: 'venta', label: 'Venta', icon: ShoppingCart, color: 'text-blue-500' },
];

export function ChatConversation({
  messages,
  isLoading,
  customerName,
  customerPhone,
  customerId,
  chatStatus,
  conversationMode,
}: ChatConversationProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const setClassification = useSetChatClassification();
  const toggleMode = useToggleConversationMode();
  const sendMessage = useSendMessage();
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!customerName) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
        <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">Selecciona una conversación</p>
        <p className="text-sm mt-1">Elige un chat para ver el historial de mensajes</p>
      </div>
    );
  }

  const currentStatus = STATUS_OPTIONS.find(s => s.value === chatStatus) || STATUS_OPTIONS[0];
  const isAiMode = conversationMode === 'ai';

  const handleSend = () => {
    const text = messageText.trim();
    if (!text || !customerId) return;
    sendMessage.mutate({ customerId, content: text, customerPhone, customerName });
    setMessageText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3 border-b border-border flex items-center gap-3 bg-card/50">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
            {customerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground truncate">{customerName}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="w-3 h-3" /> {customerPhone}
          </p>
        </div>

        {/* AI Mode Toggle */}
        <div className="flex items-center gap-2 border-r border-border pr-3">
          <Bot className={`w-4 h-4 ${isAiMode ? 'text-primary' : 'text-muted-foreground'}`} />
          <Switch
            checked={isAiMode}
            onCheckedChange={(checked) => {
              if (customerId) {
                toggleMode.mutate({ customerId, mode: checked ? 'ai' : 'manual' });
              }
            }}
            className="scale-90"
          />
          <span className="text-[10px] font-medium text-muted-foreground">
            {isAiMode ? 'AI' : 'Manual'}
          </span>
        </div>

        {/* Classification Select */}
        <Select
          value={chatStatus}
          onValueChange={(value) => {
            if (customerId) {
              setClassification.mutate({ customerId, status: value });
            }
          }}
        >
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue>
              <span className="flex items-center gap-1.5">
                <currentStatus.icon className={`w-3.5 h-3.5 ${currentStatus.color}`} />
                {currentStatus.label}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="flex items-center gap-2">
                  <opt.icon className={`w-3.5 h-3.5 ${opt.color}`} />
                  {opt.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Badge variant="secondary" className="text-xs">
          {messages.length} msgs
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <Skeleton className="h-14 w-3/5 rounded-xl" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <MessageSquare className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm">Sin mensajes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, idx) => {
              const isOutgoing = msg.message_type === 'outgoing';
              const showDate =
                idx === 0 ||
                format(new Date(msg.created_at), 'yyyy-MM-dd') !==
                  format(new Date(messages[idx - 1].created_at), 'yyyy-MM-dd');

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        {format(new Date(msg.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                      </Badge>
                    </div>
                  )}
                  <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        isOutgoing
                          ? 'bg-primary/15 text-foreground rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {isOutgoing ? (
                          <Bot className="w-3 h-3 text-primary" />
                        ) : (
                          <User className="w-3 h-3 text-muted-foreground" />
                        )}
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {isOutgoing ? (msg.is_automated ? 'AI Agent' : 'Operador') : customerName}
                        </span>
                        {msg.ai_agent_phase && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/20 text-primary">
                            {msg.ai_agent_phase}
                          </Badge>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 text-right">
                        {format(new Date(msg.created_at), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t border-border p-3 bg-card/50">
        <div className="flex items-end gap-2">
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            className="min-h-[40px] max-h-[120px] resize-none text-sm"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!messageText.trim() || sendMessage.isPending}
            className="shrink-0 h-10 w-10"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
