import React, { useState, useEffect } from "react";
import {
  Newspaper,
  Plus,
  AlertTriangle,
  Sparkles,
  Search,
  Flag,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { News } from "../types/database";
import { AppealFormModal } from "../components/AppealFormModal";

// استخدام نوع News من قاعدة البيانات
type NewsItem = News & { summary?: string };

interface NewsPageProps {
  onNavigate: (page: string, id?: string) => void;
}

export function NewsPage({ onNavigate: _onNavigate }: NewsPageProps) {
  const { user } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNews, setNewNews] = useState({
    title: "",
    content: "",
    type: "announcement" as NewsItem["type"],
  });
  const [submitting, setSubmitting] = useState(false);
  const [appealModal, setAppealModal] = useState<{
    isOpen: boolean;
    contentId: string;
    contentTitle: string;
  }>({ isOpen: false, contentId: "", contentTitle: "" });

  const categories = [
    { id: "all", label: "الكل", icon: Newspaper, color: "blue" },
    {
      id: "announcement",
      label: "📢 إعلانات مهمة",
      icon: AlertTriangle,
      color: "purple",
    },
    { id: "update", label: "✨ تحديثات", icon: Sparkles, color: "green" },
    {
      id: "important",
      label: "🔥 مهم جداً",
      icon: AlertTriangle,
      color: "red",
    },
  ];

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    filterNews();
  }, [news, selectedCategory, searchTerm]);

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error("Error fetching news:", error);
      console.error("حدث خطأ في تحميل الأخبار - يرجى المحاولة مرة أخرى");
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const filterNews = () => {
    let filtered = news;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.type === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredNews(filtered);
  };

  const getCategoryColor = (category: string) => {
    const categoryConfig = categories.find((cat) => cat.id === category);
    return categoryConfig?.color || "blue";
  };

  const addNewsItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNews.title.trim() || !newNews.content.trim()) {
      console.warn("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Auth error:", authError);
        throw new Error("يجب تسجيل الدخول أولاً");
      }

      if (!user) {
        throw new Error("يجب تسجيل الدخول أولاً");
      }

      console.log("Adding news with user:", user.id);

      const { data, error } = await supabase
        .from("news")
        .insert({
          title: newNews.title.trim(),
          content: newNews.content.trim(),
          type: newNews.type,
          created_by: user.id,
        } as any)
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      // إضافة الخبر الجديد إلى القائمة
      setNews((prev) => [data, ...prev]);

      // إعادة تعيين النموذج
      setNewNews({
        title: "",
        content: "",
        type: "announcement",
      });
      setShowAddForm(false);

      console.log("✅ تم إضافة الخبر بنجاح!");
    } catch (error) {
      console.error("Error adding news:", error);
      console.error("حدث خطأ في إضافة الخبر - حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            جاري تحميل الأخبار...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <Newspaper className="w-12 h-12" />
          <div>
            <h1 className="text-3xl font-bold mb-2">
              الأخبار والإعلانات المهمة
            </h1>
            <p className="text-blue-100">
              ابقَ على اطلاع بكل ما يهمك في رحلتك الدراسية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-6">
          {user ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة خبر مهم</span>
            </button>
          ) : (
            <button
              onClick={() => _onNavigate("login")}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              تسجيل الدخول لإضافة خبر
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في الأخبار..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? `bg-${category.color}-50 dark:bg-${category.color}-900/50 text-${category.color}-700 dark:text-${category.color}-300 border border-${category.color}-200 dark:border-${category.color}-800`
                  : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              <category.icon className="w-4 h-4" />
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* نموذج إضافة خبر جديد */}
      {showAddForm && user && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              إضافة خبر جديد
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <form onSubmit={addNewsItem} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                عنوان الخبر *
              </label>
              <input
                type="text"
                required
                value={newNews.title}
                onChange={(e) =>
                  setNewNews((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="أدخل عنوان الخبر..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                محتوى الخبر *
              </label>
              <textarea
                required
                rows={4}
                value={newNews.content}
                onChange={(e) =>
                  setNewNews((prev) => ({ ...prev, content: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="أدخل تفاصيل الخبر..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                التصنيف *
              </label>
              <select
                value={newNews.type}
                onChange={(e) =>
                  setNewNews((prev) => ({
                    ...prev,
                    type: e.target.value as NewsItem["type"],
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="announcement">📢 إعلان</option>
                <option value="update">✨ تحديث</option>
                <option value="important">🔥 مهم جداً</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                {submitting ? "جاري النشر..." : "نشر الخبر"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* News Items */}
      {filteredNews.length === 0 ? (
        <div className="text-center py-12">
          <Newspaper className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            لا توجد أخبار
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            جرب تغيير معايير البحث أو كن أول من يضيف خبراً مهماً
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredNews.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all p-6 border border-gray-100 dark:border-gray-700"
            >
              {/* Category Badge */}
              <div
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium mb-4 bg-${getCategoryColor(
                  item.type
                )}-100 dark:bg-${getCategoryColor(
                  item.type
                )}-900/30 text-${getCategoryColor(
                  item.type
                )}-800 dark:text-${getCategoryColor(item.type)}-300`}
              >
                {(() => {
                  const category = categories.find(
                    (cat) => cat.id === item.type
                  );
                  const IconComponent = category?.icon;
                  return IconComponent && <IconComponent className="w-3 h-3" />;
                })()}
                <span>
                  {categories.find((cat) => cat.id === item.type)?.label}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {item.title}
              </h3>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                {item.content}
              </p>

              {/* AI Summary */}
              {item.summary && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4 border-l-4 border-blue-400">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      الخلاصة:
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {item.summary}
                  </p>
                </div>
              )}

              {/* Appeal Button */}
              <button
                onClick={() =>
                  setAppealModal({
                    isOpen: true,
                    contentId: item.id,
                    contentTitle: item.title,
                  })
                }
                className="flex items-center gap-2 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 text-sm font-medium transition-colors"
              >
                <Flag className="w-4 h-4" />
                <span>الطعن في الخبر</span>
              </button>

              <div className="flex items-center justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-500">
                  {new Date(item.created_at).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AppealFormModal
        isOpen={appealModal.isOpen}
        onClose={() =>
          setAppealModal({ isOpen: false, contentId: "", contentTitle: "" })
        }
        contentId={appealModal.contentId}
        contentType="news"
        contentTitle={appealModal.contentTitle}
      />
    </div>
  );
}
