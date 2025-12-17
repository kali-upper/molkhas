import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { AddSummaryPage } from "./pages/AddSummaryPage";
import { SummaryDetailPage } from "./pages/SummaryDetailPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { LoginPage } from "./pages/LoginPage";
import { SignUpPage } from "./pages/SignUpPage";
import { NewsPage } from "./pages/NewsPage";
import { WhatsAppUploadPage } from "./pages/WhatsAppUploadPage";
import { WhatsAppChatPage } from "./pages/WhatsAppChatPage";
import { ProfilePage } from "./pages/ProfilePage";

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
      {currentPage === "home" && <HomePage onNavigate={navigate} />}
      {currentPage === "news" && <NewsPage onNavigate={navigate} />}
      {currentPage === "add" && <AddSummaryPage onNavigate={navigate} />}
      {currentPage === "summary" && (
        <SummaryDetailPage summaryId={summaryId} onNavigate={navigate} />
      )}
      {currentPage === "login" && <LoginPage onNavigate={navigate} />}
      {currentPage === "signup" && <SignUpPage onNavigate={navigate} />}
      {currentPage === "admin" &&
        (isAdmin ? (
          <AdminDashboard onNavigate={navigate} />
        ) : (
          <LoginPage onNavigate={navigate} />
        ))}
      {currentPage === "whatsapp-upload" && (
        <WhatsAppUploadPage onNavigate={navigate} />
      )}
      {currentPage === "whatsapp-chat" && (
        <WhatsAppChatPage onNavigate={navigate} />
      )}
      {currentPage === "profile" && <ProfilePage onNavigate={navigate} />}
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
