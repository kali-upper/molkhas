import React, { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, Bot, User, Trash2, X } from "lucide-react";
import { whatsAppAssistant } from "../lib/gemini";

interface WhatsAppChatPageProps {
  onNavigate: (page: string) => void;
}

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function WhatsAppChatPage({ onNavigate }: WhatsAppChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const stats = whatsAppAssistant.getStats();
  const aiStatus = whatsAppAssistant.getAIStatus();
  const hasChatData = stats.totalChunks > 0;

  // Local storage key for chat messages
  const CHAT_STORAGE_KEY = "whatsapp_chat_messages";

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(CHAT_STORAGE_KEY);
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error("Error loading chat messages from localStorage:", error);
      }
    }
  }, []);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
      } catch (error) {
        console.error("Error saving chat messages to localStorage:", error);
      }
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-reload data if no data is available
  useEffect(() => {
    const autoReloadData = async () => {
      if (stats.totalChunks === 0) {
        console.log("🔄 لا توجد بيانات، جاري تحميل البيانات تلقائياً...");
        try {
          await whatsAppAssistant.loadAllData();
          console.log("✅ تم تحميل البيانات تلقائياً");
        } catch (error) {
          console.error("❌ فشل في تحميل البيانات تلقائياً:", error);
        }
      }
    };

    autoReloadData();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await whatsAppAssistant.generateResponse(
        userMessage.content
      );

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        type: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: "assistant",
        content:
          "Sorry, I encountered an error while processing your question. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
  };

  const clearInput = () => {
    setInputMessage("");
    inputRef.current?.focus();
  };

  const clearData = () => {
    whatsAppAssistant.clearData();
    setMessages([]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
    onNavigate("whatsapp-upload");
  };

  const reloadData = async () => {
    try {
      console.log("🔄 إعادة تحميل بيانات المساعد...");
      await whatsAppAssistant.loadAllData();
      alert("✅ تم إعادة تحميل البيانات بنجاح! المعلومات محدثة الآن.");
    } catch (error) {
      console.error("❌ خطأ في إعادة تحميل البيانات:", error);
      alert("❌ فشل في إعادة تحميل البيانات. تحقق من اتصال الإنترنت.");
    }
  };

  const reEnableAI = async () => {
    const success = await whatsAppAssistant.forceReEnableAI();
    if (success) {
      // Force re-render to update the status
      window.location.reload();
    } else {
      alert(
        "فشل في إعادة تمكين الذكاء الاصطناعي. قد يكون الحد المسموح لا يزال مُستخدماً."
      );
    }
  };

  const saveApiKey = async () => {
    const trimmedKey = apiKeyInput.trim();

    if (!trimmedKey) {
      console.warn("يرجى إدخال مفتاح API صحيح");
      alert("يرجى إدخال مفتاح API صحيح");
      return;
    }

    // Save immediately to localStorage for instant feedback
    localStorage.setItem("user_gemini_api_key", trimmedKey);
    whatsAppAssistant.reinitializeGemini();
    setShowApiKeyModal(false);
    setApiKeyInput("");

    console.log("✅ تم حفظ مفتاح API فوراً");

    // Validate in background without blocking the user
    validateApiKeyInBackground(trimmedKey);
  };

  const validateApiKeyInBackground = async (apiKey: string) => {
    try {
      console.log("🔄 جاري التحقق من مفتاح API في الخلفية...");

      // Test the API key with a simple request
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const testGenAI = new GoogleGenerativeAI(apiKey);
      const testModel = testGenAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });

      // Simple test to verify the API key works
      const testResult = await testModel.generateContent(
        "Test API key validation"
      );
      await testResult.response;

      console.log("✅ تم التحقق من صحة مفتاح API بنجاح");

      // Update status to show validation was successful
      localStorage.setItem("gemini_api_status", "working");
      localStorage.setItem("gemini_last_test", Date.now().toString());
    } catch (error: any) {
      console.error("⚠️ تحذير: مفتاح API قد لا يعمل بشكل صحيح:", error);

      let errorMessage = "تحذير: مفتاح API قد لا يعمل بشكل صحيح. ";

      if (
        error.message?.includes("API_KEY") ||
        error.message?.includes("invalid")
      ) {
        errorMessage += "المفتاح غير صحيح.";
      } else if (
        error.message?.includes("429") ||
        error.message?.includes("quota")
      ) {
        errorMessage += "تم تجاوز حد الاستخدام.";
      } else if (
        error.message?.includes("network") ||
        error.message?.includes("fetch")
      ) {
        errorMessage += "مشكلة في الاتصال.";
      } else {
        errorMessage += "تحقق من صحة المفتاح.";
      }

      // Show warning but don't block the user - key is already saved
      setTimeout(() => {
        alert(
          errorMessage +
            "\n\nالمفتاح تم حفظه لكن قد لا يعمل. يمكنك تجربة استخدامه أو تغييره."
        );
      }, 1000);

      // Update status to indicate potential issue
      localStorage.setItem("gemini_api_status", "error");
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem("user_gemini_api_key");
    whatsAppAssistant.reinitializeGemini();
    console.log("تم مسح مفتاح API المخصص والرجوع للمفتاح الافتراضي");
  };

  const openApiKeyModal = () => {
    // Load existing API key from localStorage
    const existingKey = localStorage.getItem("user_gemini_api_key") || "";
    setApiKeyInput(existingKey);
    setShowApiKeyModal(true);
  };

  if (!hasChatData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No Chat Data Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Please upload a WhatsApp chat export first to start asking
            questions.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => onNavigate("home")}
              className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Quota Warning */}
      {aiStatus.status === "quota_exceeded" && (
        <div className="bg-yellow-100 dark:bg-yellow-900 border-b border-yellow-200 dark:border-yellow-700 px-4 py-2">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ تم تجاوز حد الاستخدام المجاني (20 طلب يومياً).
              {aiStatus.hoursUntilReset > 0 && (
                <span className="font-semibold">
                  {" "}
                  {aiStatus.hoursUntilReset} ساعة متبقية لإعادة التعيين.
                </span>
              )}
              <span className="block mt-1">
                النظام يعمل في وضع النسخ الاحتياطي (يعرض الرسائل ذات الصلة).
                <button
                  onClick={reEnableAI}
                  className="ml-2 text-yellow-900 dark:text-yellow-100 underline hover:no-underline font-medium"
                >
                  جرب إعادة التمكين
                </button>
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                WhatsApp AI Assistant
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats.totalMessages} messages loaded • AI:{" "}
                {aiStatus.isAIWorking ? "✅ Active" : "⚠️ Fallback mode"}
                {aiStatus.hasCustomApiKey && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400">
                    🔑 Custom API
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearChat}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              title="Clear chat history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={openApiKeyModal}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
              title="Set custom API key"
            >
              🔑 API Key
            </button>
            {!aiStatus.isAIWorking && (
              <button
                onClick={reEnableAI}
                className="px-3 py-1 text-sm text-green-600 hover:text-green-800"
                title="Re-enable AI after quota reset"
              >
                🔄 Enable AI
              </button>
            )}
            <button
              onClick={reloadData}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
              title="Reload latest data from GitHub"
            >
              🔄 Reload Data
            </button>
            <button
              onClick={clearData}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
              title="Clear all data and upload new chat"
            >
              Clear Data
            </button>
            <button
              onClick={() => onNavigate("home")}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              ← Home
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                WhatsApp AI Assistant 🤖
              </h3>
              <div className="mb-3">
                <p className="text-gray-700 dark:text-gray-200 font-semibold">
                  مرحبًا بك 👋
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                  هذا المساعد يجيب عن أي سؤال باستخدام رسائل مجموعة واتساب فقط
                  (بدون تخمين أو مصادر خارجية).
                </p>
                <p className="text-xs text-blue-800 bg-blue-100 dark:bg-blue-900 dark:text-blue-300 rounded p-2 inline-block mb-2">
                  تنويه: إجابات المساعد تعتمد على ما يُكتب في المجموعة — كلما
                  كانت الرسائل أوضح كلما أصبحت الإجابات أدق.
                </p>
                <p className="text-xs text-gray-400">
                  (المساعد لا يجيد المزاح أو الهزار ، ويتجنب الرسائل العشوائية
                  والفارغة)
                </p>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500 space-y-2">
                <p className="font-medium">
                  💡 أمثلة للأسئلة التي يمكنك طرحها (اضغط على أي سؤال):
                </p>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <button
                    onClick={() => setInputMessage("متى موعد الامتحان؟")}
                    className="text-left p-2 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    متى موعد الامتحان؟
                  </button>
                  <button
                    onClick={() =>
                      setInputMessage("مين الدكتور المسؤول عن المادة؟")
                    }
                    className="text-left p-2 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    مين الدكتور المسؤول عن المادة؟
                  </button>
                  <button
                    onClick={() =>
                      setInputMessage(
                        "هل لازم أكتب التقرير بالإنجليزي أم العربي؟"
                      )
                    }
                    className="text-left p-2 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    هل لازم أكتب التقرير بالإنجليزي أم العربي؟
                  </button>
                  <button
                    onClick={() => setInputMessage("ما هي محاضرات الفاينال؟")}
                    className="text-left p-2 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    ما هي محاضرات الفاينال؟
                  </button>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.type === "assistant" && (
                  <Bot className="w-8 h-8 text-blue-600 mt-1 flex-shrink-0" />
                )}
                <div
                  className={`max-w-3xl rounded-lg px-4 py-3 ${
                    message.type === "user"
                      ? "bg-blue-600 text-white ml-auto"
                      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-2 ${
                      message.type === "user"
                        ? "text-blue-100"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.type === "user" && (
                  <User className="w-8 h-8 text-gray-400 mt-1 flex-shrink-0" />
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex items-start space-x-3">
              <Bot className="w-8 h-8 text-blue-600 mt-1 flex-shrink-0" />
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="animate-pulse flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  messages.length > 0
                    ? "Continue the conversation... اسأل عن أي شيء في الدردشة"
                    : "Ask me anything about your WhatsApp chat... اسأل عن أي شيء في المجموعة"
                }
                className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                rows={1}
                style={{ minHeight: "48px", maxHeight: "120px" }}
                disabled={isLoading}
              />
              {inputMessage && !isLoading && (
                <button
                  onClick={clearInput}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  title="Clear message"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 transition-all duration-200 shadow-md hover:shadow-lg self-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                Enter
              </span>
              <span>للإرسال،</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                Shift + Enter
              </span>
              <span>لسطر جديد</span>
            </p>
            {isLoading && (
              <span className="text-xs text-blue-600 dark:text-blue-400 animate-pulse">
                جاري التفكير...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                إعداد مفتاح Google Gemini API
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مفتاح API الخاص بك:
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="أدخل مفتاح Google Gemini API"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  احصل على مفتاح API من:
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline ml-1"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={saveApiKey}
                  disabled={!apiKeyInput.trim()}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  حفظ المفتاح
                </button>
                <button
                  onClick={clearApiKey}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  مسح المفتاح
                </button>
                <button
                  onClick={() => {
                    setShowApiKeyModal(false);
                    setApiKeyInput("");
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
