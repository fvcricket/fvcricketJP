import type { User, Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type UserRole = 'user' | 'admin' | 'superadmin'

interface AuthContextType {
  user: User | null
  session: Session | null
  role: UserRole
  isAdmin: boolean
  isSuperAdmin: boolean
  signUp: (email: string, password: string) => Promise<{ requiresEmailConfirmation: boolean }>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRole>('user')
  const [loading, setLoading] = useState(true)

  const fetchProfileRole = async (userId: string | null) => {
    if (!userId) {
      setRole('user')
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      setRole('user')
      return
    }

    const loadedRole = (data?.role as UserRole | undefined) ?? 'user'
    setRole(loadedRole)
  }

  useEffect(() => {
    // Safety: ensure loading is cleared even if auth or profile fetch hangs.
    const timeout = setTimeout(() => setLoading(false), 4000)

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      await fetchProfileRole(session?.user?.id ?? null)
      clearTimeout(timeout)
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        await fetchProfileRole(session?.user?.id ?? null)
        setLoading(false)
      })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    // Supabase returns a null session when email confirmation is required.
    return { requiresEmailConfirmation: !data.session }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    setLoading(true)

    const timeoutMs = 5000
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Sign out timed out')), timeoutMs)
    })

    try {
      const result = await Promise.race([
        supabase.auth.signOut(),
        timeoutPromise
      ])

      if ('error' in result && result.error) {
        throw result.error
      }
    } finally {
      // Always clear local state/storage so UI cannot remain signed in.
      setSession(null)
      setUser(null)
      setRole('user')
      ;[localStorage, sessionStorage].forEach((store) => {
        Object.keys(store).forEach((key) => {
          if (key.startsWith('sb-')) store.removeItem(key)
        })
      })
      setLoading(false)
    }
  }

  const value = {
    user,
    session,
    role,
    isAdmin: role === 'admin' || role === 'superadmin',
    isSuperAdmin: role === 'superadmin',
    signUp,
    signIn,
    signOut,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}