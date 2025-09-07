
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Environment variables check:');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Not found');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Found' : 'Not found');

let supabase: any

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing environment variables. Using mock client. Authentication is disabled in this mode.')

  const mockAuth = {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: async () => ({ data: null, error: { message: 'Auth disabled' } }),
    signInWithPassword: async () => ({ data: null, error: { message: 'Auth disabled' } }),
    signOut: async () => ({ error: null }),
    resetPasswordForEmail: async () => ({ data: null, error: { message: 'Auth disabled' } }),
    updateUser: async () => ({ data: null, error: { message: 'Auth disabled' } }),
    signInWithOAuth: async () => ({ data: null, error: { message: 'Auth disabled' } }),
    setSession: async () => ({ data: null, error: { message: 'Auth disabled' } })
  }

  const mockFrom = (_table?: string) => ({
    select: (_cols?: string) => ({
      eq: (_col: string, _val: any) => ({
        single: async () => ({ data: null, error: null })
      })
    }),
    upsert: async (_payload: any) => ({ data: null, error: null })
  })

  supabase = {
    auth: mockAuth,
    from: mockFrom
  }
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
}

export { supabase }
