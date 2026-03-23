import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, storeName: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 AUTH INIT: Starting auth initialization');
    let mounted = true;
    let sessionLoaded = false;

    // ✅ STEP 1: Load initial session FIRST
    const loadInitialSession = async () => {
      try {
        console.log('🔐 SESSION LOAD: Fetching initial session');
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('🔐 SESSION LOAD: Error', error);
        } else {
          console.log('🔐 SESSION LOADED:', { 
            hasSession: !!data.session, 
            userId: data.session?.user?.id 
          });

          // ✅ ONLY set state if session was actually loaded
          if (!sessionLoaded) {
            sessionLoaded = true;
            setSession(data.session);
            setUser(data.session?.user ?? null);
            setIsAuthLoading(false);
            setIsLoading(false);
            console.log('🔐 AUTH READY: Initial session loaded successfully');
          }
        }
      } catch (err) {
        console.error('🔐 SESSION LOAD: Unexpected error', err);
        if (mounted && !sessionLoaded) {
          sessionLoaded = true;
          setIsAuthLoading(false);
          setIsLoading(false);
        }
      }
    };

    // ✅ STEP 2: Set up auth state listener AFTER initial load
    const setupAuthListener = () => {
      console.log('🔐 LISTENER SETUP: Setting up auth state listener');
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log('🔐 AUTH STATE CHANGE:', { 
            event, 
            hasSession: !!session, 
            userId: session?.user?.id 
          });

          // ✅ Prevent duplicate state setting during initial load
          if (!sessionLoaded) {
            console.log('🔐 AUTH STATE CHANGE: Ignoring - initial load not complete');
            return;
          }

          // ✅ Update state only after initial load is complete
          setSession(session);
          setUser(session?.user ?? null);
          setIsAuthLoading(false);
          setIsLoading(false);

          console.log('🔐 AUTH STATE CHANGE: State updated', { 
            event, 
            userId: session?.user?.id 
          });
        }
      );

      return subscription;
    };

    // ✅ Execute in proper order
    loadInitialSession();
    const subscription = setupAuthListener();

    // ✅ Cleanup
    return () => {
      console.log('🔐 CLEANUP: Unsubscribing from auth changes');
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Email atau password salah' };
      }
      if (error.message.includes('Email not confirmed')) {
        return { error: 'Email belum dikonfirmasi. Silakan cek inbox email Anda.' };
      }
      return { error: error.message };
    }

    return { error: null };
  };

  const signup = async (email: string, password: string, storeName: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          store_name: storeName,
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return { error: 'Email sudah terdaftar' };
      }
      return { error: error.message };
    }

    return { error: null };
  };

  const logout = async () => {
    console.log('🔐 LOGOUT: Signing out user');
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      isAuthenticated: !!session, 
      isLoading,
      isAuthLoading,
      login, 
      signup,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
