import { supabase } from './client'
import { logger } from '../utils/logger'
import { AuthChangeEvent, Session } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  name?: string
  image?: string
}

export interface AuthSession {
  user: AuthUser
  accessToken: string
  expiresAt: number
}

// Client-side functions (can be used in client components)
/**
 * Sign in with Google OAuth (client-side)
 */
export async function signInWithGoogle(redirectTo?: string): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || `${window.location.origin}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        scopes: 'openid email profile https://www.googleapis.com/auth/calendar.readonly'
      }
    })
    
    if (error) {
      logger.error('Google sign in failed', error)
      return { error: error.message }
    }
    
    return {}
  } catch (error) {
    logger.error('Error during Google sign in', error as Error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Sign out the current user (client-side)
 */
export async function signOut(): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      logger.error('Sign out failed', error)
      return { error: error.message }
    }
    
    return {}
  } catch (error) {
    logger.error('Error during sign out', error as Error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Refresh the current session (client-side)
 */
export async function refreshSession(): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.refreshSession()
    
    if (error) {
      logger.error('Session refresh failed', error)
      return { error: error.message }
    }
    
    return {}
  } catch (error) {
    logger.error('Error refreshing session', error as Error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Listen to auth state changes (client-side)
 */
export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

// Server-side functions (for API routes and Server Components)
/**
 * Get the current authenticated user (server-side)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { createServerSupabaseClient } = await import('./client')
    const supabaseClient = await createServerSupabaseClient()
    
    // First try to get the session
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()
    
    if (sessionError) {
      logger.error('Failed to get session', sessionError)
      return null
    }
    
    if (!session) {
      logger.debug('No active session found')
      return null
    }
    
    // Check if session is expired
    const now = Math.floor(Date.now() / 1000)
    if (session.expires_at && session.expires_at < now) {
      logger.warn('Session expired', { userId: session.user?.id })
      return null
    }
    
    // Get user from session
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError) {
      logger.error('Failed to get current user', userError)
      return null
    }
    
    if (!user) {
      logger.debug('No user found in session')
      return null
    }
    
    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name || user.user_metadata?.name,
      image: user.user_metadata?.avatar_url || user.user_metadata?.picture
    }
  } catch (error) {
    logger.error('Error getting current user', error as Error)
    return null
  }
}

/**
 * Get the current session with access token (server-side)
 */
export async function getCurrentSession(): Promise<AuthSession | null> {
  try {
    const { createServerSupabaseClient } = await import('./client')
    const supabaseClient = await createServerSupabaseClient()
    const { data: { session }, error } = await supabaseClient.auth.getSession()
    
    if (error) {
      logger.error('Failed to get current session', error)
      return null
    }
    
    if (!session?.user) {
      return null
    }
    
    return {
      user: {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
        image: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture
      },
      accessToken: session.access_token,
      expiresAt: session.expires_at!
    }
  } catch (error) {
    logger.error('Error getting current session', error as Error)
    return null
  }
}

/**
 * Check if the current session is valid (server-side)
 */
export async function isSessionValid(): Promise<boolean> {
  try {
    const { createServerSupabaseClient } = await import('./client')
    const supabaseClient = await createServerSupabaseClient()
    const { data: { session }, error } = await supabaseClient.auth.getSession()
    
    if (error || !session) {
      return false
    }
    
    // Check if session is expired
    const now = Math.floor(Date.now() / 1000)
    return session.expires_at! > now
  } catch (error) {
    logger.error('Error checking session validity', error as Error)
    return false
  }
}

/**
 * Get user's Google access token from Supabase (server-side)
 */
export async function getGoogleAccessToken(): Promise<string | null> {
  try {
    const { createServerSupabaseClient } = await import('./client')
    const supabaseClient = await createServerSupabaseClient()
    const { data: { session }, error } = await supabaseClient.auth.getSession()
    
    if (error || !session) {
      return null
    }
    
    // The provider token is available in the session
    return session.provider_token || null
  } catch (error) {
    logger.error('Error getting Google access token', error as Error)
    return null
  }
}
