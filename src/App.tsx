import { useState, useEffect, Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ChatProvider } from "./contexts/ChatContext";
import { NotificationProvider } from "./components/NotificationManager";
import { Layout } from "./components/Layout";

// Lazy load all page components for code splitting
const HomePage = lazy(() => import("./pages/HomePage"));
const AddSummaryPage = lazy(() => import("./pages/AddSummaryPage"));
const SummaryDetailPage = lazy(() => import("./pages/SummaryDetailPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const WhatsAppUploadPage = lazy(() => import("./pages/WhatsAppUploadPage"));
const WhatsAppChatPage = lazy(() => import("./pages/WhatsAppChatPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                جاري التحميل...
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
        {currentPage === "chat" && <ChatPage />}
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
          <ChatProvider>
            <AppContent />
          </ChatProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
