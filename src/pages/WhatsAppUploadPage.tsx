import { useEffect, useState } from "react";
import { Loader2, Bot } from "lucide-react";
import { whatsAppAssistant } from "../lib/gemini";

interface WhatsAppUploadPageProps {
  onNavigate: (page: string) => void;
}

export function WhatsAppUploadPage({ onNavigate }: WhatsAppUploadPageProps) {
  const [hasLoaded, setHasLoaded] = useState(false);
  useEffect(() => {
    if (hasLoaded) return; // Prevent duplicate loading

    const loadData = async () => {
      setHasLoaded(true);
      try {
        console.log("🔄 Loading all WhatsApp chat data...");
        await whatsAppAssistant.loadAllData();

        const stats = whatsAppAssistant.getStats();
        console.log("✅ Data loaded successfully:", stats);

        // Redirect to chat page
        onNavigate("whatsapp-chat");
      } catch (error) {
        console.error("❌ Error loading data:", error);
        // Still redirect to chat page even if there's an error
        onNavigate("whatsapp-chat");
      }
    };

    loadData();
  }, [onNavigate, hasLoaded]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            مساعد الذكاء الاصطناعي
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            جاري تحميل محادثات مجموعة الحاسبات والمعلومات...
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-700 dark:text-gray-300">
              جاري التحميل...
            </span>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>• تحميل ملف البيانات الموحد من GitHub</p>
            <p>• تحليل ومعالجة النصوص</p>
            <p>• إعداد نظام البحث والذكاء الاصطناعي</p>
          </div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          سيتم توجيهك تلقائياً للمحادثة بعد انتهاء التحميل
        </p>
      </div>
    </div>
  );
}
