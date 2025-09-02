
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
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
      redirectTo: `${window.location.origin}/auth?mode=reset`
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
        redirectTo: `${window.location.origin}/auth?mode=signup&step=3&oauth=true`
      }
    })
    return { data, error }
  }

  const checkEmailExists = async (email: string) => {
    try {
      // Use Supabase's signUp with a temporary password to check if email exists
      // If email exists, Supabase will return a specific error
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'temp-check-password-123',
        options: {
          data: { temp_check: true }
        }
      })
      
      if (error) {
        // Check for specific error messages that indicate email already exists
        if (error.message.includes('User already registered') || 
            error.message.includes('already been registered') ||
            error.message.includes('email address is already registered')) {
          return { exists: true, error: null }
        }
        // For other errors, assume email doesn't exist
        return { exists: false, error: null }
      }
      
      // If no error but we got a user back, email might be available
      // We should clean up this temporary signup attempt
      if (data.user && !data.user.email_confirmed_at) {
        // The signup was successful but not confirmed, so email is available
        return { exists: false, error: null }
      }
      
      return { exists: false, error: null }
    } catch (error) {
      return { exists: false, error: error as AuthError }
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
