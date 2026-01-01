import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { chatHelpers } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isAdminLoading: boolean;
  displayName: string | null;
  updateDisplayName: (name: string) => Promise<void>;
  refreshAdminStatus: () => Promise<boolean>;
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

  // Helper to extract display name from user metadata or email
  const getDisplayName = useCallback((u: User) => {
    return (
      u.user_metadata?.display_name ||
      u.user_metadata?.name ||
      u.email?.split("@")[0] ||
      "مستخدم"
    );
  }, []);

  // Centralized function to verify admin status
  const verifyAdminStatus = useCallback(async (u: User | null) => {
    if (!u) {
      setIsAdmin(false);
      setIsAdminLoading(false);
      return false;
    }

    // 1. Immediate check from metadata (Fastest)
    const metadataRole = u.user_metadata?.role;
    if (metadataRole === "admin") {
      setIsAdmin(true);
      setIsAdminLoading(false);
      return true;
    }

    // 2. Background check from database (Reliable)
    setIsAdminLoading(true);
    try {
      const { data, error } = await Promise.race([
        supabase.from("admins").select("user_id").eq("user_id", u.id).single(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Admin check timeout")), 5000)
        ),
      ]) as any;

      const isDbAdmin = !!data && !error;
      setIsAdmin(isDbAdmin);
      return isDbAdmin;
    } catch (err) {
      console.error("AuthContext: Admin check failed", err);
      // Fallback to false but don't block the UI
      setIsAdmin(false);
      return false;
    } finally {
      setIsAdminLoading(false);
    }
  }, []);

  // Public function to force refresh admin status
  const refreshAdminStatus = async () => {
    // Force refresh user to get latest metadata
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    if (freshUser) setUser(freshUser);
    return await verifyAdminStatus(freshUser);
  };

  // Initialize and listen to auth changes
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setDisplayName(currentUser ? getDisplayName(currentUser) : null);
        
        // Start admin check but don't block initial loading
        if (currentUser) {
          verifyAdminStatus(currentUser);
        }
      } catch (err) {
        console.error("AuthContext: Initialization failed", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setDisplayName(currentUser ? getDisplayName(currentUser) : null);
        setLoading(false);

        if (currentUser) {
          verifyAdminStatus(currentUser);
          
          // Analytics for sign in
          if (event === "SIGNED_IN") {
            chatHelpers.recordAnalytics({
              userId: currentUser.id,
              actionType: "ai_interaction",
              contentType: "user_login",
              metadata: { provider: currentUser.app_metadata?.provider || "email" },
            }).catch(console.error);
          }
        } else {
          setIsAdmin(false);
          setIsAdminLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [getDisplayName, verifyAdminStatus]);

  const updateDisplayName = async (name: string) => {
    if (!user) throw new Error("No user logged in");
    const { error } = await supabase.auth.updateUser({
      data: { display_name: name },
    });
    if (error) throw error;
    setDisplayName(name);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (user) {
      chatHelpers.recordAnalytics({
        userId: user.id,
        actionType: "user_logout",
        contentType: "user_logout",
      }).catch(console.error);
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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
        refreshAdminStatus,
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
