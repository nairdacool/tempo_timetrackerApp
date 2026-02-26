import { useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthContext } from './AuthContextInstance'

export interface UserProfile {
  id: string
  fullName: string
  initials: string
  role: string
  color: string
  organization: string
}

export interface AuthContextType {
  user:    User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
}


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) return null

    return {
      id:           data.id,
      fullName:     data.full_name,
      initials:     data.initials,
      role:         data.role,
      color:        data.color,
      organization: data.organization,
    } as UserProfile
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        try {
          const p = await loadProfile(session.user.id)
          setProfile(p)
        } catch (e) {
          console.error('Profile load failed:', e)
        }
      }
      setLoading(false) // ← always runs now
    })

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        try {
          const p = await loadProfile(session.user.id)
          setProfile(p)
        } catch (e) {
          console.error('Profile load failed:', e)
        }
      } else {
        setProfile(null)
      }
      setLoading(false) // ← always runs now
    }
  )

  return () => subscription.unsubscribe()
}, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  const isAdmin = profile?.role === 'Admin'

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}