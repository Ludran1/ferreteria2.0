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
          // Set timeout to proactively REFRESH the session 5 minutes before it expires
          // 5 mins = 300000 ms. If the token lives less than 5 mins total, just refresh halfway through.
          const refreshBuffer = timeUntilExpiry > 300000 ? 300000 : Math.floor(timeUntilExpiry / 2);
          const timeUntilRefresh = timeUntilExpiry - refreshBuffer;

          checkSessionTimeout = setTimeout(async () => {
             console.log("Proactively refreshing Supabase session...");
             // This call to getSession() actually forces the supabase client to refresh the token 
             // in the background if it determines it's close to expiry, extending the life.
             const { data: { session: freshSession }, error } = await supabase.auth.getSession();
             
             if (error || !freshSession) {
                 console.error("Failed to automatically refresh session, logging out.", error);
                 await supabase.auth.signOut();
             } else if (freshSession.expires_at === currSession.expires_at) {
                 // If the expiration time didn't change at all, the refresh might have failed silently
                 // Check if we are really expired right now
                 if ((freshSession.expires_at * 1000) <= Date.now()) {
                    await supabase.auth.signOut();
                 }
             }
          }, timeUntilRefresh);
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
