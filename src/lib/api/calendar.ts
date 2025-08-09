import { Meeting, CalendarData } from "../../types/meeting"
import { logger } from "../utils/logger"
import { sanitizeMeetingData } from "../utils/mock-data"
// Removed public calendar fallback to enforce user-specific data only
import { createGoogleCalendarService } from "../services/google-calendar"

export async function getCalendarData(
  userId: string,
  forceRefresh: boolean = false,
  googleAccessToken?: string
): Promise<CalendarData> {
  const startTime = Date.now()
  
  try {
    logger.info("Fetching calendar data", { userId, forceRefresh })
    
    if (!googleAccessToken) {
      logger.warn("No Google access token provided", { userId })
      console.log(`❌ No access token for user ${userId} - cannot fetch calendar data`)
      // Strict mode: do not use any public/fallback calendars
      return {
        upcomingMeetings: [],
        pastMeetings: [],
        lastUpdated: new Date().toISOString(),
        hasConnection: false,
      }
    }

    // Use Google Calendar API directly with access token
    try {
      console.log(`🚀 Fetching calendar events for user: ${userId}`)
      
      const calendarService = createGoogleCalendarService(googleAccessToken, userId)
      const { upcoming, past } = await calendarService.getEvents()
      
      console.log(`✅ Google Calendar API succeeded - got ${upcoming.length} upcoming, ${past.length} past events`)

      // Sanitize the data to ensure data integrity
      const sanitizedUpcoming: Meeting[] = sanitizeMeetingData(upcoming)
      const sanitizedPast: Meeting[] = sanitizeMeetingData(past)

      const upcomingMeetings: Meeting[] = sanitizedUpcoming
        .filter((meeting: Meeting) => new Date(meeting.startTime) > new Date()) // Ensure truly upcoming
        .sort((a: Meeting, b: Meeting) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 5)

      const pastMeetings: Meeting[] = sanitizedPast
        .filter((meeting: Meeting) => new Date(meeting.endTime) < new Date()) // Ensure truly past
        .sort((a: Meeting, b: Meeting) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()) // Most recent first
        .slice(0, 5)

      const duration = Date.now() - startTime
      logger.info("Calendar data fetched successfully via Google Calendar API", { 
        userId, 
        upcomingCount: upcomingMeetings.length,
        pastCount: pastMeetings.length,
        duration: `${duration}ms`,
      })

      return {
        upcomingMeetings,
        pastMeetings,
        lastUpdated: new Date().toISOString(),
        hasConnection: true,
      }
    } catch (googleApiError) {
      console.warn(`⚠️ Google Calendar API failed:`, {
        error: googleApiError instanceof Error ? googleApiError.message : String(googleApiError)
      })
      logger.error("Google Calendar API failed", googleApiError as Error, userId)
      // Strict mode: do not use any public/fallback calendars
      return {
        upcomingMeetings: [],
        pastMeetings: [],
        lastUpdated: new Date().toISOString(),
        hasConnection: false,
      }
    }
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error("Error fetching calendar data", error, userId, duration)
    
    // Return empty data structure on error instead of throwing
    return {
      upcomingMeetings: [],
      pastMeetings: [],
      lastUpdated: new Date().toISOString(),
      hasConnection: false,
    }
  }
}

/**
 * Transform Google Calendar event to Meeting type
 * This is a simpler version that works directly with Google's API response
 */
function transformGoogleEventToMeeting(event: Record<string, unknown>): Meeting {
  try {
    const start = event.start as { dateTime?: string; date?: string } | undefined
    const end = event.end as { dateTime?: string; date?: string } | undefined
    const startTime = start?.dateTime || start?.date || new Date().toISOString()
    const endTime = end?.dateTime || end?.date || new Date(Date.now() + 60 * 60 * 1000).toISOString() // Default 1 hour duration
    
    // Calculate duration in minutes
    const startDate = new Date(startTime)
    const endDate = new Date(endTime)
    const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))

    // Extract meeting URL from various sources
    const meetingUrl = 
      (event.hangoutLink as string) ||
      (event.conferenceData as any)?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri ||
      (event.description as string)?.match(/https:\/\/[^\s]*(?:zoom|meet|teams|webex)[^\s]*/i)?.[0]
    
    return {
      id: (event.id as string) || `meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: (event.summary as string) || "Untitled Meeting",
      description: (event.description as string) || undefined,
      startTime,
      endTime,
      duration,
      attendees: ((event.attendees as unknown[]) || []).map((attendee: unknown) => {
        const a = attendee as { email?: string; displayName?: string; responseStatus?: string }
        return {
          email: a.email || "",
          name: a.displayName || a.email || "",
          responseStatus: (a.responseStatus as "accepted" | "declined" | "tentative" | "needsAction") || "needsAction",
        }
      }),
      organizer: {
        email: (event.organizer as { email?: string })?.email || (event.creator as { email?: string })?.email || "",
        name: (event.organizer as { displayName?: string; email?: string })?.displayName || 
              (event.creator as { displayName?: string })?.displayName || 
              (event.organizer as { email?: string })?.email || "",
      },
      location: (event.location as string) || undefined,
      meetingUrl,
    }
  } catch (error) {
    logger.error("Error transforming event to meeting", error)
    // Return a fallback meeting object
    return {
      id: `error-meeting-${Date.now()}`,
      title: "Error Loading Meeting",
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      duration: 60,
      attendees: [],
      organizer: { email: "", name: "Unknown" },
    }
  }
}

/**
 * Check if the user has a valid Google Calendar connection
 * Since we're using NextAuth directly with Google OAuth, this just checks if we have an access token
 */
export async function checkCalendarConnection(userId: string, accessToken?: string): Promise<boolean> {
  try {
    if (!accessToken) {
      return false
    }
    
    // Test the connection by making a simple API call
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    return response.ok
  } catch (error) {
    console.error("Error checking calendar connection:", error)
    return false
  }
}

/**
 * Simplified connection initiation - since we use NextAuth, this just redirects to sign in
 */
export async function initiateCalendarConnection(userId: string, redirectUrl?: string) {
  // With NextAuth + Google OAuth, the connection is automatic after sign in
  // Return a simple response that indicates the user should sign in
  return {
    needsAuth: true,
    authUrl: `/auth/signin?callbackUrl=${encodeURIComponent(redirectUrl || '/dashboard')}`,
  }
}