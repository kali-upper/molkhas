import React, { useState, useEffect } from "react";
import { UserPlus, Mail, Lock, ArrowLeft, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface SignUpPageProps {
  onNavigate: (page: string) => void;
}

function SignUpPage({ onNavigate }: SignUpPageProps) {
  const { signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load attempts from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("signup_attempts");
      if (stored) {
        const { count, timestamp } = JSON.parse(stored);
        const timeDiff = Date.now() - timestamp;
        const lockoutDuration = Math.min(count * 30000, 300000); // Max 5 minutes

        if (timeDiff < lockoutDuration) {
          setAttempts(count);
          setLockoutTime(lockoutDuration - timeDiff);
        } else {
          // Reset if lockout expired
          localStorage.removeItem("signup_attempts");
        }
      }
    } catch (error) {
      console.warn("Error loading signup attempts:", error);
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
    setError("");
    setSuccess("");

    // Check if user is locked out
    if (lockoutTime > 0) {
      setError(
        `تم تعليق المحاولات. انتظر ${Math.ceil(lockoutTime / 1000)} ثانية`
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("كلمة المرور غير متطابقة");
      return;
    }

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      setSuccess(
        "تم إرسال رابط التأكيد إلى بريدك الإلكتروني. يرجى التحقق من بريدك الإلكتروني."
      );
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // Reset attempts on successful signup
      setAttempts(0);
      setLockoutTime(0);
      localStorage.removeItem("signup_attempts");
    } catch (err: unknown) {
      console.error("Error signing up:", err);

      // Increment attempts and set lockout
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      // Store in localStorage for persistence
      const lockoutDuration = Math.min(newAttempts * 30000, 300000); // Max 5 minutes
      localStorage.setItem(
        "signup_attempts",
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
        if (
          err instanceof Error &&
          err.message?.includes("already registered")
        ) {
          setError(
            "هذا البريد الإلكتروني مسجل بالفعل. جرب تسجيل الدخول بدلاً من ذلك."
          );
        } else {
          setError("حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Error signing up with Google:", err);
      setError("حدث خطأ أثناء التسجيل بـ Google. يرجى المحاولة مرة أخرى.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
        <div className="text-center mb-8">
          <div className="bg-blue-100 dark:bg-blue-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            إنشاء حساب جديد
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            انضم إلى مجتمع الطلاب
          </p>
        </div>

        {(error || success) && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              error
                ? "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
                : "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300"
            }`}
          >
            {error || success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="signup-email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                id="signup-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="student@university.edu"
              />
              <Mail className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div>
            <label
              htmlFor="signup-password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              كلمة المرور
            </label>
            <div className="relative">
              <input
                id="signup-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-12 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="••••••••"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="signup-confirm-password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              تأكيد كلمة المرور
            </label>
            <div className="relative">
              <input
                id="signup-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pr-12 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="••••••••"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>جاري إنشاء الحساب...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>إنشاء حساب</span>
              </>
            )}
          </button>
        </form>

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
          onClick={handleGoogleSignUp}
          disabled={googleLoading}
          className="mt-6 w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <span>التسجيل باستخدام Google</span>
        </button>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            لديك حساب بالفعل؟{" "}
            <button
              onClick={() => onNavigate("login")}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              تسجيل الدخول
            </button>
          </p>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mx-auto transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة إلى الصفحة الرئيسية</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
