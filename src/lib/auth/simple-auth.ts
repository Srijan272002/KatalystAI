"use client"

import { createBrowserClient } from '@supabase/ssr'
import type { User, Session } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { useState, useEffect } from 'react'

// Create a browser client that sets cookies for server-side access
const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface SimpleAuthState {
  user: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
}

/**
 * Simple authentication hook - direct Supabase usage
 */
export function useSimpleAuth() {
  const [state, setState] = useState<SimpleAuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false
  })

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Initial session:', session?.user?.email || 'No session')
        setState({
          user: session?.user || null,
          session,
          loading: false,
          isAuthenticated: !!session?.user
        })
      } catch (error) {
        console.error('Error getting initial session:', error)
        setState(prev => ({ ...prev, loading: false }))
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email || 'No user')
      setState({
        user: session?.user || null,
        session,
        loading: false,
        isAuthenticated: !!session?.user
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  return state
}

/**
 * Sign in with Google - simple implementation
 */
export async function signInWithGoogleSimple(): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        scopes: 'openid email profile https://www.googleapis.com/auth/calendar.readonly'
      }
    })
    
    if (error) {
      console.error('Google sign in failed:', error)
      return { error: error.message }
    }
    
    return {}
  } catch (error) {
    console.error('Error during Google sign in:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Handle OAuth callback and session exchange
 */
export async function handleOAuthCallback(): Promise<{ error?: string }> {
  try {
    console.log('🔍 Starting OAuth callback session exchange...')
    
    // Get the current URL to extract the code
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')
    
    if (error) {
      console.error('OAuth error in callback:', error)
      return { error: `OAuth error: ${error}` }
    }
    
    if (!code) {
      console.log('No OAuth code found in URL')
      return { error: 'No OAuth code found' }
    }
    
    console.log('🔍 Exchanging OAuth code for session...')
    
    // Exchange the code for a session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('OAuth code exchange failed:', exchangeError)
      return { error: exchangeError.message }
    }
    
    if (data.session) {
      console.log('🔍 OAuth callback successful, session established:', data.session.user.email)
      
      // Clean up the URL by removing the code parameter
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('code')
      newUrl.searchParams.delete('error')
      window.history.replaceState({}, '', newUrl.toString())
      
      return {}
    } else {
      console.log('OAuth callback: No session established after code exchange')
      return { error: 'No session established after code exchange' }
    }
  } catch (error) {
    console.error('Error handling OAuth callback:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Sign out - simple implementation
 */
export async function signOutSimple(): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Sign out failed:', error)
      return { error: error.message }
    }
    
    return {}
  } catch (error) {
    console.error('Error during sign out:', error)
    return { error: 'An unexpected error occurred' }
  }
}
