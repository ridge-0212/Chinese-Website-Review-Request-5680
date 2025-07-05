import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vwtrirtzvpthqdjdeuiz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3dHJpcnR6dnB0aHFkamRldWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDYxNTUsImV4cCI6MjA2NzIyMjE1NX0.XfFL9N6yC9YJXM6oK9hDAiFpbpcefqkVZMurmDSZjx0'

if (SUPABASE_URL == 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY == '<ANON_KEY>') {
  throw new Error('Missing Supabase variables')
}

console.log('Supabase: Initializing client...')

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
})

console.log('Supabase: Client initialized successfully')

export default supabase