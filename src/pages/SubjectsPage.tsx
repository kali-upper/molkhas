import { useNavigate } from "react-router-dom";
import { SubjectsGrid } from "../components/SubjectsGrid";

function SubjectsPage() {
  const navigate = useNavigate();

  const handleSubjectClick = (subjectName: string) => {
    // Navigate to subject page with encoded subject name
    navigate(`/subjects/${encodeURIComponent(subjectName)}`);
  };
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          المواد الدراسية
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          اختر المادة التي تريد الاطلاع على ملخصاتها
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <SubjectsGrid onSubjectClick={handleSubjectClick} />
      </div>
    </div>
  );
}

export default SubjectsPage;
