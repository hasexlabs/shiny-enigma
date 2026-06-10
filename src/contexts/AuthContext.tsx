import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import {
  onAuthStateChange,
  signInWithGoogle,
  signUpWithEmail,
  signInWithEmail,
  resetPassword,
  logoutUserSession,
  checkEmailVerified,
  supabase
} from "../lib/supabase";

const AuthContextType = {
  user: null as User | null,
  loading: true,
  error: null as string | null,
  signInWithGoogle: async () => {},
  signUp: async (email: string, password: string, displayName?: string) => {},
  signIn: async (email: string, password: string) => {},
  signOut: async () => {},
  resetPassword: async (email: string) => {},
  isEmailVerified: false,
  checkVerification: async () => false
};

type AuthContextValueType = typeof AuthContextType & {
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  checkVerification: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValueType | undefined>(undefined);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        const verified = await checkEmailVerified();
        setIsEmailVerified(verified);
      } else {
        setIsEmailVerified(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignInWithGoogle = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
      throw err;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      setError(null);
      await signUpWithEmail(email, password, displayName);
    } catch (err: any) {
      setError(err.message || "Failed to create account");
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmail(email, password);
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await logoutUserSession();
      setUser(null);
      setIsEmailVerified(false);
    } catch (err: any) {
      setError(err.message || "Failed to sign out");
      throw err;
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      setError(null);
      await resetPassword(email);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
      throw err;
    }
  };

  const checkVerification = async () => {
    try {
      const verified = await checkEmailVerified();
      setIsEmailVerified(verified);
      return verified;
    } catch (err: any) {
      setError(err.message || "Failed to check email verification");
      return false;
    }
  };

  const value: AuthContextValueType = {
    user,
    loading,
    error,
    signInWithGoogle: handleSignInWithGoogle,
    signUp,
    signIn,
    signOut,
    resetPassword: handleResetPassword,
    isEmailVerified,
    checkVerification
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthProvider, useAuth };