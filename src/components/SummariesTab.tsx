import { Eye, Trash2 } from "lucide-react";
import { Summary } from "../types/database";

interface SummariesTabProps {
  summaries: Summary[];
  onUpdateStatus: (id: string, status: "approved" | "rejected") => void;
  onDeleteSummary: (id: string) => void;
  onClearAllSummaries: () => void;
}

export function SummariesTab({
  summaries,
  onUpdateStatus,
  onDeleteSummary,
  onClearAllSummaries,
}: SummariesTabProps) {
  if (summaries.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center transition-colors">
          <Eye className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            لا توجد ملخصات
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            لا توجد ملخصات في هذه الفئة حالياً
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <button
          onClick={onClearAllSummaries}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-500 transition-colors text-sm"
        >
          <Trash2 className="w-4 h-4" />
          <span>حذف جميع الملخصات</span>
        </button>
      </div>
      <div className="space-y-4">
        {summaries.map((summary) => (
          <div
            key={summary.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    ملخص للموضوع: {summary.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      summary.status === "pending"
                        ? "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300"
                        : summary.status === "approved"
                        ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300"
                        : "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300"
                    }`}
                  >
                    {summary.status === "pending"
                      ? "قيد المراجعة"
                      : summary.status === "approved"
                      ? "معتمد"
                      : "مرفوض"}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {summary.content.length > 200
                    ? `${summary.content.substring(0, 200)}...`
                    : summary.content}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    بواسطة: {summary.contributor_name || "مستخدم مجهول"}
                  </span>
                  <span>المادة: {summary.subject}</span>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => onUpdateStatus(summary.id, "approved")}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                >
                  اعتماد
                </button>
                <button
                  onClick={() => onUpdateStatus(summary.id, "rejected")}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                >
                  رفض
                </button>
                <button
                  onClick={() => onDeleteSummary(summary.id)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                >
                  حذف
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              تم الإرسال:{" "}
              {new Date(summary.created_at).toLocaleDateString("ar-SA")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
