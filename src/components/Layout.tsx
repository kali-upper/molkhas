import { ReactNode } from "react";
import { Header } from "./Header";
import { PWAInstallPrompt } from "./PWAInstallPrompt";
import { NotificationPrompt } from "./NotificationManager";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header />
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </main>
      <PWAInstallPrompt />
      <NotificationPrompt />
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center space-y-2">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            © 2026 Masar X - منصة للمشاركة بين الطلاب
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
