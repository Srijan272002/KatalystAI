"use client"

import { useState, useEffect } from "react"
import { User } from "next-auth"
import { Button } from "@/components/ui/button"
import { MeetingList } from "@/components/meeting/meeting-list"
import { CalendarData } from "@/types/meeting"
import { generateMockAISummary } from "@/lib/utils/mock-data"
import { useToast } from "@/components/ui/toast"
import { RefreshCw, LogOut, Calendar } from "lucide-react"
import { signOut } from "next-auth/react"

interface DashboardContentProps {
  user: User
}

export function DashboardContent({ user }: DashboardContentProps) {
  const { addToast } = useToast()
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectedToCalendar, setConnectedToCalendar] = useState(false)
  const [retryAttempt, setRetryAttempt] = useState(0)

  const fetchCalendarData = async (showLoading = true, forceRefresh = false, retryCount = 0) => {
    const maxRetries = 3
    
    try {
      if (showLoading) setLoading(true)
      if (!showLoading) setRefreshing(true)
      setError(null)

      // Add cache-busting parameter for force refresh
      const refreshParam = forceRefresh ? '?refresh=true' : ''
      console.log(`📡 Fetching calendar data (attempt ${retryCount + 1}/${maxRetries + 1})...`)
      
      const response = await fetch(`/api/calendar${refreshParam}`, {
        headers: {
          'Cache-Control': forceRefresh ? 'no-cache' : 'default',
        },
      })
      
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch calendar data")
      }

      setCalendarData(data)
      
      // Check connection status from API response
      setConnectedToCalendar(data.hasConnection !== false)
      
      // If we got empty data and it's the initial load (not a manual refresh), retry after a short delay
      if (!forceRefresh && retryCount < maxRetries && data.hasConnection === false && (data.upcomingMeetings?.length || 0) === 0 && (data.pastMeetings?.length || 0) === 0) {
        console.log(`🔄 Got empty data on attempt ${retryCount + 1}, retrying in 2 seconds...`)
        setRetryAttempt(retryCount + 1)
        addToast(`Retrying to load calendar data (${retryCount + 1}/${maxRetries})...`, 'info', 2000)
        setTimeout(() => {
          fetchCalendarData(false, true, retryCount + 1) // Force refresh on retry
        }, 2000)
        return
      }
      
      // Reset retry count on successful load
      setRetryAttempt(0)
      
      // Log successful fetch for debugging
      console.log('Calendar data fetched:', {
        upcoming: data.upcomingMeetings?.length || 0,
        past: data.pastMeetings?.length || 0,
        lastUpdated: data.lastUpdated
      })
      
      // Show success toast for manual refreshes
      if (forceRefresh) {
        const totalMeetings = (data.upcomingMeetings?.length || 0) + (data.pastMeetings?.length || 0)
        addToast(`Calendar refreshed! Found ${totalMeetings} meetings`, 'success')
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      console.error('Calendar fetch error:', err)
      
      // Handle token-related errors with retry logic
      if (errorMessage.includes("token") || errorMessage.includes("unauthorized") || errorMessage.includes("401")) {
        console.log(`🔐 Token issue detected, retrying...`)
        if (retryCount < maxRetries) {
          setRetryAttempt(retryCount + 1)
          addToast(`Authentication issue, retrying (${retryCount + 1}/${maxRetries})...`, 'warning', 3000)
          setTimeout(() => {
            fetchCalendarData(showLoading, true, retryCount + 1) // Force refresh on token error
          }, 3000) // Wait longer for token issues
          return
        } else {
          setError("Authentication expired. Please sign out and sign in again.")
          addToast('Authentication expired. Please sign in again.', 'error')
        }
      } else {
        setError(errorMessage)
        
        // Show error toast for manual refreshes
        if (forceRefresh) {
          addToast('Failed to refresh calendar. Please try again.', 'error')
        }
        
        // If not connected, try to initiate connection
        if (errorMessage.includes("No calendar connection") || 
            errorMessage.includes("not active") ||
            errorMessage.includes("Please connect")) {
          setConnectedToCalendar(false)
        }
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const connectCalendar = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Since we use NextAuth with Google OAuth, we just need to redirect to sign in
      // The Google Calendar connection is automatic with the proper scopes
      const callbackUrl = window.location.origin + "/dashboard"
      window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
    } catch (err) {
      console.error('Calendar connection error:', err)
      const errorMessage = err instanceof Error ? err.message : "Failed to connect to calendar"
      setError(errorMessage)
      setLoading(false)
    }
  }

  const handleAISummary = (meetingId: string) => {
    // Generate mock AI summary using the utility function
    const mockSummary = generateMockAISummary(meetingId)

    // For now, show an enhanced alert - in real implementation, this would be a modal
    const summaryText = `
🤖 AI Meeting Summary Generated!

📝 Summary:
${mockSummary.summary}

🔑 Key Points:
${mockSummary.keyPoints.map(point => `• ${point}`).join('\n')}

✅ Action Items:
${mockSummary.actionItems.map(item => `• ${item}`).join('\n')}

⏰ Generated: ${new Date(mockSummary.createdAt).toLocaleString()}
    `.trim()

    alert(summaryText)
    
    // Log the summary generation for debugging
    console.log('AI Summary generated for meeting:', {
      meetingId,
      summaryId: mockSummary.id,
      timestamp: mockSummary.createdAt
    })
  }

  useEffect(() => {
    // Add a small delay for initial load to ensure session is fully established
    const timer = setTimeout(() => {
      console.log('🚀 Starting initial calendar data fetch...')
      fetchCalendarData()
    }, 1000) // 1 second delay
    
    // Near real-time polling: every 60 seconds
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        fetchCalendarData(false, false)
      }
    }, 60 * 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Manual refresh handler
  const handleManualRefresh = () => {
    console.log('🔄 Manual refresh triggered from dashboard content')
    addToast('Refreshing calendar...', 'info', 1500)
    fetchCalendarData(false, true) // Force refresh without loading state
  }
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + R for refresh
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault()
        handleManualRefresh()
      }
      
      // F5 for refresh
      if (event.key === 'F5') {
        event.preventDefault()
        handleManualRefresh()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Pull-to-refresh (mobile)
  useEffect(() => {
    let startY = 0
    let pulling = false
    const threshold = 70
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY
        pulling = true
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!pulling) return
      const dy = e.touches[0].clientY - startY
      if (dy > threshold && !refreshing && !loading) {
        pulling = false
        handleManualRefresh()
      }
    }
    const onTouchEnd = () => { pulling = false }
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [loading, refreshing])

  if (!connectedToCalendar && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              <h1 className="text-xl font-semibold">Katalyst Calendar</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user.name || user.email}
              </span>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Connect Your Calendar</h2>
              <p className="text-muted-foreground mt-2">
                Connect your Google Calendar to start viewing your meetings and generate AI summaries.
              </p>
            </div>
            <Button onClick={connectCalendar} size="lg">
              <Calendar className="h-5 w-5 mr-2" />
              Connect Google Calendar
            </Button>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Katalyst Calendar</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-black">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
            <span className="text-sm text-muted-foreground">
              Welcome, {user.name || user.email}
            </span>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchCalendarData()} 
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}

        {retryAttempt > 0 && !error && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
              <p className="text-blue-800">
                Loading calendar data... (Attempt {retryAttempt}/3)
              </p>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Please wait while we fetch your meetings.
            </p>
          </div>
        )}

        {!loading && calendarData && calendarData.upcomingMeetings.length === 0 && calendarData.pastMeetings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No meetings found</h3>
            <p className="text-muted-foreground mb-4">
              Your calendar is connected, but there are no meetings in the selected timeframe.
            </p>
            <Button
              variant="outline"
              onClick={handleManualRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-black">Refresh Calendar</span>
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            <MeetingList
              meetings={calendarData?.upcomingMeetings || []}
              title="Upcoming Meetings"
              loading={loading}
            />
            <MeetingList
              meetings={calendarData?.pastMeetings || []}
              title="Past Meetings"
              isPast={true}
              onAISummary={handleAISummary}
              loading={loading}
            />
          </div>
        )}

        {calendarData && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Last updated: {new Date(calendarData.lastUpdated).toLocaleString()}
          </div>
        )}
      </main>
    </div>
  )
}
