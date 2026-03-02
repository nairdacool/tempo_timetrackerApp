import { useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { AuthContext } from "./AuthContextInstance";

export interface UserProfile {
  id: string;
  fullName: string;
  initials: string;
  role: string;
  color: string;
  organization: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) return null;

    return {
      id:           data.id,
      fullName:     data.full_name,
      initials:     data.initials,
      role:         data.role,
      color:        data.color,
      organization: data.organization,
    } as UserProfile;
  }

  // Auth state listener
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (!session) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session.user);

        setTimeout(async () => {
          if (!mounted) return;
          const p = await loadProfile(session.user.id);
          if (mounted) {
            setProfile(p);
            setLoading(false);
          }
        }, 0);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Ping last_seen every 2 minutes while logged in  ← top level, separate useEffect
  useEffect(() => {
    if (!user) return;

    async function ping() {
      await supabase
        .from("profiles")
        .update({ last_seen: new Date().toISOString() })
        .eq("id", user!.id);
    }

    ping(); // immediate ping on login
    const interval = setInterval(ping, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  const isAdmin = profile?.role === "Admin";

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}