import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FileText, Calendar, User } from "lucide-react";
import { useSummaries } from "../hooks/useSummaries";
import { useAuth } from "../contexts/AuthContext";
import { useAnalytics } from "../hooks/useAnalytics";
import { EditSummaryModal } from "../components/EditSummaryModal";
import { Summary } from "../types/database";

interface SubjectSummariesPageProps {
  onNavigate: (page: string, id?: string) => void;
}

function SubjectSummariesPage({ onNavigate }: SubjectSummariesPageProps) {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { user, isAdmin } = useAuth();
  const summariesHook = useSummaries();
  const { trackSummaryClick } = useAnalytics();
  const [filteredSummaries, setFilteredSummaries] = useState<Summary[]>([]);
  const [editingSummary, setEditingSummary] = useState<Summary | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Decode subject name from URL
  const subjectName = subjectId ? decodeURIComponent(subjectId) : "";

  useEffect(() => {
    // Filter summaries by subject
    const subjectSummaries = summariesHook.summaries
      .filter(
        (summary) =>
          summary.status === "approved" && summary.subject === subjectName
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    setFilteredSummaries(subjectSummaries);
  }, [summariesHook.summaries, subjectName]);

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
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          ملخصات مادة {subjectName}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          جميع الملخصات المتاحة لهذه المادة
        </p>
      </div>

      {/* Summaries Grid */}
      {filteredSummaries.length === 0 ? (
        <div className="text-center py-12 loading-placeholder">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            لا توجد ملخصات
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            لا توجد ملخصات متاحة لهذه المادة حالياً
          </p>
        </div>
      ) : (
        <div className="summary-grid">
          {filteredSummaries.map((summary) => {
            const canEdit = user && (isAdmin || summary.user_id === user.id);

            return (
              <div
                key={summary.id}
                className="summary-card bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all p-4 sm:p-6 tablet:p-8 cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 touch-manipulation relative"
              >
                {canEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditSummary(summary);
                    }}
                    className="absolute top-3 left-3 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded bg-white dark:bg-gray-800 shadow-sm"
                    title="تعديل الملخص"
                  >
                    <svg
                      className="w-4 h-4"
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
                    trackSummaryClick(summary.id, "subject_page_click");
                    onNavigate("summary", summary.id);
                  }}
                >
                  <h2 className="text-base sm:text-lg tablet:text-xl font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2 pr-8">
                    {summary.title}
                  </h2>

                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="truncate">
                        {summary.year} - {summary.department}
                      </span>
                    </div>

                    {summary.contributor_name && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                        <span className="truncate">
                          {summary.contributor_name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {summary.content}
                    </p>
                  </div>

                  <div className="mt-4">
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {new Date(summary.created_at).toLocaleDateString(
                        "ar-EG",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EditSummaryModal
        summary={editingSummary}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveSummary}
      />
    </div>
  );
}

export default SubjectSummariesPage;
