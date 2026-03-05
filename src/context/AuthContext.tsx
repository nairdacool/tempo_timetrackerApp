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

  async function loadProfile(userId: string, metaOrg?: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) return null;

    // user_metadata.organization is the authoritative source — it's what the
    // user typed at signup. The DB trigger ignores it and hardcodes a dummy
    // value, so we always sync it back on load.
    const orgToUse = metaOrg || data.organization || 'Tempo'

    if (metaOrg && data.organization !== metaOrg) {
      // Persist the correct org name to the profiles row
      await supabase
        .from('profiles')
        .update({ organization: metaOrg })
        .eq('id', userId)
    }

    // Auto-create the Organization record for this admin if they don't have one yet
    if (data.role === 'Admin' && metaOrg) {
      const { count } = await supabase
        .from('organizations')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', userId)
      if ((count ?? 0) === 0) {
        await supabase
          .from('organizations')
          .insert({ name: metaOrg, created_by: userId })
      }
    }

    return {
      id:           data.id,
      fullName:     data.full_name,
      initials:     data.initials,
      role:         data.role,
      color:        data.color,
      organization: orgToUse,
    } as UserProfile;
  }

  // Auth state listener — loading resolves as soon as session status is known.
  // Profile fetch and is_active check happen in the background so a slow/offline
  // Supabase response can never keep the app stuck on the loading screen.
  useEffect(() => {
    let mounted = true;
    let resolved = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        resolved = true;

        if (!session) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        // Set user/session immediately — loading resolves right away
        setSession(session);
        setUser(session.user);
        setLoading(false);

        // Background: fetch full profile and enforce is_active
        setTimeout(async () => {
          if (!mounted) return;

          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!mounted) return;

          if (profileData && !profileData.is_active) {
            await supabase.auth.signOut();
            localStorage.setItem('auth_error', 'Your account has been deactivated. Please contact your administrator.');
            return;
          }

          const p = await loadProfile(session.user.id, session.user.user_metadata?.organization);
          if (mounted) setProfile(p);
        }, 0);
      }
    );

    // Safety net: if onAuthStateChange never fires within 3s (edge-case),
    // use getSession() to resolve loading.
    const timer = setTimeout(async () => {
      if (!mounted || resolved) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted || resolved) return;
      if (!session) {
        setLoading(false);
      }
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timer);
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