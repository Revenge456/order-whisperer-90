import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatList } from "@/components/chat/ChatList";
import { ChatConversation } from "@/components/chat/ChatConversation";
import { useChatList, useChatMessages } from "@/hooks/useChatHistory";
import type { ChatFilter } from "@/hooks/useChatHistory";

const PAGE_SIZE = 50;

export default function ChatHistory() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ChatFilter>('all');
  const [page, setPage] = useState(0);

  const { data: chatList, isLoading: listLoading, totalCount } = useChatList(search, filterStatus, page);
  const {
    data: messages = [],
    isLoading: messagesLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    totalCount: messageCount,
  } = useChatMessages(selectedCustomerId);

  const selectedChat = chatList.find(c => c.customer_id === selectedCustomerId);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Reset page when search/filter changes
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleFilterChange = (value: ChatFilter) => {
    setFilterStatus(value);
    setPage(0);
  };

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
            onSearchChange={handleSearchChange}
            filterStatus={filterStatus}
            onFilterChange={handleFilterChange}
            totalCount={totalCount}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
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
          hasOlderMessages={!!hasNextPage}
          loadOlderMessages={fetchNextPage}
          isLoadingOlder={isFetchingNextPage}
          totalMessageCount={messageCount}
        />
      </div>
    </DashboardLayout>
  );
}
