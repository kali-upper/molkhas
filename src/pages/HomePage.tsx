import { useEffect, useState } from "react";
import {
  Search,
  Filter,
  FileText,
  Calendar,
  BookOpen,
  User,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Summary } from "../types/database";

interface HomePageProps {
  onNavigate: (page: string, id?: string) => void;
}

function HomePage({ onNavigate }: HomePageProps) {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [filteredSummaries, setFilteredSummaries] = useState<Summary[]>([]);
  // const [loading, setLoading] = useState(true); // Removed as per Solution 3
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const subjects = [...new Set(summaries.map((s) => s.subject))];

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const { data, error } = await supabase
          .from("summaries")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setSummaries(data || []);
        setFilteredSummaries(data || []); // 🔥 مهم: تهيئة filteredSummaries بعد جلب البيانات
      } catch (err) {
        console.error("Error fetching summaries:", err);
        setSummaries([]); // fallback نظيف
      }
    };

    fetchSummaries();
  }, []);

  // Filter summaries when summaries or filters change
  useEffect(() => {
    filterSummaries();
  }, [
    summaries,
    searchTerm,
    selectedSubject,
    selectedLevel,
    selectedDepartment,
  ]);

  const filterSummaries = () => {
    let filtered = summaries;

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.content || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSubject) {
      filtered = filtered.filter((s) => s.subject === selectedSubject);
    }

    if (selectedLevel) {
      filtered = filtered.filter((s) => s.year === selectedLevel);
    }

    if (selectedDepartment) {
      filtered = filtered.filter((s) => s.department === selectedDepartment);
    }

    setFilteredSummaries(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSubject("");
    setSelectedLevel("");
    setSelectedDepartment("");
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-lg">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
          مرحباً بك في منصة Molkhas
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-blue-100">
          شارك واستفد من الملخصات الدراسية التي يقدمها زملاؤك
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 space-y-4 filter-container">
        <div className="relative">
          <label htmlFor="home-search" className="sr-only">
            ابحث عن ملخص
          </label>
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            id="home-search"
            name="homeSearch"
            type="text"
            placeholder="ابحث عن ملخص..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-high-contrast placeholder-contrast text-base"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:col-span-1">
            <Filter className="text-gray-500 dark:text-gray-400 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
              فلاتر:
            </span>
          </div>

          <div>
            <label htmlFor="department-select" className="sr-only">
              التخصص
            </label>
            <select
              id="department-select"
              name="selectedDepartment"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 select-contrast text-sm w-full"
              aria-label="اختر التخصص"
            >
              <option value="">جميع التخصصات</option>
              <option value="ذكاء اصطناعي">ذكاء اصطناعي ☝</option>
              <option value="هندسة برمجيات">هندسة برمجيات</option>
              <option value="نظم المعلومات">نظم المعلومات</option>
            </select>
          </div>

          <div>
            <label htmlFor="level-select" className="sr-only">
              المستوى
            </label>
            <select
              id="level-select"
              name="selectedLevel"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 select-contrast text-sm w-full"
              aria-label="اختر المستوى"
            >
              <option value="">المستويات</option>
              <option value="المستوي الاول">المستوي الاول</option>
            </select>
          </div>

          <div>
            <label htmlFor="subject-select" className="sr-only">
              المادة
            </label>
            <select
              id="subject-select"
              name="selectedSubject"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 select-contrast text-sm w-full"
              aria-label="اختر المادة"
            >
              <option value="">جميع المواد</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div className="cls-prevent col-span-2 sm:col-span-1">
            <button
              onClick={clearFilters}
              className={`px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors ${
                searchTerm ||
                selectedSubject ||
                selectedLevel ||
                selectedDepartment
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              مسح الفلاتر
            </button>
          </div>
        </div>
      </div>

      {filteredSummaries.length === 0 ? (
        <div className="text-center py-12 loading-placeholder">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            لا توجد ملخصات
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            جرب تغيير معايير البحث أو كن أول من يضيف ملخصاً
          </p>
        </div>
      ) : (
        <div className="summary-grid">
          {filteredSummaries.map((summary) => (
            <div
              key={summary.id}
              onClick={() => onNavigate("summary", summary.id)}
              className="summary-card bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all p-4 sm:p-6 tablet:p-8 cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 touch-manipulation"
            >
              <h2 className="text-base sm:text-lg tablet:text-xl font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2">
                {summary.title}
              </h2>

              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span className="truncate">{summary.subject}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="truncate">
                    {summary.year} - {summary.department}
                  </span>
                </div>

                {summary.contributor_name && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <span className="truncate">{summary.contributor_name}</span>
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
                  {new Date(summary.created_at).toLocaleDateString("ar-EG", {
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
    </div>
  );
}

export default HomePage;
