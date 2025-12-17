import { ReactNode } from "react";
import { Header } from "./Header";

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header currentPage={currentPage} onNavigate={onNavigate} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center space-y-2">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            © 2025 Molkhas - منصة للمشاركة بين الطلاب
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs">
            <button
              onClick={() =>
                window.open("https://github.com/kali-upper", "_blank")
              }
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline transition-colors"
            >
              Aboalayoun
            </button>{" "}
             made with 🤍 by 
          </p>
        </div>
      </footer>
    </div>
  );
}
