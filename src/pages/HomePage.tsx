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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const subjects = [...new Set(summaries.map((s) => s.subject))];

  useEffect(() => {
    fetchSummaries();
  }, []);

  useEffect(() => {
    filterSummaries();
  }, [
    summaries,
    searchTerm,
    selectedSubject,
    selectedLevel,
    selectedDepartment,
  ]);

  const fetchSummaries = async () => {
    try {
      const { data, error } = await supabase
        .from("summaries")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSummaries(data || []);
    } catch (error) {
      console.error("Error fetching summaries:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterSummaries = () => {
    let filtered = summaries;

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.content.toLowerCase().includes(searchTerm.toLowerCase())
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

  if (loading) {
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-lg">
        <h1 className="text-xl sm:text-2xl tablet:text-3xl lg:text-3xl font-bold mb-2">
          مرحباً بك في منصة Molkhas
        </h1>
        <p className="text-sm sm:text-base tablet:text-lg text-blue-100">
          شارك واستفد من الملخصات الدراسية التي يقدمها زملاؤك
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 space-y-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="ابحث عن ملخص..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:col-span-1">
            <Filter className="text-gray-500 dark:text-gray-400 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
              فلاتر:
            </span>
          </div>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">جميع التخصصات</option>
            <option value="ذكاء اصطناعي">ذكاء اصطناعي ☝</option>
            <option value="هندسة برمجيات">هندسة برمجيات</option>
            <option value="نظم المعلومات">نظم المعلومات</option>
          </select>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">المستويات</option>
            <option value="المستوي الاول">المستوي الاول</option>
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">جميع المواد</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>

          {(searchTerm ||
            selectedSubject ||
            selectedLevel ||
            selectedDepartment) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors col-span-2 sm:col-span-1"
            >
              مسح الفلاتر
            </button>
          )}
        </div>
      </div>

      {filteredSummaries.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            لا توجد ملخصات
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            جرب تغيير معايير البحث أو كن أول من يضيف ملخصاً
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 tablet:grid-cols-2 lg:grid-cols-3">
          {filteredSummaries.map((summary) => (
            <div
              key={summary.id}
              onClick={() => onNavigate("summary", summary.id)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all p-4 sm:p-6 tablet:p-8 cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 touch-manipulation"
            >
              <h3 className="text-base sm:text-lg tablet:text-xl font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2">
                {summary.title}
              </h3>

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
