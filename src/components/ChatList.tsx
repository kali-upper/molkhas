import { useState } from "react";
import { MessageSquare, Users, Plus, Search } from "lucide-react";
import { useChat } from "../contexts/ChatContext";
import { useAuth } from "../contexts/AuthContext";
import { ChatWithDetails } from "../types/database";

interface ChatListProps {
  onChatSelect: (chatId: string) => void;
  onCreateChat: () => void;
  selectedChatId?: string;
}

export function ChatList({
  onChatSelect,
  onCreateChat,
  selectedChatId,
}: ChatListProps) {
  const { chats, loading } = useChat();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredChats = chats.filter((chat) => {
    if (!searchTerm) return true;

    if (chat.name) {
      return chat.name.toLowerCase().includes(searchTerm.toLowerCase());
    }

    // For individual chats, search in participant names
    return chat.chat_participants.some((participant) => {
      // This would need to be enhanced to show actual names
      return participant.user_id !== user?.id;
    });
  });

  const formatLastMessageTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "الآن";
    if (diffInMinutes < 60) return `${diffInMinutes}د`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}س`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}ي`;

    return date.toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
  };

  const getChatDisplayName = (chat: ChatWithDetails) => {
    if (chat.name) return chat.name;

    // For individual chats, show the other participant's name
    const otherParticipant = chat.chat_participants.find(
      (p) => p.user_id !== user?.id
    );
    if (otherParticipant) {
      // This would need to be enhanced to show actual display names
      return `محادثة مع ${otherParticipant.user_id}`;
    }

    return "محادثة";
  };

  const getLastMessage = (chat: ChatWithDetails) => {
    if (!chat.messages || chat.messages.length === 0) return "لا توجد رسائل";

    const lastMessage = chat.messages[chat.messages.length - 1];

    // Truncate long messages
    const content =
      lastMessage.content.length > 50
        ? lastMessage.content.substring(0, 50) + "..."
        : lastMessage.content;

    return lastMessage.sender_id === user?.id ? `أنت: ${content}` : content;
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            المحادثات
          </h2>
          <button
            onClick={onCreateChat}
            className="p-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            title="إنشاء محادثة جديدة"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="البحث في المحادثات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {searchTerm ? "لا توجد محادثات مطابقة" : "لا توجد محادثات بعد"}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onChatSelect(chat.id)}
                className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedChatId === chat.id
                    ? "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-600"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 rtl:space-x-reverse flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {chat.type === "group" ? (
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {getChatDisplayName(chat)}
                        </h3>
                        {chat.messages && chat.messages.length > 0 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatLastMessageTime(
                              chat.messages[chat.messages.length - 1].created_at
                            )}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {getLastMessage(chat)}
                      </p>
                      {chat.type === "group" && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {chat.chat_participants.length} أعضاء
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
