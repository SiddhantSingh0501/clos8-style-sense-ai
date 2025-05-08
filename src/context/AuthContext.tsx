import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { User, Session, AuthError, AuthResponse } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    options?: { redirectTo?: string }
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const authStateSubscription = useRef<{ unsubscribe: () => void }>();

  // Handle authentication errors in a consistent way
  const handleAuthError = useCallback(
    (error: AuthError | Error, title: string): void => {
      console.error(`Auth error (${title}):`, error);

      // Determine the most user-friendly error message
      let errorMessage = error.message;

      // Handle common auth errors with friendly messages
      if (error instanceof AuthError) {
        switch (error.message) {
          case "Invalid login credentials":
            errorMessage = "The email or password you entered is incorrect.";
            break;
          case "Email not confirmed":
            errorMessage =
              "Please check your email and confirm your account before signing in.";
            break;
          case "Password should be at least 6 characters":
            errorMessage = "Your password must be at least 6 characters long.";
            break;
          case "User already registered":
            errorMessage =
              "An account with this email already exists. Try signing in instead.";
            break;
          // Add more specific error cases as needed
        }
      }

      toast({
        title,
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    },
    [toast]
  );

  // Initialize auth state and subscribe to auth changes
  const initializeAuth = useCallback(async () => {
    try {
      // Get current session
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const currentSession = sessionData.session;
      setSession(currentSession);

      if (currentSession?.user) {
        setUser(currentSession.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }

      // Set up auth state listener
      const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
        // Handle different auth events
        switch (event) {
          case "SIGNED_IN":
            setSession(newSession);
            setUser(newSession?.user ?? null);
            setIsAuthenticated(!!newSession);
            break;
          case "SIGNED_OUT":
            setSession(null);
            setUser(null);
            setIsAuthenticated(false);
            break;
          case "TOKEN_REFRESHED":
            setSession(newSession);
            break;
          case "USER_UPDATED":
            setUser(newSession?.user ?? null);
            break;
        }
      });

      // Store subscription reference for cleanup
      authStateSubscription.current = data.subscription;
    } catch (error) {
      console.error("Error initializing auth:", error);
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Clean up subscription when component unmounts
  useEffect(() => {
    initializeAuth();

    return () => {
      authStateSubscription.current?.unsubscribe();
    };
  }, [initializeAuth]);

  // Refresh the session
  const refreshSession = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.refreshSession();

      if (error) throw error;

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      if (error instanceof Error) {
        handleAuthError(error, "Error refreshing session");
      }
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  // Sign up a new user
  const signUp = async (
    email: string,
    password: string,
    options?: { redirectTo?: string }
  ) => {
    try {
      setLoading(true);

      // Validate input
      if (!email.trim() || !password.trim()) {
        throw new Error("Email and password are required");
      }

      // Create auth options with redirect URL if provided
      const authOptions = options?.redirectTo
        ? { emailRedirectTo: options.redirectTo }
        : undefined;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: authOptions,
      });

      if (error) throw error;

      // Check if email confirmation is required
      if (data?.user?.identities?.length === 0) {
        toast({
          title: "Confirmation email sent",
          description: "Please check your email to confirm your account.",
        });
      } else {
        toast({
          title: "Account created successfully!",
          description: "Welcome to Clos8!",
        });

        if (data.user) {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        handleAuthError(error, "Error creating account");
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign in an existing user
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      // Validate input
      if (!email.trim() || !password.trim()) {
        throw new Error("Email and password are required");
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Logged in successfully!",
        description: "Welcome back!",
      });
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        handleAuthError(error, "Error signing in");
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign out the current user
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Logged out successfully",
      });
      navigate("/");
    } catch (error) {
      if (error instanceof Error) {
        handleAuthError(error, "Error signing out");
      }
    } finally {
      setLoading(false);
    }
  };

  // Send a password reset email
  const resetPassword = async (email: string) => {
    try {
      setLoading(true);

      if (!email.trim()) {
        throw new Error("Email is required");
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Password reset email sent",
        description: "Check your email for a password reset link.",
      });
    } catch (error) {
      if (error instanceof Error) {
        handleAuthError(error, "Error resetting password");
      }
    } finally {
      setLoading(false);
    }
  };

  // Update the user's password
  const updatePassword = async (password: string) => {
    try {
      setLoading(true);

      if (!password.trim() || password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      toast({
        title: "Password updated successfully",
      });
    } catch (error) {
      if (error instanceof Error) {
        handleAuthError(error, "Error updating password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        refreshSession,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
