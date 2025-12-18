import { useState, useRef, useEffect } from "react";
import { Send, Users, Bot, Eye, EyeOff } from "lucide-react";
import { useChat } from "../contexts/ChatContext";
import { useAuth } from "../contexts/AuthContext";
import { MessageWithSender, ChatWithDetails } from "../types/database";

interface ChatWindowProps {
  chat: ChatWithDetails;
  onBack?: () => void;
}

export function ChatWindow({ chat, onBack }: ChatWindowProps) {
  const {
    messages,
    aiSummaries,
    sendMessage,
    sendingMessage,
    triggerAISummarization,
  } = useChat();
  const { user } = useAuth();
  const [messageInput, setMessageInput] = useState("");
  const [showAISummaries, setShowAISummaries] = useState(false);
  const [aiSummarizing, setAiSummarizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || sendingMessage) return;

    try {
      await sendMessage(chat.id, messageInput.trim());
      setMessageInput("");
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleAISummarization = async () => {
    if (aiSummarizing) return;

    setAiSummarizing(true);
    try {
      await triggerAISummarization(chat.id);
    } catch (error) {
      console.error("Error triggering AI summarization:", error);
    } finally {
      setAiSummarizing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSummaryTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSenderDisplayName = (message: MessageWithSender) => {
    return (
      message.sender?.raw_user_meta_data?.display_name ||
      message.sender?.raw_user_meta_data?.name ||
      message.sender?.email?.split("@")[0] ||
      "مستخدم"
    );
  };

  const isOwnMessage = (message: MessageWithSender) => {
    return message.sender_id === user?.id;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            {onBack && (
              <button
                onClick={onBack}
                className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ←
              </button>
            )}
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              {chat.type === "group" ? (
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {getSenderDisplayName(
                      messages.find((m) => m.sender_id !== user?.id) ||
                        messages[0]
                    )
                      ?.charAt(0)
                      ?.toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {chat.name ||
                    getSenderDisplayName(
                      messages.find((m) => m.sender_id !== user?.id) ||
                        messages[0]
                    )}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {chat.type === "group"
                    ? `${chat.chat_participants.length} أعضاء`
                    : "محادثة فردية"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Manual AI Summarization */}
            <button
              onClick={handleAISummarization}
              disabled={aiSummarizing}
              className="flex items-center gap-2 px-3 py-1 rounded-md bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="إنشاء ملخص ذكي للمحادثة"
            >
              <Bot className="w-4 h-4" />
              {aiSummarizing ? "جاري التلخيص..." : "تلخيص ذكي"}
            </button>

            {/* AI Summaries Toggle */}
            {aiSummaries.length > 0 && (
              <button
                onClick={() => setShowAISummaries(!showAISummaries)}
                className="flex items-center gap-2 px-3 py-1 rounded-md bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors"
              >
                <Bot className="w-4 h-4" />
                {showAISummaries ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                التلخيصات ({aiSummaries.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Summaries Panel */}
      {showAISummaries && aiSummaries.length > 0 && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/10 max-h-48 overflow-y-auto">
          <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-3">
            تلخيصات الذكاء الاصطناعي
          </h3>
          <div className="space-y-3">
            {aiSummaries.map((summary) => (
              <div
                key={summary.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatSummaryTime(summary.created_at)}
                  </span>
                </div>
                {summary.summary_content && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {summary.summary_content}
                  </p>
                )}
                {summary.important_messages && (
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    <strong>رسائل مهمة:</strong>{" "}
                    {JSON.stringify(summary.important_messages)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            لا توجد رسائل في هذه المحادثة بعد
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                isOwnMessage(message) ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isOwnMessage(message)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                }`}
              >
                {!isOwnMessage(message) && chat.type === "group" && (
                  <div className="text-xs opacity-75 mb-1">
                    {getSenderDisplayName(message)}
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                <div
                  className={`text-xs mt-1 ${
                    isOwnMessage(message)
                      ? "text-blue-200"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {formatMessageTime(message.created_at)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <input
            ref={inputRef}
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="اكتب رسالتك..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={sendingMessage}
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || sendingMessage}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {sendingMessage ? (
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
