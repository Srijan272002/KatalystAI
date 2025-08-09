"use client"

import { useState, useEffect } from "react"
import { User } from "next-auth"
import { Button } from "@/components/ui/button"
import { MeetingList } from "@/components/meeting/meeting-list"
import { CalendarData } from "@/types/meeting"
import { generateMockAISummary } from "@/lib/utils/mock-data"
import { RefreshCw, LogOut, Calendar } from "lucide-react"
import { signOut } from "next-auth/react"

interface DashboardContentProps {
  user: User
}

export function DashboardContent({ user }: DashboardContentProps) {
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectedToCalendar, setConnectedToCalendar] = useState(false)

  const fetchCalendarData = async (showLoading = true, forceRefresh = false) => {
    try {
      if (showLoading) setLoading(true)
      if (!showLoading) setRefreshing(true)
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
        throw new Error(data.error || "Failed to fetch calendar data")
      }

      setCalendarData(data)
      
      // Check connection status from API response
      setConnectedToCalendar(data.hasConnection !== false)
      
      // Log successful fetch for debugging
      console.log('Calendar data fetched:', {
        upcoming: data.upcomingMeetings?.length || 0,
        past: data.pastMeetings?.length || 0,
        lastUpdated: data.lastUpdated
      })
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      
      console.error('Calendar fetch error:', err)
      
      // If not connected, try to initiate connection
      if (errorMessage.includes("No calendar connection") || 
          errorMessage.includes("not active") ||
          errorMessage.includes("Please connect")) {
        setConnectedToCalendar(false)
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
      
      const response = await fetch("/api/calendar/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          redirectUrl: window.location.origin + "/dashboard",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to initiate calendar connection")
      }

      const data = await response.json()
      
      if (data.redirectUrl || data.connectionUrl) {
        const redirectUrl = data.redirectUrl || data.connectionUrl
        console.log('Redirecting to Composio auth URL:', redirectUrl)
        window.location.href = redirectUrl
      } else {
        throw new Error("No redirect URL received from server")
      }
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
    fetchCalendarData()
    
    // Near real-time polling: every 60 seconds
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        fetchCalendarData(false, false)
      }
    }, 60 * 1000)

    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Manual refresh handler
  const handleManualRefresh = () => {
    fetchCalendarData(false, true) // Force refresh without loading state
  }

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
              {refreshing ? 'Refreshing...' : 'Refresh'}
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
              Refresh Calendar
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
