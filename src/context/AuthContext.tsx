import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isUsingMockSupabase } from '../lib/supabase';
import { UserProfile } from '../types';

import { isEmailNotConfirmedError, EMAIL_NOT_CONFIRMED_MESSAGE } from '../utils/authHelpers';

export interface AuthError {
  message: string;
  isEmailNotConfirmed?: boolean;
}

export interface SignUpResult {
  data: any;
  error: AuthError | null;
  needsEmailConfirmation?: boolean;
}

export interface LoginResult {
  data: any;
  error: AuthError | null;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isMockAuth: boolean;
  signUp: (fullName: string, email: string, password: string) => Promise<SignUpResult>;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  updateProfile: (updates: { full_name?: string; role?: string; avatar_url?: string }) => Promise<{ error: { message: string } | null }>;
  resetPassword: (email: string) => Promise<{ error: { message: string } | null }>;
  resendConfirmationEmail: (email: string) => Promise<{ error: { message: string } | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to normalize Supabase / Mock user into UserProfile
  const mapUserToProfile = (rawUser: any): UserProfile => {
    const meta = rawUser.user_metadata || {};
    const fullName = meta.full_name || rawUser.email?.split('@')[0] || 'User';
    const role = meta.role || 'Student / Developer';
    const avatarUrl = meta.avatar_url || '';

    return {
      id: rawUser.id,
      email: rawUser.email || '',
      full_name: fullName,
      role,
      avatar_url: avatarUrl,
      created_at: rawUser.created_at || new Date().toISOString(),
    };
  };

  useEffect(() => {
    let mounted = true;

    async function checkAuthSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Auth session check notice:', error.message);
        }
        if (mounted && data?.session?.user) {
          setUser(mapUserToProfile(data.session.user));
        } else if (mounted) {
          setUser(null);
        }
      } catch (err) {
        console.error('Session retrieval error:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    checkAuthSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event: string, session: any) => {
        if (session?.user) {
          setUser(mapUserToProfile(session.user));
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (
    fullName: string,
    email: string,
    password: string
  ): Promise<SignUpResult> => {
    try {
      const trimmedEmail = email.trim();
      const trimmedName = fullName.trim() || trimmedEmail.split('@')[0];

      const appOrigin =
        typeof window !== 'undefined'
          ? window.location.origin
          : import.meta.env.VITE_APP_URL || '';

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: appOrigin ? `${appOrigin}/login` : undefined,
          data: {
            full_name: trimmedName,
            role: 'Student / Developer',
          },
        },
      });

      if (error) {
        const isEmailNotConfirmed = isEmailNotConfirmedError(error);
        return {
          data: null,
          error: {
            message: isEmailNotConfirmed ? EMAIL_NOT_CONFIRMED_MESSAGE : error.message,
            isEmailNotConfirmed,
          },
          needsEmailConfirmation: false,
        };
      }

      // Check if user already exists (Supabase security feature: returns user with empty identities)
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return {
          data: null,
          error: { message: 'An account with this email already exists. Please log in instead.' },
          needsEmailConfirmation: false,
        };
      }

      // Email confirmation check:
      // When Supabase requires email confirmation, data.session is null and user is not confirmed.
      const isConfirmed = Boolean(data?.user?.email_confirmed_at || data?.user?.confirmed_at);
      const hasSession = Boolean(data?.session);
      const needsEmailConfirmation = Boolean(data?.user && !hasSession && !isConfirmed);

      if (hasSession && data?.user) {
        setUser(mapUserToProfile(data.user));
      } else {
        // Do not immediately assume user is logged in
        setUser(null);
      }

      return {
        data,
        error: null,
        needsEmailConfirmation,
      };
    } catch (err: unknown) {
      const isEmailNotConfirmed = isEmailNotConfirmedError(err);
      const errorObj = err as { message?: string };
      return {
        data: null,
        error: {
          message: isEmailNotConfirmed
            ? EMAIL_NOT_CONFIRMED_MESSAGE
            : errorObj?.message || 'An unexpected sign-up error occurred.',
          isEmailNotConfirmed,
        },
        needsEmailConfirmation: false,
      };
    }
  };

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const trimmedEmail = email.trim();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        const isEmailNotConfirmed = isEmailNotConfirmedError(error);
        return {
          data: null,
          error: {
            message: isEmailNotConfirmed ? EMAIL_NOT_CONFIRMED_MESSAGE : error.message,
            isEmailNotConfirmed,
          },
        };
      }

      if (data?.user) {
        setUser(mapUserToProfile(data.user));
      }

      return { data, error: null };
    } catch (err: unknown) {
      const isEmailNotConfirmed = isEmailNotConfirmedError(err);
      const errorObj = err as { message?: string };
      return {
        data: null,
        error: {
          message: isEmailNotConfirmed
            ? EMAIL_NOT_CONFIRMED_MESSAGE
            : errorObj?.message || 'Network failure or server unavailable.',
          isEmailNotConfirmed,
        },
      };
    }
  };

  const resendConfirmationEmail = async (
    email: string
  ): Promise<{ error: { message: string } | null }> => {
    try {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        return { error: { message: 'Please enter your email address.' } };
      }

      const appOrigin =
        typeof window !== 'undefined'
          ? window.location.origin
          : import.meta.env.VITE_APP_URL || '';

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: trimmedEmail,
        options: {
          emailRedirectTo: appOrigin ? `${appOrigin}/login` : undefined,
        },
      });

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      return {
        error: {
          message: errorObj?.message || 'Failed to resend confirmation email.',
        },
      };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (updates: { full_name?: string; role?: string; avatar_url?: string }) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) {
        return { error: { message: error.message } };
      }

      if (data?.user) {
        setUser(mapUserToProfile(data.user));
      } else if (user) {
        setUser({
          ...user,
          full_name: updates.full_name !== undefined ? updates.full_name : user.full_name,
          role: updates.role !== undefined ? updates.role : user.role,
          avatar_url: updates.avatar_url !== undefined ? updates.avatar_url : user.avatar_url,
        });
      }

      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message || 'Failed to update profile.' } };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const appOrigin = typeof window !== 'undefined' ? window.location.origin : import.meta.env.VITE_APP_URL || '';
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: appOrigin ? `${appOrigin}/login` : undefined,
      });
      if (error) {
        return { error: { message: error.message } };
      }
      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message || 'Failed to send password reset.' } };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isMockAuth: isUsingMockSupabase,
        signUp,
        login,
        logout,
        updateProfile,
        resetPassword,
        resendConfirmationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
