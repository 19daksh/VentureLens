import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, localDb } from '../lib/supabase';
import { AuthUser, UserProfile } from '../types/auth';

export const isUuid = (val?: string): boolean =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val));

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfiguredWithSupabase: boolean;
  signUp: (email: string, password: string, fullName: string, organization?: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    async function initAuth() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const authUser: AuthUser = {
              id: session.user.id,
              email: session.user.email || '',
              user_metadata: session.user.user_metadata,
            };
            setUser(authUser);
            await fetchOrCreateProfile(session.user.id, session.user.email || '', session.user.user_metadata?.full_name);
          } else {
            // Check if there is a stored local or demo session
            const stored = localStorage.getItem('venturelens_auth_user');
            if (stored) {
              try {
                const u: AuthUser = JSON.parse(stored);
                setUser(u);
                await fetchOrCreateProfile(u.id, u.email, u.user_metadata?.full_name);
              } catch (err) {
                console.error('Error parsing stored session:', err);
              }
            }
          }

          // Listen for auth changes
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
              const u: AuthUser = {
                id: session.user.id,
                email: session.user.email || '',
                user_metadata: session.user.user_metadata,
              };
              setUser(u);
              localStorage.setItem('venturelens_auth_user', JSON.stringify(u));
              await fetchOrCreateProfile(u.id, u.email, u.user_metadata?.full_name);
            } else if (event === 'SIGNED_OUT') {
              localStorage.removeItem('venturelens_auth_user');
              setUser(null);
              setProfile(null);
            }
          });

          setLoading(false);
          return () => {
            authListener.subscription.unsubscribe();
          };
        } else {
          // Local fallback auth storage
          const storedUser = localStorage.getItem('venturelens_auth_user');
          if (storedUser) {
            try {
              const u: AuthUser = JSON.parse(storedUser);
              setUser(u);
              await fetchOrCreateProfile(u.id, u.email, u.user_metadata?.full_name);
            } catch (err) {
              console.error('Error restoring local user:', err);
            }
          }
          setLoading(false);
        }
      } catch (e) {
        console.error('Auth initialization error:', e);
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  async function fetchOrCreateProfile(userId: string, email: string, fullName?: string) {
    if (isSupabaseConfigured && supabase && isUuid(userId)) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (data && !error) {
          setProfile(data as UserProfile);
          return;
        } else {
          // Create profile record in Supabase
          const newProfile: UserProfile = {
            id: userId,
            email,
            full_name: fullName || 'Founder',
            organization: 'Early Stage Venture',
            role: 'Founder',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          const { error: upsertErr } = await supabase.from('profiles').upsert(newProfile);
          if (!upsertErr) {
            setProfile(newProfile);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not query Supabase profile table directly, using local fallback:', err);
      }
    }

    // Local profile fallback
    let p = localDb.getProfile(userId);
    if (!p) {
      p = {
        id: userId,
        email,
        full_name: fullName || 'Founder',
        organization: 'Early Stage Venture',
        role: 'Founder',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localDb.saveProfile(p);
    }
    setProfile(p);
  }

  // Sign up
  const signUp = async (email: string, password: string, fullName: string, organization?: string) => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              organization: organization || 'Stealth Startup',
            },
          },
        });

        if (error) {
          if (error.message.includes('rate limit') || error.message.includes('rate_limit')) {
            return {
              error: 'Supabase email rate limit exceeded (free tier built-in SMTP). To enable instant unlimited signups, open your Supabase Dashboard -> Authentication -> Providers -> Email, and toggle OFF "Confirm email". In the meantime, you can log in using "Try Demo Account" on the login page.',
            };
          }
          return { error: error.message };
        }

        if (data.user) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || email,
            user_metadata: { full_name: fullName, organization },
          };
          setUser(authUser);
          localStorage.setItem('venturelens_auth_user', JSON.stringify(authUser));
          await fetchOrCreateProfile(data.user.id, email, fullName);
        }
        return {};
      } else {
        // Local account creation
        const newId = crypto.randomUUID();
        const authUser: AuthUser = {
          id: newId,
          email,
          user_metadata: {
            full_name: fullName,
            organization: organization || 'Stealth Startup',
          },
        };
        const newProfile: UserProfile = {
          id: newId,
          email,
          full_name: fullName,
          organization: organization || 'Stealth Startup',
          role: 'Founder',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        localStorage.setItem('venturelens_auth_user', JSON.stringify(authUser));
        localDb.saveProfile(newProfile);
        setUser(authUser);
        setProfile(newProfile);
        return {};
      }
    } catch (err: any) {
      return { error: err?.message || 'Failed to sign up.' };
    }
  };

  // Sign in
  const signIn = async (email: string, password: string) => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!error && data.user) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || email,
            user_metadata: data.user.user_metadata,
          };
          setUser(authUser);
          localStorage.setItem('venturelens_auth_user', JSON.stringify(authUser));
          await fetchOrCreateProfile(data.user.id, email, data.user.user_metadata?.full_name);
          return {};
        }

        // Demo account fallback if not provisioned in Supabase auth yet
        if (email === 'founder@venturelens.ai') {
          const demoUser: AuthUser = {
            id: '00000000-0000-4000-8000-000000000001',
            email: 'founder@venturelens.ai',
            user_metadata: { full_name: 'Demo Founder', organization: 'Stealth Ventures' },
          };
          setUser(demoUser);
          localStorage.setItem('venturelens_auth_user', JSON.stringify(demoUser));
          await fetchOrCreateProfile(demoUser.id, demoUser.email, 'Demo Founder');
          return {};
        }

        if (error) return { error: error.message };
        return {};
      } else {
        // Local sign in
        const existing = localStorage.getItem('venturelens_auth_user');
        let authUser: AuthUser;

        if (existing) {
          const parsed = JSON.parse(existing);
          authUser = {
            id: parsed.id || crypto.randomUUID(),
            email: email,
            user_metadata: parsed.user_metadata || { full_name: 'Founder' },
          };
        } else {
          authUser = {
            id: crypto.randomUUID(),
            email: email,
            user_metadata: { full_name: email.split('@')[0] || 'Venture Founder' },
          };
        }

        localStorage.setItem('venturelens_auth_user', JSON.stringify(authUser));
        setUser(authUser);
        await fetchOrCreateProfile(authUser.id, authUser.email, authUser.user_metadata?.full_name);
        return {};
      }
    } catch (err: any) {
      return { error: err?.message || 'Failed to sign in.' };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error('Sign out error:', e);
    } finally {
      localStorage.removeItem('venturelens_auth_user');
      setUser(null);
      setProfile(null);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/settings',
        });
        if (error) return { error: error.message };
        return {};
      } else {
        // Simulated reset
        return {};
      }
    } catch (err: any) {
      return { error: err?.message || 'Failed to request password reset.' };
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const updated: UserProfile = {
        ...(profile || {
          id: user.id,
          email: user.email,
          full_name: 'Founder',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
        ...updates,
        updated_at: new Date().toISOString(),
      };

      if (isSupabaseConfigured && supabase && isUuid(user.id)) {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);
        if (error) {
          console.warn('Supabase profile update warning:', error);
        }
      }

      localDb.saveProfile(updated);
      setProfile(updated);
      return {};
    } catch (err: any) {
      return { error: err?.message || 'Failed to update profile.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isConfiguredWithSupabase: isSupabaseConfigured,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
