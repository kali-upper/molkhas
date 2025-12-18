import { useState } from "react";
import { ChatList } from "../components/ChatList";
import { ChatWindow } from "../components/ChatWindow";
import { CreateChatModal } from "../components/CreateChatModal";
import { useChat } from "../contexts/ChatContext";

function ChatPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { currentChat, selectChat } = useChat();

  const handleChatSelect = async (chatId: string) => {
    setSelectedChatId(chatId);
    await selectChat(chatId);
  };

  const handleCreateChat = () => {
    setShowCreateModal(true);
  };

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* قائمة الدردشات */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <ChatList
          onChatSelect={handleChatSelect}
          onCreateChat={handleCreateChat}
          selectedChatId={selectedChatId || undefined}
        />
      </div>

      {/* نافذة الدردشة */}
      <div className="flex-1 bg-white dark:bg-gray-800">
        {currentChat ? (
          <ChatWindow
            chat={currentChat}
            onBack={() => setSelectedChatId(null)}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                مرحباً بك في الدردشة
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                اختر محادثة من القائمة على اليمين لبدء الدردشة، أو أنشئ محادثة
                جديدة
              </p>
              <button
                onClick={handleCreateChat}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                إنشاء محادثة جديدة
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Chat Modal */}
      <CreateChatModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}

export default ChatPage;
