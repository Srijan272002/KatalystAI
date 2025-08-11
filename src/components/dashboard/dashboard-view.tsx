"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, Users, Brain, RefreshCw } from "lucide-react"
import Loader from "@/components/ui/loader"
import { useToast } from "@/components/ui/toast"
import { MeetingWithAttendees } from "@/lib/supabase/types"
import { useSimpleAuth, handleOAuthCallback } from "@/lib/auth/simple-auth"
import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar"
import { MeetingCard } from "@/components/meeting/meeting-card"

interface DashboardViewProps {
  searchParams?: { code?: string; error?: string }
}

export function DashboardView({ searchParams }: DashboardViewProps) {
  console.log('🔍 DashboardView: Component rendering')
  
  // All React hooks must be called at the top level, before any conditional returns
  const { addToast } = useToast()
  const { user, isAuthenticated, loading: authLoading } = useSimpleAuth()
  
  // State hooks
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming")
  const [loadingSummary, setLoadingSummary] = useState<string | null>(null)
  const [summaries, setSummaries] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meetings, setMeetings] = useState<{ upcomingMeetings: MeetingWithAttendees[], pastMeetings: MeetingWithAttendees[] }>({
    upcomingMeetings: [],
    pastMeetings: []
  })
  const [lastUpdated, setLastUpdated] = useState<string>('')

  // Callback hooks
  const fetchCalendarData = useCallback(async (showLoading = true, forceRefresh = false) => {
    // Don't fetch if user is not authenticated
    if (!isAuthenticated) {
      console.log('⚠️ User not authenticated, skipping calendar fetch')
      setLoading(false)
      return
    }

    try {
      if (showLoading) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }
      setError(null)

      // Add cache-busting parameter for force refresh
      const refreshParam = forceRefresh ? '?refresh=true' : ''
      const response = await fetch(`/api/calendar${refreshParam}`, {
        headers: {
          'Cache-Control': forceRefresh ? 'no-cache' : 'default',
        },
      })
      const data = await response.json()

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 401) {
          if (data.code === 'SESSION_EXPIRED') {
            addToast('Session expired. Please refresh the page.', 'error')
            setTimeout(() => {
              window.location.href = '/'
            }, 2000)
            return
          } else if (data.code === 'AUTH_REQUIRED') {
            addToast('Please sign in to continue.', 'error')
            window.location.href = '/'
            return
          }
        }
        throw new Error(data.message || data.error || "Failed to fetch calendar data")
      }

      setMeetings({
        upcomingMeetings: data.upcomingMeetings || [],
        pastMeetings: data.pastMeetings || []
      })
      setLastUpdated(data.lastUpdated || new Date().toISOString())
      
      console.log('✅ Calendar data refreshed:', {
        upcoming: data.upcomingMeetings?.length || 0,
        past: data.pastMeetings?.length || 0,
        timestamp: new Date().toLocaleString()
      })
      
      // Show success toast for manual refreshes
      if (forceRefresh) {
        addToast(`Calendar refreshed! Found ${(data.upcomingMeetings?.length || 0) + (data.pastMeetings?.length || 0)} meetings`, 'success')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      console.error('❌ Calendar refresh failed:', err)
      
      // Show error toast for manual refreshes
      if (forceRefresh) {
        addToast('Failed to refresh calendar. Please try again.', 'error')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [addToast, isAuthenticated])

  const handleManualRefresh = useCallback(() => {
    if (!isAuthenticated) {
      addToast('Please sign in to refresh your calendar.', 'error')
      return
    }
    console.log('🔄 Manual refresh triggered')
    fetchCalendarData(false, true)
  }, [fetchCalendarData, isAuthenticated, addToast])

  const handleAISummary = useCallback(async (meetingId: string) => {
    setLoadingSummary(meetingId)
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Generate mock summary
      const meeting = [...meetings.upcomingMeetings, ...meetings.pastMeetings].find(m => m.id === meetingId)
      if (meeting) {
        const mockSummary = `AI Summary for "${meeting.title}": This meeting focused on key deliverables and team collaboration. Important decisions were made regarding project timelines and resource allocation.`
        setSummaries(prev => ({ ...prev, [meetingId]: mockSummary }))
        addToast('AI summary generated successfully!', 'success')
      }
    } catch (error) {
      console.error('Error generating AI summary:', error)
      addToast('Failed to generate AI summary. Please try again.', 'error')
    } finally {
      setLoadingSummary(null)
    }
  }, [meetings, addToast])

  // Effect hooks
  useEffect(() => {
    const handleOAuth = async () => {
      if (searchParams?.code) {
        console.log('🔍 DashboardView: Handling OAuth callback...')
        try {
          const result = await handleOAuthCallback()
          if (result.error) {
            console.error('OAuth callback failed:', result.error)
            addToast('Authentication failed. Please try again.', 'error')
          } else {
            console.log('OAuth callback successful')
            addToast('Successfully authenticated!', 'success')
          }
        } catch (error) {
          console.error('Error handling OAuth callback:', error)
          addToast('Authentication error. Please try again.', 'error')
        }
      }
      
      if (searchParams?.error) {
        console.error('OAuth error:', searchParams.error)
        addToast('Authentication error. Please try again.', 'error')
      }
    }

    handleOAuth()
  }, [searchParams, addToast])

  // Fetch data on mount
  useEffect(() => {
    fetchCalendarData()
  }, [fetchCalendarData])

  console.log('🔍 DashboardView: Auth state:', {
    user: user?.email,
    isAuthenticated,
    authLoading
  })

  // Simple fallback UI while loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Fallback if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to access the dashboard.</p>
          <Button 
            onClick={() => window.location.href = '/'}
            className="mt-4"
          >
            Go to Home
          </Button>
        </div>
      </div>
    )
  }

  const handleTabChange = (tab: "upcoming" | "past") => {
    setActiveTab(tab)
  }

  // Get current meetings based on active tab
  const currentMeetings = activeTab === "upcoming" ? meetings.upcomingMeetings : meetings.pastMeetings

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-gray-600">Loading your calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <DashboardNavbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onRefresh={handleManualRefresh}
        refreshing={refreshing}
        lastUpdated={lastUpdated}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <span className="text-sm font-medium">Error:</span>
                <span className="text-sm">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meetings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentMeetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              isPast={activeTab === "past"}
              onAISummary={handleAISummary}
            />
          ))}
        </div>

        {/* Empty State */}
        {currentMeetings.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab} meetings found
            </h3>
            <p className="text-gray-500 mb-6">
              {activeTab === "upcoming" 
                ? "You don't have any upcoming meetings scheduled."
                : "You don't have any past meetings to display."
              }
            </p>
            <Button
              variant="outline"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-400 bg-white font-medium shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Calendar
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}