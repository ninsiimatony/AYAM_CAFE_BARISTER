'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Profile, UserRole } from '@/lib/types'

const DEMO_USER = {
  id: 'demo-user-id',
  email: 'demo@ayamcafe.com',
  email_confirmed_at: new Date().toISOString(),
} as unknown as User

const DEMO_PROFILE: Profile = {
  id: 'demo-user-id',
  email: 'demo@ayamcafe.com',
  full_name: 'Demo Admin',
  avatar_url: null,
  role: 'admin' as UserRole,
  subscription_tier: 'elite',
  stripe_customer_id: null,
  telegram_user_id: null,
  timezone: 'UTC',
  preferred_pairs: [],
  risk_per_trade_pct: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string' &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  role: UserRole | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(isSupabaseConfigured ? null : DEMO_USER)
  const [profile, setProfile] = useState<Profile | null>(isSupabaseConfigured ? null : DEMO_PROFILE)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const supabase = createClient()

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      setProfile(data as Profile)
    }
    setLoading(false)
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user && isSupabaseConfigured) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  useEffect(() => {
    if (!isSupabaseConfigured) return

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        fetchProfile(user.id)
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        await fetchProfile(currentUser.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile, supabase.auth])

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut()
    }
    setUser(isSupabaseConfigured ? null : DEMO_USER)
    setProfile(isSupabaseConfigured ? null : DEMO_PROFILE)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role ?? null,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
