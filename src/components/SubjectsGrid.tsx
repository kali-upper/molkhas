import { useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Calculator,
  Globe,
  Heart,
  Zap,
  Cpu,
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
}

interface SubjectsGridProps {
  onSubjectClick?: (subjectName: string) => void;
}

const subjectIcons: {
  [key: string]: React.ComponentType<{ className?: string }>;
} = {
  "أساسيات تكنولوجيا المعلومات": Cpu,
  "الرسم باليد": BookOpen,
  "سلوكيات الهيئات": Heart,
  "فيزياء 1": Zap,
  "رياضيات 1": Calculator,
  "حقوق الإنسان": Heart,
  الكترونيات: Cpu,
  "لغة انجليزية": Globe,
  "ثقافه اسلامية": BookOpen,
  "تفكير علمي": GraduationCap,
  "اساسيات الرياضيات": Calculator,
};

// Predefined subjects data
const predefinedSubjects: Subject[] = [
  { id: "1", name: "أساسيات تكنولوجيا المعلومات" },
  { id: "2", name: "الرسم باليد" },
  { id: "3", name: "سلوكيات الهيئات" },
  { id: "4", name: "فيزياء 1" },
  { id: "5", name: "رياضيات 1" },
  { id: "6", name: "حقوق الإنسان" },
  { id: "7", name: "الكترونيات" },
  { id: "8", name: "لغة انجليزية" },
  { id: "9", name: "ثقافه اسلامية" },
  { id: "10", name: "تفكير علمي" },
  { id: "11", name: "اساسيات الرياضيات" },
];

export function SubjectsGrid({ onSubjectClick }: SubjectsGridProps = {}) {
  const [subjects] = useState<Subject[]>(predefinedSubjects);
  const [loading] = useState(false);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 11 }).map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-pulse"
          >
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mx-auto w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {subjects.map((subject) => {
          const IconComponent = subjectIcons[subject.name] || BookOpen;

          return (
            <div
              key={subject.id}
              onClick={() => onSubjectClick?.(subject.name)}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 group"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                  <IconComponent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                  {subject.name}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      {subjects.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            لا توجد مواد
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            سيتم إضافة المواد الدراسية قريباً
          </p>
        </div>
      )}
    </div>
  );
}
