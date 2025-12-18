import { useState } from "react";
import { X, Users, User } from "lucide-react";
import { useChat } from "../contexts/ChatContext";
import { useAuth } from "../contexts/AuthContext";

interface CreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateChatModal({ isOpen, onClose }: CreateChatModalProps) {
  const { createChat } = useChat();
  const { user, loading: authLoading } = useAuth();
  const [chatName, setChatName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // قائمة مستخدمين تجريبية - في التطبيق الحقيقي ستأتي من قاعدة البيانات
  const availableUsers = [
    { id: "user1", name: "أحمد محمد", email: "ahmed@example.com" },
    { id: "user2", name: "فاطمة علي", email: "fatima@example.com" },
    { id: "user3", name: "محمد حسن", email: "mohamed@example.com" },
    { id: "user4", name: "سارة أحمد", email: "sara@example.com" },
  ];

  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateChat = async () => {
    if (!user || isLoading || authLoading) {
      console.warn(
        "Attempted to create chat while not authenticated or still loading."
      );
      return;
    }
    // Allow creating chat even without participants for testing
    setIsLoading(true);
    try {
      await createChat(selectedUsers, chatName.trim() || undefined);
      setChatName("");
      setSelectedUsers([]);
      onClose();
    } catch (error) {
      console.error("Error creating chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl text-center text-gray-700 dark:text-gray-300">
          <p>Loading user authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl text-center text-gray-700 dark:text-gray-300">
          <p>You must be logged in to create a chat.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            إنشاء محادثة جديدة
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Chat Name (for group chats) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              اسم المحادثة (اختياري)
            </label>
            <input
              type="text"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              placeholder="أدخل اسم المحادثة..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Users Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              اختر المشاركين
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableUsers.map((availableUser) => (
                <div
                  key={availableUser.id}
                  onClick={() => handleUserToggle(availableUser.id)}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedUsers.includes(availableUser.id)
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex-shrink-0 ml-3">
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {availableUser.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {availableUser.email}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {selectedUsers.includes(availableUser.id) && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Users className="w-4 h-4" />
              <span>
                {selectedUsers.length === 0 && "دردشة تجريبية (بدون مشاركين)"}
                {selectedUsers.length === 1 && "محادثة فردية"}
                {selectedUsers.length > 1 &&
                  `محادثة جماعية (${selectedUsers.length} مشاركين)`}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleCreateChat}
            disabled={isLoading || authLoading || !user}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {isLoading ? "جاري الإنشاء..." : "إنشاء المحادثة"}
          </button>
        </div>
      </div>
    </div>
  );
}
