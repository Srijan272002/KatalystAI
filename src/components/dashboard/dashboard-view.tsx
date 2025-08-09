"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, Users, Brain, RefreshCw } from "lucide-react"
import Loader from "@/components/ui/loader"
import { useToast } from "@/components/ui/toast"
import { signOut } from "next-auth/react"
import { User } from "next-auth"
import { Meeting } from "@/types/meeting"

interface DashboardViewProps {
  user: User
}

export function DashboardView({ user }: DashboardViewProps) {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming")
  const [loadingSummary, setLoadingSummary] = useState<string | null>(null)
  const [summaries, setSummaries] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meetings, setMeetings] = useState<{ upcomingMeetings: Meeting[], pastMeetings: Meeting[] }>({
    upcomingMeetings: [],
    pastMeetings: []
  })
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchCalendarData = async (showLoading = true, forceRefresh = false) => {
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
        throw new Error(data.error || "Failed to fetch calendar data")
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
  }

  // Manual refresh handler
  const handleManualRefresh = () => {
    console.log('🔄 Manual refresh triggered')
    fetchCalendarData(false, true) // Force refresh without loading state
  }
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + R for refresh
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault()
        handleManualRefresh()
        addToast('Refreshing calendar...', 'info', 1500)
      }
      
      // F5 for refresh
      if (event.key === 'F5') {
        event.preventDefault()
        handleManualRefresh()
        addToast('Refreshing calendar...', 'info', 1500)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [addToast])

  useEffect(() => {
    fetchCalendarData()
    
    // Real-time updates every minute
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        fetchCalendarData(false, false) // Auto refresh without force
      }
    }, 60 * 1000)

    return () => clearInterval(interval)
  }, [loading, refreshing])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const generateAISummary = async (meetingId: string, meetingTitle: string) => {
    setLoadingSummary(meetingId)

    // Mock AI summary generation - in real app, this would call the AI service
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const summary = `AI summary generated for ${meetingTitle}. Key points and action items have been identified from this meeting.`
    
    setSummaries((prev) => ({
      ...prev,
      [meetingId]: summary
    }))
    setLoadingSummary(null)
  }

  const currentMeetings = activeTab === "upcoming" ? meetings.upcomingMeetings : meetings.pastMeetings

  if (loading) {
    return (
      <Loader />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Calendar Dashboard</h1>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={refreshing || loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-black">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </Button>
              <Button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2"
              >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "upcoming"
                  ? "border-indigo-500 text-indigo-600 font-semibold"
                  : "border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              Upcoming Meetings ({meetings.upcomingMeetings.length})
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "past"
                  ? "border-indigo-500 text-indigo-600 font-semibold"
                  : "border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              Past Meetings ({meetings.pastMeetings.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p>{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchCalendarData(true, true)} 
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Meetings List */}
      <main className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="space-y-6">
          {currentMeetings.map((meeting) => (
            <Card key={meeting.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{meeting.title}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDate(meeting.startTime)}
                      </div>
                      <div className="flex items-center">
                        <span>{meeting.duration} minutes</span>
                      </div>
                    </div>
                  </div>
                  {activeTab === "upcoming" && <Badge className="bg-indigo-100 text-indigo-800">Upcoming</Badge>}
                  {activeTab === "past" && <Badge className="border border-gray-200 text-gray-700">Completed</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-900 mb-2">Attendees</h4>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <div className="flex flex-wrap gap-2">
                      {meeting.attendees.map((attendee, index) => (
                        <Badge key={index} className="bg-gray-100 text-gray-800 text-xs">
                          {attendee.email}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {meeting.description && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-2">Description</h4>
                    <p 
                      className="text-sm text-gray-600"
                      dangerouslySetInnerHTML={{ 
                        __html: meeting.description.replace(/<\/?[^>]+(>|$)/g, "") 
                      }}
                    />
                  </div>
                )}

                {activeTab === "past" && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">

                        {!summaries[meeting.id] && (
                          <Button
                            size="sm"
                            onClick={() => generateAISummary(meeting.id, meeting.title)}
                            disabled={loadingSummary === meeting.id}
                            className="bg-indigo-600 text-white hover:bg-indigo-700 flex items-center"
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            {loadingSummary === meeting.id ? (
                              <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                                Generating...
                              </>
                            ) : (
                              "Generate Summary"
                            )}
                          </Button>
                        )}
                      </div>
                      {summaries[meeting.id] && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-900">{summaries[meeting.id]}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}

          {currentMeetings.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No {activeTab} meetings found.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="mt-4"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-black">Refresh Calendar</span>
              </Button>
            </div>
          )}
        </div>
        
        {/* Last Updated Timestamp */}
        {lastUpdated && (
          <div className="mt-8 text-center text-sm text-gray-500">
            Last updated: {new Date(lastUpdated).toLocaleString()}
            {refreshing && (
              <span className="ml-2 text-indigo-600">
                • Refreshing...
              </span>
            )}
          </div>
        )}
      </main>
    </div>
  )
}