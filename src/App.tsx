import { useState, useEffect, Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./components/NotificationManager";
import { Layout } from "./components/Layout";

// Eager load critical pages, lazy load others for better performance
import HomePage from "./pages/HomePage";
import AddSummaryPage from "./pages/AddSummaryPage";

// Lazy load less critical pages
const SummaryDetailPage = lazy(() => import("./pages/SummaryDetailPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
// Group AI-related pages together for better chunking
const WhatsAppUploadPage = lazy(() => import("./pages/WhatsAppUploadPage"));
const WhatsAppChatPage = lazy(() => import("./pages/WhatsAppChatPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

function AppContent() {
  const [currentPage, setCurrentPage] = useState<string>("home");
  const [summaryId, setSummaryId] = useState<string>("");
  const { loading, isAdmin, user } = useAuth();

  // Navigate to appropriate page based on user state
  useEffect(() => {
    if (!loading) {
      if (user) {
        // If user is logged in and on login/signup page, redirect to home
        if (currentPage === "login" || currentPage === "signup") {
          setCurrentPage("home");
        }
      } else {
        // If user is not logged in and trying to access protected pages, redirect to login
        if (currentPage === "admin" || currentPage === "add") {
          setCurrentPage("login");
        }
      }
    }
  }, [loading, user, currentPage]);

  const navigate = (page: string, id?: string) => {
    setCurrentPage(page);
    if (id) setSummaryId(id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
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
    <Layout currentPage={currentPage} onNavigate={navigate}>
      <Suspense
        fallback={
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-full mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto mb-2"></div>
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-24 mx-auto"></div>
              </div>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
                تحميل الصفحة...
              </p>
            </div>
          </div>
        }
      >
        {currentPage === "home" && <HomePage onNavigate={navigate} />}
        {currentPage === "news" && <NewsPage onNavigate={navigate} />}
        {currentPage === "add" && <AddSummaryPage onNavigate={navigate} />}
        {currentPage === "summary" && (
          <SummaryDetailPage summaryId={summaryId} onNavigate={navigate} />
        )}
        {currentPage === "login" && <LoginPage onNavigate={navigate} />}
        {currentPage === "signup" && <SignUpPage onNavigate={navigate} />}
        {currentPage === "admin" &&
          (isAdmin ? <AdminDashboard /> : <LoginPage onNavigate={navigate} />)}
        {currentPage === "whatsapp-upload" && (
          <WhatsAppUploadPage onNavigate={navigate} />
        )}
        {currentPage === "whatsapp-chat" && (
          <WhatsAppChatPage onNavigate={navigate} />
        )}
        {currentPage === "profile" && <ProfilePage onNavigate={navigate} />}
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
