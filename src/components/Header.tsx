import {
  BookOpen,
  Plus,
  Shield,
  LogOut,
  LogIn,
  Sun,
  Moon,
  MessageSquare,
  User,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { NotificationDropdown } from "./NotificationDropdown";

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string, id?: string) => void;
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  const { user, isAdmin, isAdminLoading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      onNavigate("home");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleNavigate = (page: string, id?: string) => {
    onNavigate(page, id);
    setIsMobileMenuOpen(false); // إغلاق القائمة المحمولة عند الانتقال
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo/Brand */}
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-1 sm:gap-2 text-lg sm:text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-w-0"
          >
            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="truncate">Molkhas</span>
          </button>

          {/* Navigation Bar */}
          <nav className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
            {/* Desktop Navigation - Hidden on mobile/tablet */}
            <div className="hidden md:flex items-center gap-2 lg:gap-4">
              <button
                onClick={() => onNavigate("home")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === "home"
                    ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                الرئيسية
              </button>

              <button
                onClick={() => onNavigate("news")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === "news"
                    ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                الأخبار
              </button>

              <button
                onClick={() => onNavigate("chat")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === "chat"
                    ? "bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                الدردشة
              </button>

              <button
                onClick={() => onNavigate("whatsapp-upload")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === "whatsapp-upload" ||
                  currentPage === "whatsapp-chat"
                    ? "bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                واتساب AI
              </button>

              <button
                onClick={() => onNavigate("add")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === "add"
                    ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Plus className="w-4 h-4" />
                إضافة ملخص
              </button>

              {user ? (
                <>
                  {isAdminLoading ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 dark:text-gray-500">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      جاري التحقق...
                    </div>
                  ) : (
                    isAdmin && (
                      <button
                        onClick={() => onNavigate("admin")}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === "admin"
                            ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                        الإدارة
                      </button>
                    )
                  )}
                  <button
                    onClick={() => onNavigate("profile")}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === "profile"
                        ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    الملف الشخصي
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    خروج
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate("signup")}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    تسجيل
                  </button>
                  <button
                    onClick={() => onNavigate("login")}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    دخول
                  </button>
                </>
              )}

              {/* Notifications Dropdown */}
              <NotificationDropdown />

              {/* Theme Toggle Button - Desktop only */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={
                  theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"
                }
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Right side elements - Always visible */}
            <div className="flex items-center gap-2">
              {/* Notifications Dropdown */}
              <NotificationDropdown />

              {/* Mobile Menu Button - Mobile/tablet only */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="قائمة التنقل"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </nav>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div
              className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div
                className="fixed top-14 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg max-h-[calc(100vh-3.5rem)] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <nav className="flex flex-col p-3 sm:p-4 space-y-1 sm:space-y-2">
                  {/* Mobile Navigation Links */}
                  <button
                    onClick={() => handleNavigate("home")}
                    className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-lg text-sm sm:text-base font-medium transition-colors text-right touch-manipulation ${
                      currentPage === "home"
                        ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span>🏠</span>
                    <span>الرئيسية</span>
                  </button>

                  <button
                    onClick={() => handleNavigate("news")}
                    className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-lg text-sm sm:text-base font-medium transition-colors text-right touch-manipulation ${
                      currentPage === "news"
                        ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span>📰</span>
                    <span>الأخبار</span>
                  </button>

                  <button
                    onClick={() => handleNavigate("whatsapp-upload")}
                    className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-lg text-sm sm:text-base font-medium transition-colors text-right touch-manipulation ${
                      currentPage === "whatsapp-upload" ||
                      currentPage === "whatsapp-chat"
                        ? "bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span>💬</span>
                    <span>واتساب AI</span>
                  </button>

                  <button
                    onClick={() => handleNavigate("add")}
                    className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-lg text-sm sm:text-base font-medium transition-colors text-right touch-manipulation ${
                      currentPage === "add"
                        ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span>➕</span>
                    <span>إضافة ملخص</span>
                  </button>

                  {/* User Actions */}
                  {user ? (
                    <>
                      {isAdmin && (
                        <button
                          onClick={() => handleNavigate("admin")}
                          className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-lg text-sm sm:text-base font-medium transition-colors text-right touch-manipulation ${
                            currentPage === "admin"
                              ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          <span>🛡️</span>
                          <span>الإدارة</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleNavigate("profile")}
                        className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-lg text-sm sm:text-base font-medium transition-colors text-right touch-manipulation ${
                          currentPage === "profile"
                            ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <span>👤</span>
                        <span>الملف الشخصي</span>
                      </button>

                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-lg text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-right touch-manipulation"
                      >
                        <span>🚪</span>
                        <span>خروج</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleNavigate("signup")}
                        className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-lg text-sm sm:text-base font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors text-right touch-manipulation"
                      >
                        <span>📝</span>
                        <span>تسجيل</span>
                      </button>

                      <button
                        onClick={() => handleNavigate("login")}
                        className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-lg text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-right touch-manipulation"
                      >
                        <span>🔑</span>
                        <span>دخول</span>
                      </button>
                    </>
                  )}
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
