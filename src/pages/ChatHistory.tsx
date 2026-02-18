import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatList } from "@/components/chat/ChatList";
import { ChatConversation } from "@/components/chat/ChatConversation";
import { useChatList, useChatMessages } from "@/hooks/useChatHistory";
import type { ChatFilter } from "@/hooks/useChatHistory";

export default function ChatHistory() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ChatFilter>('all');

  const { data: chatList, isLoading: listLoading } = useChatList(search, filterStatus);
  const { data: messages = [], isLoading: messagesLoading } = useChatMessages(selectedCustomerId);

  const selectedChat = chatList.find(c => c.customer_id === selectedCustomerId);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-7rem)] flex rounded-xl border border-border bg-card overflow-hidden">
        {/* Left panel - Chat list */}
        <div className="w-80 shrink-0">
          <ChatList
            chats={chatList}
            isLoading={listLoading}
            selectedId={selectedCustomerId}
            onSelect={setSelectedCustomerId}
            search={search}
            onSearchChange={setSearch}
            filterStatus={filterStatus}
            onFilterChange={setFilterStatus}
          />
        </div>

        {/* Right panel - Conversation */}
        <ChatConversation
          messages={messages}
          isLoading={messagesLoading}
          customerName={selectedChat?.customer_name ?? ""}
          customerPhone={selectedChat?.customer_phone ?? ""}
          customerId={selectedCustomerId}
          chatStatus={selectedChat?.chat_status ?? 'revision'}
          conversationMode={selectedChat?.conversation_mode ?? 'ai'}
        />
      </div>
    </DashboardLayout>
  );
}
