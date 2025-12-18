import { Flag } from "lucide-react";
import { Appeal } from "../types/database";

interface AppealsTabProps {
  appeals: Appeal[];
}

export function AppealsTab({ appeals }: AppealsTabProps) {
  if (appeals.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            إدارة الطعون
          </h2>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center transition-colors">
          <Flag className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            لا توجد طعون
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            لم يتم تقديم أي طعون حتى الآن
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          إدارة الطعون والبلاغات
        </h2>
      </div>

      <div className="space-y-4">
        {appeals.map((appeal) => (
          <div
            key={appeal.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors"
          >
            <div className="flex flex-col gap-2 md:flex-row md:justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    طعن على:{" "}
                    {appeal.content_type === "summary" ? "ملخص" : "خبر"}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      appeal.status === "pending"
                        ? "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300"
                        : appeal.status === "reviewed"
                        ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300"
                        : "bg-gray-100 dark:bg-gray-900/50 text-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {appeal.status === "pending"
                      ? "قيد المراجعة"
                      : appeal.status === "reviewed"
                      ? "تمت المراجعة"
                      : "مغلق"}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {appeal.reason}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>بواسطة: {appeal.created_by || "مستخدم مجهول"}</span>
                  <span>معرف المحتوى: {appeal.content_id}</span>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              تم التقديم:{" "}
              {new Date(appeal.created_at).toLocaleDateString("ar-SA")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
