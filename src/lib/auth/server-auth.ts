import type { User } from '@supabase/supabase-js'

/**
 * Get current user - server-side
 */
export async function getCurrentUserSimple(): Promise<User | null> {
  try {
    console.log('🔍 Server-side auth: Getting current user...')
    const { createServerSupabaseClient } = await import('@/lib/supabase/client')
    const supabaseClient = await createServerSupabaseClient()
    
    const { data: { user }, error } = await supabaseClient.auth.getUser()
    
    if (error) {
      console.error('🔍 Server-side auth error:', error)
      return null
    }
    
    console.log('🔍 Server-side auth: User found:', user?.email || 'No user')
    return user
  } catch (error) {
    console.error('🔍 Server-side auth exception:', error)
    return null
  }
}

/**
 * Check if user is authenticated - server-side
 */
export async function isAuthenticatedSimple(): Promise<boolean> {
  try {
    const user = await getCurrentUserSimple()
    return !!user
  } catch (error) {
    console.error('Error checking authentication:', error)
    return false
  }
}
