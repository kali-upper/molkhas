import React, { useState, useEffect } from "react";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useAnalytics } from "../hooks/useAnalytics";

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

function LoginPage({ onNavigate }: LoginPageProps) {
  const { signIn, signInWithGoogle, user } = useAuth();
  const { trackEvent, logError } = useAnalytics();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [showForgotPasswordForm, setShowForgotPasswordForm] = useState(false);

  // Auto navigate when user is successfully logged in
  // Auto navigate when user is successfully logged in
  useEffect(() => {
    if (user) {
      // Small delay to ensure state is fully updated
      const timer = setTimeout(() => {
        // Check if we should redirect to admin dashboard
        // We need to check the user metadata directly as isAdmin might not be updated yet
        const role = user.user_metadata?.role;
        if (role === "admin") {
          onNavigate("admin");
        } else {
          onNavigate("home");
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, onNavigate]);

  // Load attempts from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("login_attempts");
      if (stored) {
        const { count, timestamp } = JSON.parse(stored);
        const timeDiff = Date.now() - timestamp;
        const lockoutDuration = Math.min(count * 30000, 300000); // Max 5 minutes

        if (timeDiff < lockoutDuration) {
          setAttempts(count);
          setLockoutTime(lockoutDuration - timeDiff);
        } else {
          // Reset if lockout expired
          localStorage.removeItem("login_attempts");
        }
      }
    } catch (error) {
      console.warn("Error loading login attempts:", error);
    }
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setTimeout(() => {
        setLockoutTime((prev) => Math.max(0, prev - 1000));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is locked out
    if (lockoutTime > 0) {
      setError(
        `تم تعليق المحاولات. انتظر ${Math.ceil(lockoutTime / 1000)} ثانية`
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signIn(email, password);

      // Reset attempts on successful login
      setAttempts(0);
      setLockoutTime(0);
      localStorage.removeItem("login_attempts");

      trackEvent("login_success", { method: "email" });

      // Don't navigate immediately - let AuthContext handle the state update
    } catch (err) {
      console.error("Error signing in:", err);
      logError(err instanceof Error ? err : String(err), {
        message: "Login failed",
        metadata: { method: "email" }, // Do NOT log email
      });
      trackEvent("login_failure", { method: "email" });

      // Increment attempts and set lockout
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      // Store in localStorage for persistence
      const lockoutDuration = Math.min(newAttempts * 30000, 300000); // Max 5 minutes
      localStorage.setItem(
        "login_attempts",
        JSON.stringify({
          count: newAttempts,
          timestamp: Date.now(),
        })
      );

      if (newAttempts >= 20) {
        setLockoutTime(lockoutDuration);
        setError(
          `تم تعليق المحاولات بسبب محاولات فاشلة متكررة. انتظر ${Math.ceil(
            lockoutDuration / 1000
          )} ثانية`
        );
      } else {
        setError("خطأ في البريد الإلكتروني أو كلمة المرور");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      await signInWithGoogle();
      trackEvent("login_success", { method: "google" });
      // سيتم إعادة التوجيه تلقائياً
    } catch (err) {
      console.error("Error signing in with Google:", err);
      logError(err instanceof Error ? err : String(err), {
        message: "Google login failed",
        metadata: { method: "google" },
      });
      trackEvent("login_failure", { method: "google" });
      setError("حدث خطأ أثناء تسجيل الدخول بـ Google. يرجى المحاولة مرة أخرى.");
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("يرجى إدخال البريد الإلكتروني أولاً");
      return;
    }

    setResetLoading(true);
    setError("");
    setResetMessage("");

    try {
      // Call our custom Edge Function with Brevo
      const response = await fetch(
        `${
          import.meta.env.VITE_SUPABASE_URL
        }/functions/v1/request-password-reset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ email }),
        }
      );

      console.log("Function response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Function error:", errorText);
        throw new Error("فشل في إرسال طلب إعادة التعيين");
      }

      const data = await response.json();
      console.log("Function response data:", data);

      if (!data.success) {
        throw new Error(data.error || "فشل في إرسال طلب إعادة التعيين");
      }

      setSuccess(
        "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من بريدك الإلكتروني ومجلد السبام (Spam) إذا لم يصلك الإيميل."
      );
      trackEvent("password_reset_requested", { method: "edge_function" });
    } catch (err) {
      console.error("Error sending reset password email:", err);
      logError(err instanceof Error ? err : String(err), {
        message: "Password reset failed",
        metadata: { method: "brevo" },
      });
      trackEvent("password_reset_failure", { method: "brevo" });
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء إرسال رابط إعادة التعيين. يرجى المحاولة مرة أخرى."
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
        <div className="text-center mb-8">
          <div className="bg-blue-100 dark:bg-blue-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {showForgotPasswordForm ? "نسيت كلمة المرور؟" : "تسجيل الدخول"}
          </h1>
          {!showForgotPasswordForm && (
            <p className="text-gray-600 dark:text-gray-400">
              تسجيل الدخول إلى حسابك
            </p>
          )}
        </div>

        {(error || success || resetMessage) && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              error
                ? "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
                : "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300"
            }`}
          >
            {error || success || resetMessage}
          </div>
        )}

        {showForgotPasswordForm ? (
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div>
              <label
                htmlFor="forgot-email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                البريد الإلكتروني
              </label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="admin@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={resetLoading || !email.trim()}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resetLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <span>إرسال رابط إعادة التعيين</span>
              )}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setResetMessage("");
                  setShowForgotPasswordForm(false);
                }}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                العودة إلى تسجيل الدخول
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                البريد الإلكتروني
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setError(""); // Clear any existing errors
                  setResetMessage(""); // Clear any existing reset messages
                  setShowForgotPasswordForm(true); // <--- يظهر نموذج نسيان كلمة المرور
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                نسيت كلمة المرور؟
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>جاري تسجيل الدخول...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                أو
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="mt-6 w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-200 dark:focus:ring-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700 dark:border-gray-300"></div>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          <span>تسجيل الدخول باستخدام Google</span>
        </button>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ليس لديك حساب؟{" "}
            <button
              onClick={() => onNavigate("signup")}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              إنشاء حساب جديد
            </button>
          </p>
          <button
            onClick={() => onNavigate("home")}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            العودة إلى الصفحة الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
