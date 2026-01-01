/**
 * مثال على كيفية دمج بيانات مجموعة واتساب جامعية في مشروع React
 * Example of integrating WhatsApp university group data into a React project
 */

import React, { useState, useEffect } from "react";
import universityData from "./whatsapp-university-data.json";

interface UniversityData {
  metadata: any;
  educational_links: any;
  pdf_lectures: any;
  schedules_sections: any;
  student_tips: any;
  technical_issues: any;
  tools_software: any;
  faq: any[];
}

const UniversityDataAssistant: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>({});
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const data: UniversityData = universityData;

  // دالة البحث في البيانات
  const searchInData = (query: string) => {
    const results: any = {};
    const lowerQuery = query.toLowerCase();

    // البحث في الروابط التعليمية
    if (lowerQuery.includes("برمج") || lowerQuery.includes("programming")) {
      results.educational_links = data.educational_links.programming;
    }

    // البحث في الجداول
    if (lowerQuery.includes("كويز") || lowerQuery.includes("امتحان")) {
      results.schedules = data.schedules_sections.exam_info;
    }

    // البحث في النصائح
    if (lowerQuery.includes("نصيح") || lowerQuery.includes("دراس")) {
      results.tips = data.student_tips.study_habits;
    }

    // البحث في المشاكل التقنية
    if (lowerQuery.includes("excel") || lowerQuery.includes("مشكل")) {
      results.technical = data.technical_issues.excel_2003;
    }

    return results;
  };

  // تحديث النتائج عند تغيير البحث
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchInData(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults({});
    }
  }, [searchQuery]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
        🎓 مساعد بيانات مجموعة واتساب جامعية
      </h1>

      {/* شريط البحث */}
      <div className="mb-6">
        <label htmlFor="university-search" className="sr-only">
          بحث في بيانات الجامعة
        </label>
        <input
          id="university-search"
          name="universitySearch"
          type="text"
          placeholder="ابحث عن كورسات، جداول، نصائح، أو حلول تقنية..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* تصفية الفئات */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["all", "courses", "schedules", "tips", "technical"].map(
          (category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === category
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {category === "all" && "الكل"}
              {category === "courses" && "📚 الكورسات"}
              {category === "schedules" && "📅 الجداول"}
              {category === "tips" && "💡 النصائح"}
              {category === "technical" && "🛠️ التقنية"}
            </button>
          )
        )}
      </div>

      {/* عرض النتائج */}
      <div className="space-y-6">
        {/* الروابط التعليمية */}
        {searchResults.educational_links &&
          (activeCategory === "all" || activeCategory === "courses") && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-300">
                📚 الكورسات والروابط التعليمية
              </h3>
              <div className="space-y-3">
                {Object.entries(searchResults.educational_links).map(
                  ([key, course]: [string, any]) => (
                    <div
                      key={key}
                      className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow"
                    >
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {course.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {course.description}
                      </p>
                      <a
                        href={course.url || course.urls?.[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        🔗 افتح الرابط
                      </a>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        {/* الجداول والامتحانات */}
        {searchResults.schedules &&
          (activeCategory === "all" || activeCategory === "schedules") && (
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-green-900 dark:text-green-300">
                📅 الجداول والامتحانات
              </h3>
              <div className="space-y-2">
                {searchResults.schedules.quiz_schedule?.map(
                  (quiz: string, index: number) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-700 p-3 rounded-lg"
                    >
                      {quiz}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        {/* النصائح الدراسية */}
        {searchResults.tips &&
          (activeCategory === "all" || activeCategory === "tips") && (
            <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-purple-900 dark:text-purple-300">
                💡 النصائح والخبرات الطلابية
              </h3>
              <div className="space-y-2">
                {searchResults.tips.map((tip: string, index: number) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-700 p-3 rounded-lg"
                  >
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* المساعدة التقنية */}
        {searchResults.technical &&
          (activeCategory === "all" || activeCategory === "technical") && (
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-red-900 dark:text-red-300">
                🛠️ الحلول التقنية
              </h3>
              <div className="space-y-2">
                <p className="text-gray-700 dark:text-gray-300">
                  {searchResults.technical.problem}
                </p>
                <div className="space-y-1">
                  {searchResults.technical.solutions?.map(
                    (solution: string, index: number) => (
                      <div
                        key={index}
                        className="bg-white dark:bg-gray-700 p-3 rounded-lg text-sm"
                      >
                        {solution}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

        {/* رسالة عدم وجود نتائج */}
        {Object.keys(searchResults).length === 0 && searchQuery.trim() && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              لم نجد نتائج
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              جرب كلمات مختلفة مثل: برمجة، كويز، نصائح، Excel
            </p>
          </div>
        )}
      </div>

      {/* معلومات إضافية */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          📊 معلومات عن قاعدة البيانات
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Object.keys(data.educational_links).length}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              روابط تعليمية
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Object.keys(data.pdf_lectures).length}
            </div>
            <div className="text-gray-600 dark:text-gray-400">ملفات PDF</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {data.faq.length}
            </div>
            <div className="text-gray-600 dark:text-gray-400">أسئلة شائعة</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {data.metadata.last_updated.split(" ")[0]}
            </div>
            <div className="text-gray-600 dark:text-gray-400">آخر تحديث</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversityDataAssistant;
