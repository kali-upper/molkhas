import { useState } from "react";
import { BookOpen, Newspaper, Flag } from "lucide-react";
import { useSummaries } from "../hooks/useSummaries";
import { useNews } from "../hooks/useNews";
import { useAppeals } from "../hooks/useAppeals";
import { SummariesTab } from "../components/SummariesTab";
import { NewsTab } from "../components/NewsTab";
import { AppealsTab } from "../components/AppealsTab";
import { AddNewsModal } from "../components/AddNewsModal";

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

export function AdminDashboard({
  onNavigate: _onNavigate,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"summaries" | "news" | "appeals">(
    "summaries"
  );

  const summariesHook = useSummaries();
  const newsHook = useNews();
  const appealsHook = useAppeals();

  const isLoading =
    summariesHook.loading || newsHook.loading || appealsHook.loading;

  const renderTabContent = () => {
    switch (activeTab) {
      case "summaries":
        return (
          <SummariesTab
            summaries={summariesHook.summaries}
            onUpdateStatus={summariesHook.updateStatus}
            onDeleteSummary={summariesHook.deleteSummary}
            onClearAllSummaries={summariesHook.clearAllSummaries}
          />
        );
      case "news":
        return (
          <NewsTab
            news={newsHook.news}
            onToggleStatus={newsHook.toggleNewsStatus}
            onSetShowAddNews={newsHook.setShowAddNews}
          />
        );
      case "appeals":
        return <AppealsTab appeals={appealsHook.appeals} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            جاري التحميل...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          لوحة تحكم المشرفين
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          إدارة ومراجعة الملخصات المقدمة
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("summaries")}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === "summaries"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            الملخصات
          </button>
          <button
            onClick={() => setActiveTab("news")}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === "news"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <Newspaper className="w-4 h-4" />
            الأخبار
          </button>
          <button
            onClick={() => setActiveTab("appeals")}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === "appeals"
                ? "border-orange-500 text-orange-600 dark:text-orange-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <Flag className="w-4 h-4" />
            الطعون
          </button>
        </div>

        {renderTabContent()}
      </div>

      <AddNewsModal
        showAddNews={newsHook.showAddNews}
        newNews={newsHook.newNews}
        onSetShowAddNews={newsHook.setShowAddNews}
        onSetNewNews={newsHook.setNewNews}
        onAddNews={newsHook.addNews}
      />
    </div>
  );
}
