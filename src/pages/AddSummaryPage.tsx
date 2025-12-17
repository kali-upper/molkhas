import { useState } from "react";
import { Upload, Send, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import type { SummaryInsert } from "../types/database";

interface AddSummaryPageProps {
  onNavigate: (page: string) => void;
}

export function AddSummaryPage({ onNavigate }: AddSummaryPageProps) {
  const { displayName } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    year: "",
    department: "",
    content: "",
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let pdfUrl = null;

      if (pdfFile) {
        // احتفظ باسم الملف الأصلي مع إضافة timestamp لتجنب التعارض
        const originalName = pdfFile.name.replace(/[^a-zA-Z0-9.-]/g, "_"); // استبدال الرموز الخاصة
        const timestamp = Date.now();
        const filePath = `${timestamp}_${originalName}`;

        const { error: uploadError } = await supabase.storage
          .from("summaries-pdfs")
          .upload(filePath, pdfFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("summaries-pdfs").getPublicUrl(filePath);

        pdfUrl = publicUrl;
      }

      const summaryData: SummaryInsert = {
        title: formData.title,
        subject: formData.subject,
        year: formData.year,
        department: formData.department,
        content: formData.content,
        contributor_name: displayName || null,
        pdf_url: pdfUrl,
        status: "pending",
      };

      const { error: insertError } = await supabase
        .from("summaries")
        .insert(summaryData as any);

      if (insertError) throw insertError;

      setSuccess(true);
      setFormData({
        title: "",
        subject: "",
        year: "",
        department: "",
        content: "",
      });
      setPdfFile(null);

      setTimeout(() => {
        onNavigate("home");
      }, 2000);
    } catch (err) {
      console.error("Error submitting summary:", err);
      setError("حدث خطأ أثناء إرسال الملخص. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setError("");
    } else {
      setError("يرجى اختيار ملف PDF فقط");
      setPdfFile(null);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center transition-colors">
          <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            تم إرسال الملخص بنجاح!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            سيتم مراجعة الملخص من قبل المشرفين ونشره قريباً
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            سيتم تحويلك إلى الصفحة الرئيسية...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 transition-colors">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          إضافة ملخص جديد
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          شارك ملخصك مع زملائك الطلاب
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              عنوان الملخص <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="مثال: ملخص الفصل الأول - مقدمة في البرمجة"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                التخصص <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">اختر التخصص</option>
                <option value="☝ ذكاء اصطناعي">
                  ☝ ذكاء اصطناعي [UPDATED]
                </option>
                <option value="هندسة برمجيات">هندسة برمجيات</option>
                <option value="علوم الحاسب ونظم المعلومات">
                  علوم الحاسب ونظم المعلومات
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                المستوى الدراسي <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">اختر المستوي</option>
                <option value="المستوي الأولى">المستوي الأولى</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              اسم المادة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="مثال: أساسيات البرمجة"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              محتوى الملخص <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              rows={10}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="اكتب محتوى الملخص هنا..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              رفع ملف PDF (اختياري)
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-gray-500 dark:text-gray-400 mb-2" />
                  {pdfFile ? (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {pdfFile.name}
                    </p>
                  ) : (
                    <>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">اضغط لرفع ملف PDF</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        PDF فقط (حتى 10MB)
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          {displayName && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>ملاحظة:</strong> الملخص سيُنشر باسم:{" "}
                <strong>{displayName}</strong>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>جاري الإرسال...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>إرسال الملخص</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
