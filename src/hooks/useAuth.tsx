// hooks/useAuth.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: string | null; // <- normalized, lowercase: public | judge | attorney | clerk | admin
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null); // <- new
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setSessionWithRole = (sess: Session | null, resolvedRole?: string | null) => {
      // Keep a local mirror of session with role in app_metadata for convenience in UI
      if (sess?.user) {
        const lr = (resolvedRole ??
          (sess.user.app_metadata?.role ? String(sess.user.app_metadata.role).toLowerCase() : null)) || null;

        const updatedSession: Session = {
          ...sess,
          user: {
            ...sess.user,
            app_metadata: {
              ...sess.user.app_metadata,
              role: lr ?? undefined,
            },
          },
        } as Session;

        setSession(updatedSession);
        setUser(updatedSession.user);
        setRole(lr);
      } else {
        setSession(sess);
        setUser(sess?.user ?? null);
        setRole(null);
      }
    };

    const fetchUserRole = async (sess: Session) => {
      try {
        // DB is source of truth
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('auth_user_id', sess.user.id)
          .single();

        // If not found (.single() no rows = PGRST116) or other error, we still resolve session
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user role:', error);
        }

        const dbRole = userData?.role ? String(userData.role).toLowerCase() : null;
        const metaRole = sess.user.app_metadata?.role ? String(sess.user.app_metadata.role).toLowerCase() : null;
        const resolvedRole = dbRole ?? metaRole ?? 'public'; // default to public if unknown

        setSessionWithRole(sess, resolvedRole);
      } catch (e) {
        console.error('Error fetching user role:', e);
        // Fallback to whatever is in app_metadata, else public
        const fallbackRole = sess.user.app_metadata?.role
          ? String(sess.user.app_metadata.role).toLowerCase()
          : 'public';
        setSessionWithRole(sess, fallbackRole);
      }
    };

    let initialized = false;

    // 1) Listen to auth changes first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, sess) => {
        try {
          if (sess?.user) {
            await fetchUserRole(sess);
          } else {
            setSessionWithRole(sess ?? null);
          }
        } catch (e) {
          console.error('Auth state change error:', e);
          setSessionWithRole(sess ?? null);
        } finally {
          // Ensure loading is cleared
          setLoading(false);
        }
      }
    );

    // 2) Load existing session once on mount
    supabase.auth.getSession().then(async ({ data: { session: sess }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }

      try {
        if (sess?.user) {
          await fetchUserRole(sess);
        } else {
          setSessionWithRole(sess ?? null);
        }
      } catch (e) {
        console.error('Session initialization error:', e);
        setSessionWithRole(sess ?? null);
      } finally {
        if (!initialized) {
          setLoading(false);
          initialized = true;
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, username: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { username },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthContextType = {
    user,
    session,
    role,        // <- consumers can just read useAuth().role
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
