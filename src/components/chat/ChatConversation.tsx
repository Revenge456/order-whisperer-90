import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Bot, User, MessageSquare, Phone, Send } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ChatMessage } from "@/hooks/useChatHistory";
import { useSendMessage, useToggleConversationMode } from "@/hooks/useChatHistory";

interface ChatConversationProps {
  messages: ChatMessage[];
  isLoading: boolean;
  customerName: string;
  customerPhone: string;
  customerId: string | null;
  conversationMode: 'ai' | 'manual';
}

export function ChatConversation({
  messages,
  isLoading,
  customerName,
  customerPhone,
  customerId,
  conversationMode,
}: ChatConversationProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const sendMessage = useSendMessage();
  const toggleMode = useToggleConversationMode();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !customerId) return;
    sendMessage.mutate({ customerId, content: input.trim() });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!customerName) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
        <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">Selecciona una conversación</p>
        <p className="text-sm mt-1">Elige un chat para ver el historial de mensajes</p>
      </div>
    );
  }

  const isManual = conversationMode === 'manual';

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

        {/* AI/Manual toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{isManual ? 'Manual' : 'AI Agent'}</span>
          <Switch
            checked={isManual}
            onCheckedChange={(checked) => {
              if (customerId) {
                toggleMode.mutate({ customerId, mode: checked ? 'manual' : 'ai' });
              }
            }}
          />
          <Badge variant={isManual ? "secondary" : "default"} className="text-[10px]">
            {isManual ? <User className="w-3 h-3 mr-1" /> : <Bot className="w-3 h-3 mr-1" />}
            {isManual ? 'Manual' : 'AI'}
          </Badge>
        </div>

        <Badge variant="secondary" className="text-xs">
          {messages.length} mensajes
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

      {/* Message input */}
      <div className="px-4 py-3 border-t border-border bg-card/50">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            className="min-h-[40px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Este mensaje se guarda como registro interno. {isManual ? '⚠️ Modo Manual activo' : '🤖 AI Agent activo'}
        </p>
      </div>
    </div>
  );
}
