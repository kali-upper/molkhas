import { useEffect, useState } from "react";
import { FileText, Calendar, BookOpen } from "lucide-react";
import { useSummaries } from "../hooks/useSummaries";
import { useAuth } from "../contexts/AuthContext";
import { useAnalytics } from "../hooks/useAnalytics";
import { EditSummaryModal } from "../components/EditSummaryModal";
import { Summary } from "../types/database";

interface HomePageProps {
  onNavigate: (page: string, id?: string) => void;
}

function HomePage({ onNavigate }: HomePageProps) {
  const { user, isAdmin } = useAuth();
  const summariesHook = useSummaries();
  const { trackSummaryClick } = useAnalytics();
  const [trendingSummaries, setTrendingSummaries] = useState<Summary[]>([]);
  const [editingSummary, setEditingSummary] = useState<Summary | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    // For now, show approved summaries sorted by creation date (newest first)
    // Later we can add view counts and sort by actual popularity
    const approvedSummaries = summariesHook.summaries
      .filter((summary) => summary.status === "approved")
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 6); // Show only top 6 trending items

    setTrendingSummaries(approvedSummaries);
  }, [summariesHook.summaries]);

  const handleEditSummary = (summary: Summary) => {
    setEditingSummary(summary);
    setShowEditModal(true);
  };

  const handleSaveSummary = async (id: string, updates: any) => {
    await summariesHook.editSummary(id, updates);
    setShowEditModal(false);
    setEditingSummary(null);
  };

  return (
    <div className="space-y-6">
      {/* Trending Summaries */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          🔥 الترندات
        </h2>

        {trendingSummaries.length === 0 ? (
          <div className="text-center py-8 loading-placeholder">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              جاري تحميل الترندات...
            </p>
          </div>
        ) : (
          <div className="summary-grid">
            {trendingSummaries.map((summary) => {
              const canEdit = user && (isAdmin || summary.user_id === user.id);

              return (
                <div
                  key={summary.id}
                  className="summary-card bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all p-4 cursor-pointer border border-gray-200 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-700 touch-manipulation relative"
                >
                  {canEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSummary(summary);
                      }}
                      className="absolute top-2 left-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded bg-white dark:bg-gray-800 shadow-sm"
                      title="تعديل الملخص"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  )}

                  <div
                    onClick={() => {
                      trackSummaryClick(summary.id, "trending_click");
                      onNavigate("summary", summary.id);
                    }}
                  >
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 pr-6">
                      {summary.title}
                    </h3>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <BookOpen className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <span className="truncate">{summary.subject}</span>
                      </div>

                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span className="truncate">
                          {summary.year} - {summary.department}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {summary.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <EditSummaryModal
        summary={editingSummary}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveSummary}
      />
    </div>
  );
}

export default HomePage;
