import { useState } from "react";
import { Upload, Send, CheckCircle, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { uploadToCloudinary } from "../lib/cloudinary";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications as useBrowserNotifications } from "../components/NotificationManager";
import { useNotifications as useDbNotifications } from "../hooks/useNotifications";
import type { SummaryInsert } from "../types/database";

interface AddSummaryPageProps {
  onNavigate: (page: string) => void;
}

function AddSummaryPage({ onNavigate }: AddSummaryPageProps) {
  const { user, displayName } = useAuth();
  const { sendNotification } = useBrowserNotifications();
  const { notifyAdmins } = useDbNotifications();
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    year: "",
    department: "",
    content: "",
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let cloudinaryResult = null;
      const uploadedImageUrls: string[] = [];

      if (pdfFile) {
        // رفع الملف إلى Cloudinary مع البيانات الوصفية
        cloudinaryResult = await uploadToCloudinary(pdfFile, {
          folder: "masarx-summaries",
          tags: [formData.subject, formData.year, formData.department],
          context: {
            contributor: displayName || "مجهول",
            title: formData.title,
            subject: formData.subject,
            year: formData.year,
            department: formData.department,
            content: formData.content,
          },
        });

        console.log("File uploaded to Cloudinary:", cloudinaryResult.public_id);
      }

      // رفع الصور إلى Cloudinary
      if (imageFiles.length > 0) {
        for (const imageFile of imageFiles) {
          try {
            const imageResult = await uploadToCloudinary(imageFile, {
              folder: "masarx-summary-images",
              tags: [
                formData.subject,
                formData.year,
                formData.department,
                "summary-image",
              ],
              context: {
                contributor: displayName || "مجهول",
                title: formData.title,
                subject: formData.subject,
                year: formData.year,
                department: formData.department,
              },
            });
            uploadedImageUrls.push(imageResult.secure_url);
            console.log("Image uploaded to Cloudinary:", imageResult.public_id);
          } catch (imgError) {
            console.error("Error uploading image:", imgError);
            // Continue with other images even if one fails
          }
        }
      }

      // إذا تم رفع ملف، سيتم إنشاء السجل تلقائيًا عبر الـ webhook
      // إذا لم يتم رفع ملف، نحتاج لإنشاء السجل يدويًا
      let insertedData = null;

      if (!pdfFile) {
        // إنشاء ملخص بدون ملف
        const summaryData: SummaryInsert = {
          title: formData.title,
          subject: formData.subject,
          year: formData.year,
          department: formData.department,
          content:
            uploadedImageUrls.length > 0
              ? `${formData.content}\n\n[IMAGES:${JSON.stringify(
                  uploadedImageUrls
                )}]`
              : formData.content,
          contributor_name: displayName || null,
          pdf_url: null,
          status: "pending",
          user_id: user?.id || "",
        };

        const { data, error: insertError } = await supabase
          .from("summaries")
          .insert(summaryData)
          .select()
          .single();

        if (insertError) throw insertError;
        insertedData = data;

        // إرسال إشعار للمدراء
        notifyAdmins(
          "ملخص جديد يحتاج مراجعة",
          `تم إرسال ملخص "${formData.title}" بواسطة ${displayName || "مجهول"}`,
          "admin_submission",
          data.id,
          "summary"
        );
      }

      setSuccess(true);

      // إرسال إشعار نجاح الإضافة للمستخدم
      const notificationMessage = pdfFile
        ? `ملخص "${formData.title}" تم رفعه وسيتم مراجعته قريباً`
        : `ملخص "${formData.title}" تم إرساله وسيتم مراجعته قريباً`;

      sendNotification("تم إرسال الملخص بنجاح!", {
        body: notificationMessage,
        icon: "/logo_1.png",
        tag: "summary-submitted",
      });

      // إشعار المدراء يتم إرساله إما عبر الـ webhook (للملفات) أو هنا (للملخصات النصية)
      if (!pdfFile && insertedData) {
        notifyAdmins(
          "ملخص جديد يحتاج مراجعة",
          `تم إرسال ملخص "${formData.title}" في مادة ${
            formData.subject
          } بواسطة ${displayName || "مستخدم"}`,
          "admin_submission",
          insertedData.id,
          "summary"
        );
      }

      setFormData({
        title: "",
        subject: "",
        year: "",
        department: "",
        content: "",
      });
      setPdfFile(null);
      setImageFiles([]);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validImages = files.filter((file) => {
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      return validTypes.includes(file.type);
    });

    if (validImages.length !== files.length) {
      setError(
        "بعض الملفات المختارة ليست صور صالحة (JPEG, PNG, GIF, WebP فقط)"
      );
    } else {
      setError("");
    }

    setImageFiles(validImages);
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sm:p-8 text-center transition-colors">
          <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            تم إرسال الملخص بنجاح!
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
            سيتم مراجعة الملخص من قبل المشرفين ونشره قريباً
          </p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
            سيتم تحويلك إلى الصفحة الرئيسية...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 lg:p-8 transition-colors">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          إضافة ملخص جديد
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
          شارك ملخصك مع زملائك الطلاب
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label
              htmlFor="summary-title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              عنوان الملخص <span className="text-red-500">*</span>
            </label>
            <input
              id="summary-title"
              name="summaryTitle"
              type="text"
              required
              autoComplete="off"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 sm:px-4 py-3 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base"
              placeholder="مثال: ملخص الفصل الأول - مقدمة في البرمجة"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="summary-department"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                التخصص <span className="text-red-500">*</span>
              </label>
              <select
                id="summary-department"
                name="summaryDepartment"
                required
                autoComplete="off"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">اختر التخصص</option>
                <option value="ذكاء اصطناعي">ذكاء اصطناعي ☝</option>{" "}
                <option value="هندسة برمجيات">هندسة برمجيات</option>
                <option value="علوم الحاسب ونظم المعلومات">
                  علوم الحاسب ونظم المعلومات
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="summary-year"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                المستوى الدراسي <span className="text-red-500">*</span>
              </label>
              <select
                id="summary-year"
                name="summaryYear"
                required
                autoComplete="off"
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
            <label
              htmlFor="summary-subject"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              اسم المادة <span className="text-red-500">*</span>
            </label>
            <input
              id="summary-subject"
              name="summarySubject"
              type="text"
              required
              autoComplete="off"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              className="w-full px-3 sm:px-4 py-3 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base"
              placeholder="مثال: أساسيات البرمجة"
            />
          </div>

          <div>
            <label
              htmlFor="summary-content"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              محتوى الملخص <span className="text-red-500">*</span>
            </label>
            <textarea
              id="summary-content"
              name="summaryContent"
              required
              autoComplete="off"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              rows={10}
              className="w-full px-3 sm:px-4 py-3 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base"
              placeholder="اكتب محتوى الملخص هنا..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              رفع ملف PDF (اختياري)
            </label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="summary-pdf-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
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
                  id="summary-pdf-upload"
                  name="summaryPdfUpload"
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              رفع صور (اختياري)
            </label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="summary-images-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-gray-500 dark:text-gray-400 mb-2" />
                  {imageFiles.length > 0 ? (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      تم اختيار {imageFiles.length} صورة
                    </p>
                  ) : (
                    <>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">اضغط لرفع الصور</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        JPEG, PNG, GIF, WebP (حتى 5MB لكل صورة)
                      </p>
                    </>
                  )}
                </div>
                <input
                  id="summary-images-upload"
                  name="summaryImagesUpload"
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  multiple
                  onChange={handleImageChange}
                />
              </label>
            </div>

            {/* عرض الصور المختارة */}
            {imageFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {imageFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="إزالة الصورة"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-4 sm:px-6 py-3 sm:py-3 rounded-lg font-medium focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base touch-manipulation"
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

export default AddSummaryPage;
