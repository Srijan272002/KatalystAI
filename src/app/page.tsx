"use client"

import { useEffect, useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, Brain, Zap } from "lucide-react"
import { useSimpleAuth, signInWithGoogleSimple, handleOAuthCallback } from "@/lib/auth/simple-auth"
import { useRouter, useSearchParams } from "next/navigation"
import Loader from "@/components/ui/loader"
import StyledLoginButton from "@/components/ui/styled-login-button"

// Separate component for OAuth callback handling
function OAuthCallbackHandler() {
  const searchParams = useSearchParams()
  const [isSigningIn, setIsSigningIn] = useState(false)

  // Handle OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const error = searchParams.get('error')
      
      if (code) {
        console.log('🔍 OAuth callback detected, handling session exchange...')
        setIsSigningIn(true)
        try {
          const result = await handleOAuthCallback()
          if (result.error) {
            console.error('OAuth callback failed:', result.error)
          } else {
            console.log('OAuth callback successful')
          }
        } catch (error) {
          console.error('Error handling OAuth callback:', error)
        } finally {
          setIsSigningIn(false)
        }
      }
      
      if (error) {
        console.error('OAuth error:', error)
      }
    }

    handleCallback()
  }, [searchParams])

  return null // This component doesn't render anything
}

export default function Home() {
  const { user, isAuthenticated, loading } = useSimpleAuth()
  const router = useRouter()
  const [isSigningIn, setIsSigningIn] = useState(false)

  // Debug logging
  useEffect(() => {
    console.log('Landing page auth state:', {
      loading,
      isAuthenticated,
      userEmail: user?.email,
      hasUser: !!user
    })
  }, [loading, isAuthenticated, user])

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Redirecting authenticated user to dashboard:', user.email)
      // Add a small delay to ensure the dashboard is ready
      setTimeout(() => {
        router.push('/dashboard')
      }, 100)
    }
  }, [isAuthenticated, user, router])

  const handleSignIn = async () => {
    setIsSigningIn(true)
    try {
      const result = await signInWithGoogleSimple()
      if (result.error) {
        console.error('Sign in error:', result.error)
      }
    } catch (error) {
      console.error('Sign in failed:', error)
    } finally {
      setIsSigningIn(false)
    }
  }

  // Show loading while checking authentication
  if (loading || isSigningIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  // Don't render the landing page if user is authenticated (they'll be redirected)
  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* OAuth Callback Handler wrapped in Suspense */}
      <Suspense fallback={null}>
        <OAuthCallbackHandler />
      </Suspense>

      {/* Hero Section */}
      <section className="px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            AI-Powered Calendar Intelligence
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            Transform your Google Calendar into an intelligent workspace. Get AI-powered insights, summaries, and
            contextual information about your meetings.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <StyledLoginButton 
              onClick={handleSignIn}
              disabled={isSigningIn}
              isLoading={isSigningIn}
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-lg text-gray-600">Simple steps to unlock your calendar&apos;s potential</p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                <Calendar className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">Connect Calendar</h3>
              <p className="mt-2 text-gray-600">Securely connect your Google Calendar with one click</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                <Brain className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">AI Analysis</h3>
              <p className="mt-2 text-gray-600">Our AI analyzes your meetings and generates intelligent insights</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                <Zap className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">Get Insights</h3>
              <p className="mt-2 text-gray-600">Access summaries, action items, and contextual information</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">Powerful Features</h2>
            <p className="mt-4 text-lg text-gray-800">Everything you need to make your meetings more productive</p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                <Calendar className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">Smart Scheduling</h3>
              <p className="mt-2 text-gray-600">View upcoming and past meetings with detailed information including duration, attendees, and
                  descriptions.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                <Brain className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">AI Summaries</h3>
              <p className="mt-2 text-gray-600">Get AI-generated summaries of your past meetings with key takeaways and action items.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                <Zap className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">Attendee Insights</h3>
              <p className="mt-2 text-gray-600">See who attended your meetings and get context about your interactions with different people.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                <Calendar className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">Secure Integration</h3>
              <p className="mt-2 text-gray-600">Your calendar data is processed securely with enterprise-grade encryption and privacy protection.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                <Zap className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">Real-time Sync</h3>
              <p className="mt-2 text-gray-600">Stay up-to-date with real-time synchronization of your Google Calendar events and changes.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                <Calendar className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">Smart Filtering</h3>
              <p className="mt-2 text-gray-600">Easily filter and search through your meetings to find exactly what you&apos;re looking for.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Transform Your Calendar?
            </h2>
            <p className="mt-4 text-lg text-indigo-600 max-w-2xl">
              Connect your Google Calendar and start getting AI-powered insights today.
            </p>
            <div className="mt-8 flex justify-center w-full">
              <StyledLoginButton 
                onClick={handleSignIn}
                disabled={isSigningIn}
                isLoading={isSigningIn}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="px-4 py-12 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-lg font-semibold text-white">Katalyst Calendar AI</h3>
              <p className="mt-2 text-gray-400">
                Transforming how you interact with your calendar through AI-powered intelligence.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Product</h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <a href="#features" className="text-gray-400 hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Company</h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800">
            <p className="text-center text-gray-400">© 2024 Katalyst Calendar AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}