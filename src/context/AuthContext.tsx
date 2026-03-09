import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  hasPermission: (section: string) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let checkSessionTimeout: NodeJS.Timeout;

    const setupSessionCheck = (currSession: Session | null) => {
      if (currSession?.expires_at) {
        // Calculate milliseconds until expiration
        const expiresAtMs = currSession.expires_at * 1000;
        const timeUntilExpiry = expiresAtMs - Date.now();
        
        // Clear any existing timeout
        if (checkSessionTimeout) clearTimeout(checkSessionTimeout);

        if (timeUntilExpiry > 0) {
          // Set timeout to check the session exactly when it expires
          checkSessionTimeout = setTimeout(async () => {
             const { data: { session: freshSession } } = await supabase.auth.getSession();
             // If no fresh session, or the expiration hasn't updated, sign out
             if (!freshSession || freshSession.expires_at === currSession.expires_at) {
                await supabase.auth.signOut();
             }
          }, timeUntilExpiry + 1000); // 1 second buffer
        } else {
          // Already expired
          supabase.auth.signOut();
        }
      } else {
         if (checkSessionTimeout) clearTimeout(checkSessionTimeout);
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setupSessionCheck(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
      setupSessionCheck(currentSession);
      
      // Explicitly handle token refresh failures if they emit SIGNED_OUT
      if (_event === 'SIGNED_OUT') {
         setSession(null);
         setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (checkSessionTimeout) clearTimeout(checkSessionTimeout);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasPermission = (section: string) => {
    if (!user) return false;
    
    const metadata = user.user_metadata || {};
    // Admin has access to everything
    // We assume the first user or explicitly set admins have 'admin' role
    // For now, if no role is set, we might assume full access or restricted.
    // Let's assume if role is 'admin' OR if it's the specific admin email (optional check)
    if (metadata.role === 'admin') return true;

    // Check allowedSections
    const allowed = metadata.allowedSections as string[] | undefined;
    if (Array.isArray(allowed) && allowed.includes(section)) {
      return true;
    }

    return false;
  };

  const isAdmin = user?.user_metadata?.role === 'admin';

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut, hasPermission, isAdmin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
