import { Database } from "../types/database";

interface AddNewsModalProps {
  showAddNews: boolean;
  newNews: Database["public"]["Tables"]["news"]["Insert"];
  onSetShowAddNews: (show: boolean) => void;
  onSetNewNews: (news: Database["public"]["Tables"]["news"]["Insert"]) => void;
  onAddNews: () => void;
}

export function AddNewsModal({
  showAddNews,
  newNews,
  onSetShowAddNews,
  onSetNewNews,
  onAddNews,
}: AddNewsModalProps) {
  if (!showAddNews) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            إضافة خبر جديد
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                العنوان
              </label>
              <input
                type="text"
                value={newNews.title}
                onChange={(e) =>
                  onSetNewNews({ ...newNews, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="أدخل عنوان الخبر"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                النوع
              </label>
              <select
                value={newNews.type}
                onChange={(e) =>
                  onSetNewNews({
                    ...newNews,
                    type: e.target.value as
                      | "announcement"
                      | "update"
                      | "important",
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="announcement">إعلان</option>
                <option value="update">تحديث</option>
                <option value="important">مهم</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                المحتوى
              </label>
              <textarea
                value={newNews.content}
                onChange={(e) =>
                  onSetNewNews({ ...newNews, content: e.target.value })
                }
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="أدخل محتوى الخبر"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                الأولوية
              </label>
              <input
                type="number"
                value={newNews.priority}
                onChange={(e) =>
                  onSetNewNews({
                    ...newNews,
                    priority: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="أدخل الأولوية (0-10)"
                min="0"
                max="10"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onAddNews}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              إضافة الخبر
            </button>
            <button
              onClick={() => onSetShowAddNews(false)}
              className="bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
