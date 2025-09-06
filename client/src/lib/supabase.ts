
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Environment variables check:');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Not found');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Found' : 'Not found');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Available env vars:', Object.keys(import.meta.env));
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
