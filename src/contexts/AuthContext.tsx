import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isAdminLoading: boolean;
  displayName: string | null;
  updateDisplayName: (name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Track ongoing admin checks to prevent duplicates
  const ongoingAdminChecks = new Set<string>();

  // Track previous user ID to avoid unnecessary admin checks
  const prevUserIdRef = useRef<string | null>(null);

  // Get admin emails from environment variables (more secure than hardcoding)
  const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "")
    .split(",")
    .map((email: string) => email.trim())
    .filter(Boolean);

  // Cache admin status in localStorage to avoid repeated checks
  const ADMIN_STATUS_KEY = "molkhas_admin_status";
  const ADMIN_USER_ID_KEY = "molkhas_admin_user_id";

  const getCachedAdminStatus = (userId: string) => {
    try {
      const cachedUserId = localStorage.getItem(ADMIN_USER_ID_KEY);
      const cachedStatus = localStorage.getItem(ADMIN_STATUS_KEY);

      if (cachedUserId === userId && cachedStatus !== null) {
        return JSON.parse(cachedStatus);
      }
    } catch (error) {
      console.warn("Error reading admin status from cache:", error);
    }
    return null;
  };

  const setCachedAdminStatus = (userId: string, isAdmin: boolean) => {
    try {
      localStorage.setItem(ADMIN_USER_ID_KEY, userId);
      localStorage.setItem(ADMIN_STATUS_KEY, JSON.stringify(isAdmin));
    } catch (error) {
      console.warn("Error caching admin status:", error);
    }
  };

  const clearAdminCache = () => {
    try {
      localStorage.removeItem(ADMIN_STATUS_KEY);
      localStorage.removeItem(ADMIN_USER_ID_KEY);
    } catch (error) {
      console.warn("Error clearing admin cache:", error);
    }
  };

  const checkAdminStatus = async (currentUser: User | null) => {
    if (!currentUser) {
      setIsAdmin(false);
      setDisplayName(null);
      return;
    }

    // Set display name immediately (doesn't depend on database)
    const customDisplayName = currentUser.user_metadata?.display_name;
    const googleName = currentUser.user_metadata?.name;
    const fallbackName = splitEmail(currentUser.email || "");
    const displayName = customDisplayName || googleName || fallbackName;
    setDisplayName(displayName);

    // 🚀 IMMEDIATE ADMIN DETECTION - No database calls needed!
    if (ADMIN_EMAILS.includes(currentUser.email || "")) {
      setIsAdmin(true);
      setIsAdminLoading(false);
      setCachedAdminStatus(currentUser.id, true); // Cache for future use
      return;
    }

    // Check if we already have an ongoing check for this user
    if (ongoingAdminChecks.has(currentUser.id)) {
      return;
    }

    // Mark this check as in progress
    ongoingAdminChecks.add(currentUser.id);

    // Check cache first
    const cachedAdminStatus = getCachedAdminStatus(currentUser.id);
    if (cachedAdminStatus !== null) {
      setIsAdmin(cachedAdminStatus);
      setIsAdminLoading(false);
      return;
    }

    setIsAdminLoading(true);

    // Check admin status immediately for better UX
    const checkAdminNow = async () => {
      // Store the user ID we're checking for to avoid race conditions
      const checkedUserId = currentUser.id;

      try {
        console.log(
          "🔍 Starting admin database check for user ID:",
          checkedUserId
        );

        // Single efficient query: check if user exists in admins table
        const { data: adminData, error: adminError } = await supabase
          .from("admins")
          .select("user_id")
          .eq("user_id", checkedUserId)
          .limit(1);

        // Check if user is admin
        const isAdminUser = !adminError && adminData && adminData.length > 0;

        // Always cache the result for the checked user, regardless of current user state
        setCachedAdminStatus(checkedUserId, isAdminUser);

        // Only update state if we still have the same user
        if (user?.id === checkedUserId) {
          setIsAdmin(isAdminUser);
        }
      } catch (error) {
        console.error("❌ Error checking admin status:", error);
        // Keep isAdmin as false by default
      } finally {
        setIsAdminLoading(false);
        // Clean up the ongoing check tracking
        ongoingAdminChecks.delete(checkedUserId);
      }
    };

    // Execute check immediately
    checkAdminNow();
  };

  const updateDisplayName = async (name: string) => {
    if (!user) throw new Error("No user logged in");

    const { error } = await supabase.auth.updateUser({
      data: { display_name: name },
    });

    if (error) throw error;
    setDisplayName(name);
  };

  const splitEmail = (email: string) => {
    return email.split("@")[0];
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      checkAdminStatus(currentUser);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;

      // Only check admin status if the user actually changed
      const userChanged = prevUserIdRef.current !== currentUser?.id;

      setUser(currentUser);
      prevUserIdRef.current = currentUser?.id ?? null;

      if (userChanged) {
        checkAdminStatus(currentUser);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // Clear admin cache on sign out
    clearAdminCache();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isAdminLoading,
        displayName,
        updateDisplayName,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
