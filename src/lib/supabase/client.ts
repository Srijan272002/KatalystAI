import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { config } from '../config'

const supabaseUrl = config.supabase.url
const supabaseAnonKey = config.supabase.anonKey

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client-side client (for client components)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Server-side client for API routes and Server Components
export const createServerSupabaseClient = async () => {
  // Dynamic import to avoid server-side dependencies in client components
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

// Service role client for admin operations
export const createServiceSupabaseClient = () => {
  const serviceRoleKey = config.supabase.serviceRoleKey
  
  if (!serviceRoleKey) {
    throw new Error('Missing Supabase service role key')
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
