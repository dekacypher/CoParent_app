import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, metadata?: { username?: string; role?: string }) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, navigate] = useLocation();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Redirect to login on sign out
      if (_event === 'SIGNED_OUT') {
        navigate('/login');
      }

      // Redirect to dashboard on sign in (if on login/register page)
      if (_event === 'SIGNED_IN' && (location === '/login' || location === '/register')) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [location]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: { username?: string; role?: string }
  ) => {
    try {
      // Sign up with email confirmation
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        // Log error for debugging
        console.error('Sign up error:', error);

        // Provide helpful error messages
        if (error.message.includes('User already registered')) {
          return {
            error: {
              message: "An account with this email already exists. Please try logging in or use a different email address.",
              name: error.name,
            } as AuthError,
          };
        }

        return { error };
      }

      // Success - check if email confirmation is needed
      if (data.user && !data.user.email_confirmed_at) {
        // Email confirmation is required
        console.log('User created, email confirmation required');
        return {
          error: {
            message: "Account created! Please check your email inbox (and spam folder) for a verification link. Click the link to activate your account.",
            name: "EmailNotConfirmed",
            userCreated: true,
          } as AuthError,
        };
      }

      // Email confirmation disabled - user is ready to login
      return { error: null };
    } catch (e: any) {
      console.error('Sign up exception:', e);
      return {
        error: {
          message: e.message || "An unexpected error occurred. Please try again.",
          name: "SignUpError",
        } as AuthError,
      };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
