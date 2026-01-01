import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  User,
  Download,
  FileText,
  Flag,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Summary } from "../types/database";
import { AppealFormModal } from "../components/AppealFormModal";

interface SummaryDetailPageProps {
  summaryId: string;
  onNavigate: (page: string) => void;
}

function SummaryDetailPage({ summaryId, onNavigate }: SummaryDetailPageProps) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAppealForm, setShowAppealForm] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, [summaryId]);

  const fetchSummary = async () => {
    try {
      const { data, error } = await supabase
        .from("summaries")
        .select("*")
        .eq("id", summaryId)
        .eq("status", "approved")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setError("الملخص غير موجود أو قيد المراجعة");
        return;
      }

      setSummary(data);
    } catch (err) {
      console.error("Error fetching summary:", err);
      setError("حدث خطأ أثناء تحميل الملخص");
    } finally {
      setLoading(false);
    }
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

  if (error || !summary) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center transition-colors">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {error}
          </h2>
          <button
            onClick={() => onNavigate("home")}
            className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            العودة إلى الصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => onNavigate("home")}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>العودة إلى القائمة</span>
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden transition-colors">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 px-6 sm:px-8 py-6 text-white">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">{summary.title}</h1>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg">
              <BookOpen className="w-4 h-4" />
              <span>{summary.subject}</span>
            </div>

            <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg">
              <Calendar className="w-4 h-4" />
              <span>
                {summary.year} - {summary.department}
              </span>
            </div>

            {summary.contributor_name && (
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg">
                <User className="w-4 h-4" />
                <span>{summary.contributor_name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-8">
          {summary.pdf_url && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      ملف PDF متاح
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      حمل الملخص بصيغة PDF
                    </p>
                  </div>
                </div>
                <a
                  href={summary.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل</span>
                </a>
              </div>
            </div>
          )}

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              محتوى الملخص
            </h2>
            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {summary.content}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                تم النشر في{" "}
                {new Date(summary.created_at).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <button
                onClick={() => setShowAppealForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors text-sm font-medium"
              >
                <Flag className="w-4 h-4" />
                <span>الطعن في المحتوى</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <AppealFormModal
        isOpen={showAppealForm}
        onClose={() => setShowAppealForm(false)}
        contentId={summary.id}
        contentType="summary"
        contentTitle={summary.title}
      />
    </div>
  );
}

export default SummaryDetailPage;
