import { useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./components/NotificationManager";
import { Layout } from "./components/Layout";
import { useAnalytics } from "./hooks/useAnalytics";

// Eager load critical pages, lazy load others for better performance
import HomePage from "./pages/HomePage";
import AddSummaryPage from "./pages/AddSummaryPage";
const EditSummaryPage = lazy(() => import("./pages/EditSummaryPage"));

// Lazy load less critical pages
const SummaryDetailPage = lazy(() => import("./pages/SummaryDetailPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
// Group AI-related pages together for better chunking
const AiAssistantUploadPage = lazy(() => import("./pages/AiAssistantUploadPage"));
const AiAssistantChatPage = lazy(() => import("./pages/AiAssistantChatPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

// Protected Route Component
function ProtectedRoute({ children, adminOnly = false }: { children: JSX.Element, adminOnly?: boolean }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppContent() {
  const { loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize analytics automatically
  useAnalytics();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

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
    <Layout>
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
        <Routes>
          <Route path="/" element={<HomePage onNavigate={(page: string, id?: string) => { navigate(id ? `/${page}/${id}` : `/${page}`); }} />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/news" element={<NewsPage onNavigate={(page: string, id?: string) => { navigate(id ? `/${page}/${id}` : `/${page}`); }} />} />
          <Route path="/add" element={
            <ProtectedRoute>
              <AddSummaryPage onNavigate={(page: string, id?: string) => { navigate(id ? `/${page}/${id}` : `/${page}`); }} />
            </ProtectedRoute>
          } />
          <Route path="/edit/:summaryId" element={
            <ProtectedRoute>
              <EditSummaryPageWrapper onNavigate={(page: string, id?: string) => { navigate(id ? `/${page}/${id}` : `/${page}`); }} />
            </ProtectedRoute>
          } />
          <Route path="/summary/:summaryId" element={<SummaryDetailPageWrapper onNavigate={(page: string, id?: string) => { navigate(id ? `/${page}/${id}` : `/${page}`); }} />} />
          <Route path="/login" element={<LoginPage onNavigate={(page: string, id?: string) => { navigate(id ? `/${page}/${id}` : `/${page}`); }} />} />
          <Route path="/signup" element={<SignUpPage onNavigate={(page: string, id?: string) => { navigate(id ? `/${page}/${id}` : `/${page}`); }} />} />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/ai-assistant-upload" element={<AiAssistantUploadPage onNavigate={(page: string, id?: string) => { navigate(id ? `/${page}/${id}` : `/${page}`); }} />} />
          <Route path="/ai-assistant-chat" element={<AiAssistantChatPage onNavigate={(page: string, id?: string) => { navigate(id ? `/${page}/${id}` : `/${page}`); }} />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage onNavigate={(page: string, id?: string) => { navigate(id ? `/${page}/${id}` : `/${page}`); }} />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

// Helper component to extract summaryId from URL params
import { useParams } from "react-router-dom";
function SummaryDetailPageWrapper({ onNavigate }: { onNavigate: (page: string, id?: string) => void }) {
  const { summaryId } = useParams<{ summaryId: string }>();
  return <SummaryDetailPage summaryId={summaryId || ""} onNavigate={onNavigate} />;
}

function EditSummaryPageWrapper({ onNavigate }: { onNavigate: (page: string, id?: string) => void }) {
  const { summaryId } = useParams<{ summaryId: string }>();
  // Pass key to force re-mount when ID changes
  return <EditSummaryPage key={summaryId} onNavigate={onNavigate} />;
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

