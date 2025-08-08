import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { AuthService } from '../services/supabase/auth';
import { DatabaseService } from '../services/supabase/database';
import { AuthState, User, LoginCredentials, RegisterCredentials } from '../types/auth';

// Auth Actions
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SIGN_OUT' };

// Auth Context Type
interface AuthContextType extends AuthState {
  signIn: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  signUp: (credentials: RegisterCredentials) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

// Initial State
const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
};

// Auth Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SIGN_OUT':
      return { ...state, user: null, loading: false, error: null };
    default:
      return state;
  }
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Convert Supabase session to User (basic info from auth)
function sessionToUser(session: Session | null): User | null {
  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email || '',
    username: session.user.user_metadata?.username || '',
    fullName: session.user.user_metadata?.full_name || '',
    avatarUrl: session.user.user_metadata?.avatar_url || '',
    school: session.user.user_metadata?.school || '',
    gradeLevel: session.user.user_metadata?.grade_level || '',
    subjectsOfInterest: session.user.user_metadata?.subjects_of_interest || [],
    createdAt: session.user.created_at || '',
    updatedAt: session.user.updated_at || '',
  };
}

// Load full user profile from database
async function loadUserProfile(userId: string): Promise<User | null> {
  try {
    const { data: profile, error } = await DatabaseService.getProfile(userId);

    // Get basic auth info first
    const { session } = await AuthService.getCurrentSession();
    const baseUser = sessionToUser(session);

    if (!baseUser) return null;

    if (error || !profile) {
      console.log('No profile found or error loading profile:', error?.message);
      // Return base user if profile doesn't exist yet
      return baseUser;
    }

    // Merge profile data with auth data, prioritizing database values
    return {
      ...baseUser,
      username: profile.username || baseUser.username,
      fullName: profile.full_name || baseUser.fullName,
      avatarUrl: profile.avatar_url || baseUser.avatarUrl,
      school: profile.school || baseUser.school,
      gradeLevel: profile.grade_level || baseUser.gradeLevel,
      subjectsOfInterest: profile.subjects_of_interest || baseUser.subjectsOfInterest,
    };
  } catch (error) {
    console.error('Error loading user profile:', error);
    // Return basic user info if there's an error
    const { session } = await AuthService.getCurrentSession();
    return sessionToUser(session);
  }
}

// Auth Provider Component
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { session, error } = await AuthService.getCurrentSession();

        if (mounted) {
          if (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
          } else if (session?.user) {
            // Load full profile on initialization
            const fullUser = await loadUserProfile(session.user.id);
            const user = fullUser || sessionToUser(session);
            dispatch({ type: 'SET_USER', payload: user });
          } else {
            dispatch({ type: 'SET_USER', payload: null });
          }
        }
      } catch (error) {
        if (mounted) {
          dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize authentication' });
        }
      }
    }

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = AuthService.onAuthStateChange(async (event, session) => {
      if (mounted) {
        console.log('Auth state changed:', event, session?.user?.user_metadata?.username || 'user');

        try {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (session?.user) {
              // Always try to load full profile from database first
              const fullUser = await loadUserProfile(session.user.id);
              if (fullUser) {
                console.log('Setting full user profile:', fullUser.username || fullUser.fullName || 'user');
                dispatch({ type: 'SET_USER', payload: fullUser });
              } else {
                // Fallback to basic user info if profile not found
                const basicUser = sessionToUser(session);
                console.log('Setting basic user info:', basicUser?.username || basicUser?.fullName || 'user');
                dispatch({ type: 'SET_USER', payload: basicUser });
              }
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('User signed out, clearing state');
            dispatch({ type: 'SIGN_OUT' });
          }
        } catch (error) {
          console.error('Error processing auth state change:', error);
          dispatch({ type: 'SET_ERROR', payload: 'Authentication error occurred' });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign In
  const signIn = async (credentials: LoginCredentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const { data, error } = await AuthService.signIn(credentials);

      if (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        return { success: false, error: error.message };
      }

      if (data?.user) {
        // Load full profile after successful sign in
        const fullUser = await loadUserProfile(data.user.id);
        const user = fullUser || sessionToUser(data.session);
        dispatch({ type: 'SET_USER', payload: user });
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Sign Up
  const signUp = async (credentials: RegisterCredentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const { data, error } = await AuthService.signUp(credentials);

      if (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        return { success: false, error: error.message };
      }

      if (data?.user) {
        // Note: User might need to verify email before being fully authenticated
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: true };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      const { error } = await AuthService.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      // Always clear local state regardless of API response
      dispatch({ type: 'SIGN_OUT' });
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, we should clear the local state
      dispatch({ type: 'SIGN_OUT' });
    }
  };

  // Reset Password
  const resetPassword = async (email: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const { error } = await AuthService.resetPassword(email);

      dispatch({ type: 'SET_LOADING', payload: false });

      if (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Refresh User - force a refresh of the current user state
  const refreshUser = async () => {
    try {
      const { session, error } = await AuthService.getCurrentSession();

      if (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } else if (session?.user) {
        // Try to load full profile, fallback to basic user info
        const fullUser = await loadUserProfile(session.user.id);
        const user = fullUser || sessionToUser(session);
        dispatch({ type: 'SET_USER', payload: user });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh user data' });
    }
  };

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}