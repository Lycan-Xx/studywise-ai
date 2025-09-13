
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useResultsStore } from '@/stores/useResultsStore'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, metadata?: any) => Promise<{ data: any; error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ data: any; error: AuthError | null }>
  updatePassword: (password: string) => Promise<{ data: any; error: AuthError | null }>
  signInWithGoogle: () => Promise<{ data: any; error: AuthError | null }>
  checkEmailExists: (email: string) => Promise<{ exists: boolean; error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const previousUserId = useRef<string | null>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: Session | null) => {
      const newUser = session?.user ?? null
      const newUserId = newUser?.id ?? null

      // Clear caches when user logs out or switches accounts
      if (previousUserId.current !== newUserId) {
        if (previousUserId.current !== null || newUserId !== null) {
          // Clear localStorage for persisted stores
          localStorage.removeItem('results-store')
          localStorage.removeItem('studywise-test')
          console.log('Cleared user-specific caches on auth change')
        }
        previousUserId.current = newUserId
      }

      setSession(session)
      setUser(newUser)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset&type=recovery`
    })
    return { data, error }
  }

  const updatePassword = async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password
    })
    return { data, error }
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth?mode=signup&step=3&oauth=true`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    return { data, error }
  }

  const checkEmailExists = async (email: string) => {
    try {
      // Option 1: Try to sign in with a dummy password
      // If the user exists, we'll get an invalid password error
      // If they don't exist, we'll get a different error
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: 'dummy-check-password-that-will-never-work-123!@#'
      });

      if (error) {
        // Check the error message to determine if user exists
        if (error.message.includes('Invalid login credentials')) {
          // User exists but wrong password
          return { exists: true, error: null };
        }
        // User doesn't exist or other error
        return { exists: false, error: null };
      }

      // Should never reach here
      return { exists: false, error: null };
    } catch (error) {
      return { exists: false, error: error as AuthError };
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    signInWithGoogle,
    checkEmailExists
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
