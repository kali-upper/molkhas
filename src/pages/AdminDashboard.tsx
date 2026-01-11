import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Newspaper, Flag, BarChart3 } from "lucide-react";
import { useSummaries } from "../hooks/useSummaries";
import { useNews } from "../hooks/useNews";
import { useAppeals } from "../hooks/useAppeals";
import { useNotifications } from "../hooks/useNotifications";
import { SummariesTab } from "../components/SummariesTab";
import { NewsTab } from "../components/NewsTab";
import { AppealsTab } from "../components/AppealsTab";
import { AddNewsModal } from "../components/AddNewsModal";
import { EditSummaryModal } from "../components/EditSummaryModal";
import { AdminAnalyticsPage } from "./AdminAnalyticsPage";
import type { Summary } from "../types/database";

// Memoized tab components to prevent unnecessary re-renders
const MemoizedSummariesTab = React.memo(SummariesTab);
const MemoizedNewsTab = React.memo(NewsTab);
const MemoizedAppealsTab = React.memo(AppealsTab);
const MemoizedAdminAnalyticsPage = React.memo(AdminAnalyticsPage);

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "summaries" | "news" | "appeals" | "analytics"
  >("summaries");

  const summariesHook = useSummaries();
  const newsHook = useNews();
  const appealsHook = useAppeals();
  const { notifyAllUsers } = useNotifications();

  // Memoize loading state to prevent unnecessary recalculations
  const isLoading = useMemo(
    () => summariesHook.loading || newsHook.loading || appealsHook.loading,
    [summariesHook.loading, newsHook.loading, appealsHook.loading]
  );

  // دالة مخصصة لتحديث status الملخصات مع إرسال إشعارات
  const handleUpdateSummaryStatus = async (
    id: string,
    status: "approved" | "rejected"
  ) => {
    const oldSummary = summariesHook.summaries.find((s) => s.id === id);
    await summariesHook.updateStatus(id, status);

    // إرسال إشعار لجميع المستخدمين عند نشر ملخص
    if (status === "approved" && oldSummary) {
      notifyAllUsers(
        "ملخص جديد متاح!",
        `تم نشر ملخص جديد: "${oldSummary.title}" في مادة ${oldSummary.subject}`,
        "content_published",
        id,
        "summary"
      );
    }
  };

  // Only log loading changes, not on every render
  useEffect(() => {
    if (isLoading) {
      console.log("AdminDashboard: Loading data...");
    } else if (summariesHook.summaries.length > 0) {
      console.log("AdminDashboard: Data loaded successfully");
    }
  }, [isLoading, summariesHook.summaries.length]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "summaries":
        return (
          <MemoizedSummariesTab
            summaries={summariesHook.summaries}
            onUpdateStatus={handleUpdateSummaryStatus}
            onDeleteSummary={summariesHook.deleteSummary}
            onEditSummary={handleEditSummary}
            onClearAllSummaries={summariesHook.clearAllSummaries}
          />
        );
      case "news":
        return (
          <MemoizedNewsTab
            news={newsHook.news}
            onToggleStatus={newsHook.toggleNewsStatus}
            onSetShowAddNews={newsHook.setShowAddNews}
            onDeleteNews={newsHook.deleteNews}
          />
        );
      case "appeals":
        return (
          <MemoizedAppealsTab
            appeals={appealsHook.appeals}
            onAcceptAppeal={appealsHook.acceptAppeal}
            onRejectAppeal={appealsHook.rejectAppeal}
            onDeleteAppeal={appealsHook.deleteAppeal}
          />
        );
      case "analytics":
        return (
          <MemoizedAdminAnalyticsPage
            onNavigate={(page) => navigate(page === "home" ? "/" : `/${page}`)}
          />
        );
      default:
        return null;
    }
  };

  const [editingSummary, setEditingSummary] = useState<Summary | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleEditSummary = (summary: Summary) => {
    setEditingSummary(summary);
    setShowEditModal(true);
  };

  const handleSaveSummary = async (id: string, updates: any) => {
    await summariesHook.editSummary(id, updates);
    setShowEditModal(false);
    setEditingSummary(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Tab Navigation Skeleton */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
          <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>

        {/* Content Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 animate-pulse"
              >
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-3"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3 mb-4"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-600 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          لوحة تحكم المشرفين
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          إدارة ومراجعة الملخصات المقدمة
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 transition-colors">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700 scroll-x-mobile">
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
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === "analytics"
                ? "border-green-500 text-green-600 dark:text-green-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            التحليلات
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

      <EditSummaryModal
        summary={editingSummary}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveSummary}
      />
    </div>
  );
}

export default AdminDashboard;
