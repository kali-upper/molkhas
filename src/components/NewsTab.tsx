import { Newspaper } from "lucide-react";
import { News } from "../types/database";

interface NewsTabProps {
  news: News[];
  onToggleStatus: (id: string, isActive: boolean) => void;
  onSetShowAddNews: (show: boolean) => void;
}

export function NewsTab({
  news,
  onToggleStatus,
  onSetShowAddNews,
}: NewsTabProps) {
  if (news.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            إدارة الأخبار والإعلانات
          </h2>
          <button
            onClick={() => onSetShowAddNews(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            إضافة خبر جديد
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center transition-colors">
          <Newspaper className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            لا توجد أخبار
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            لم يتم إضافة أي أخبار بعد
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          إدارة الأخبار والإعلانات
        </h2>
        <button
          onClick={() => onSetShowAddNews(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          إضافة خبر جديد
        </button>
      </div>

      <div className="space-y-4">
        {news.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.is_active
                        ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300"
                        : "bg-gray-100 dark:bg-gray-900/50 text-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {item.is_active ? "نشط" : "غير نشط"}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {item.content.length > 200
                    ? `${item.content.substring(0, 200)}...`
                    : item.content}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>النوع: {item.type}</span>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => onToggleStatus(item.id, !item.is_active)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    item.is_active
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {item.is_active ? "إلغاء التفعيل" : "تفعيل"}
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              تم النشر: {new Date(item.created_at).toLocaleDateString("ar-SA")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
