import { composioClient } from "../composio/client"
import { Meeting, CalendarData } from "../../types/meeting"
import { logger } from "../utils/logger"
import { calculateDuration } from "../utils"
import { sanitizeMeetingData } from "../utils/mock-data"
import { config } from "../config"

function transformComposioEventToMeeting(event: Record<string, unknown>): Meeting {
  try {
    const start = event.start as { dateTime?: string; date?: string } | undefined
    const end = event.end as { dateTime?: string; date?: string } | undefined
    const startTime = start?.dateTime || start?.date || new Date().toISOString()
    const endTime = end?.dateTime || end?.date || new Date(Date.now() + 60 * 60 * 1000).toISOString() // Default 1 hour duration
    
    // Calculate duration safely
    const duration = calculateDuration(startTime, endTime)
    
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
      meetingUrl: (event.hangoutLink as string) || (event.htmlLink as string) || undefined,
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

export async function getCalendarData(
  userId: string,
  forceRefresh: boolean = false,
  googleAccessToken?: string
): Promise<CalendarData> {
  const startTime = Date.now()
  
  try {
    logger.info("Fetching calendar data", { userId, forceRefresh })
    
    // Get the connected account
    const connectedAccount = await composioClient.getConnectedAccount(userId)
    
    if (!connectedAccount) {
      logger.warn("No calendar connection found", { userId })

      // Fallback: try public calendar via API key if explicitly enabled and configured
      if (config.google.enableApiKeyFallback && config.google.apiKey && config.google.calendarId) {
        try {
          const apiKey = config.google.apiKey
          const calendarId = encodeURIComponent(config.google.calendarId)
          const nowIso = new Date().toISOString()
          const end = new Date()
          const start = new Date()
          start.setMonth(start.getMonth() - 1)

          const [gUpcoming, gPast] = await Promise.all([
            fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(nowIso)}&maxResults=5&key=${apiKey}`).then(r => r.json()),
            fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(start.toISOString())}&timeMax=${encodeURIComponent(end.toISOString())}&maxResults=5&key=${apiKey}`).then(r => r.json()),
          ])

          const upcomingEvents = Array.isArray(gUpcoming?.items) ? gUpcoming.items : []
          const pastEvents = Array.isArray(gPast?.items) ? gPast.items : []

          const rawUpcomingMeetings = upcomingEvents.map(transformComposioEventToMeeting)
          const rawPastMeetings = pastEvents.map(transformComposioEventToMeeting)

          const sanitizedUpcoming: Meeting[] = sanitizeMeetingData(rawUpcomingMeetings)
          const sanitizedPast: Meeting[] = sanitizeMeetingData(rawPastMeetings)

          const upcomingMeetings: Meeting[] = sanitizedUpcoming
            .filter((meeting: Meeting) => new Date(meeting.startTime) > new Date())
            .sort((a: Meeting, b: Meeting) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .slice(0, 5)

          const pastMeetings: Meeting[] = sanitizedPast
            .filter((meeting: Meeting) => new Date(meeting.endTime) < new Date())
            .sort((a: Meeting, b: Meeting) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
            .slice(0, 5)

          const duration = Date.now() - startTime
          logger.info("Calendar data fetched via API key fallback (no connection)", { userId, upcomingCount: upcomingMeetings.length, pastCount: pastMeetings.length, duration: `${duration}ms` })

          return {
            upcomingMeetings,
            pastMeetings,
            lastUpdated: new Date().toISOString(),
            hasConnection: false,
          }
        } catch (apiKeyFallbackError) {
          logger.error("API key fallback failed (no connection)", apiKeyFallbackError as Error, userId)
        }
      }

      // Return empty data with metadata indicating no connection
      return {
        upcomingMeetings: [],
        pastMeetings: [],
        lastUpdated: new Date().toISOString(),
        hasConnection: false,
      }
    }

    if (connectedAccount.status !== "ACTIVE") {
      logger.warn("Calendar connection inactive", { userId, status: connectedAccount.status })
      throw new Error("Calendar connection is not active. Please reconnect your Google Calendar.")
    }

    // Fetch upcoming and past events in parallel with retry logic via Composio
    const [upcomingResponse, pastResponse] = await Promise.allSettled([
      retryWithBackoff(() => composioClient.getUpcomingEvents(connectedAccount.id, 5)),
      retryWithBackoff(() => composioClient.getPastEvents(connectedAccount.id, 5)),
    ])

    // Handle responses safely
    const upcomingEvents = upcomingResponse.status === 'fulfilled' 
      ? (Array.isArray(upcomingResponse.value.data?.items) ? upcomingResponse.value.data.items : [])
      : []
      
    const pastEvents = pastResponse.status === 'fulfilled' 
      ? (Array.isArray(pastResponse.value.data?.items) ? pastResponse.value.data.items : [])
      : []

    // Log any failures
    if (upcomingResponse.status === 'rejected') {
      logger.error("Failed to fetch upcoming events", upcomingResponse.reason, userId)
    }
    if (pastResponse.status === 'rejected') {
      logger.error("Failed to fetch past events", pastResponse.reason, userId)
    }

    // If Composio failed for both calls but we have a Google access token, fall back to Google REST v3
    if (
      upcomingResponse.status === 'rejected' &&
      pastResponse.status === 'rejected' &&
      googleAccessToken
    ) {
      try {
        const [gUpcoming, gPast] = await Promise.all([
          fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(new Date().toISOString())}&maxResults=5`, {
            headers: { Authorization: `Bearer ${googleAccessToken}` },
          }).then(r => r.json()),
          (async () => {
            const end = new Date()
            const start = new Date()
            start.setMonth(start.getMonth() - 1)
            return fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(start.toISOString())}&timeMax=${encodeURIComponent(end.toISOString())}&maxResults=5`, {
              headers: { Authorization: `Bearer ${googleAccessToken}` },
            }).then(r => r.json())
          })(),
        ])

        const upcomingEvents = Array.isArray(gUpcoming?.items) ? gUpcoming.items : []
        const pastEvents = Array.isArray(gPast?.items) ? gPast.items : []

        const rawUpcomingMeetings = upcomingEvents.map(transformComposioEventToMeeting)
        const rawPastMeetings = pastEvents.map(transformComposioEventToMeeting)

        const sanitizedUpcoming: Meeting[] = sanitizeMeetingData(rawUpcomingMeetings)
        const sanitizedPast: Meeting[] = sanitizeMeetingData(rawPastMeetings)

        const upcomingMeetings: Meeting[] = sanitizedUpcoming
          .filter((meeting: Meeting) => new Date(meeting.startTime) > new Date())
          .sort((a: Meeting, b: Meeting) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .slice(0, 5)

        const pastMeetings: Meeting[] = sanitizedPast
          .filter((meeting: Meeting) => new Date(meeting.endTime) < new Date())
          .sort((a: Meeting, b: Meeting) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
          .slice(0, 5)

        const duration = Date.now() - startTime
        logger.info("Calendar data fetched via Google fallback", { userId, upcomingCount: upcomingMeetings.length, pastCount: pastMeetings.length, duration: `${duration}ms` })

        return { upcomingMeetings, pastMeetings, lastUpdated: new Date().toISOString(), hasConnection: true }
      } catch (fallbackError) {
        logger.error("Google fallback failed", fallbackError as Error, userId)
      }
    }

    // If both Composio calls failed and no OAuth token helped, try API key fallback if configured
    if (
      upcomingResponse.status === 'rejected' &&
      pastResponse.status === 'rejected' &&
      config.google.enableApiKeyFallback &&
      config.google.apiKey &&
      config.google.calendarId
    ) {
      try {
        const apiKey = config.google.apiKey
        const calendarId = encodeURIComponent(config.google.calendarId)
        const nowIso = new Date().toISOString()
        const end = new Date()
        const start = new Date()
        start.setMonth(start.getMonth() - 1)

        const [gUpcoming, gPast] = await Promise.all([
          fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(nowIso)}&maxResults=5&key=${apiKey}`).then(r => r.json()),
          fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(start.toISOString())}&timeMax=${encodeURIComponent(end.toISOString())}&maxResults=5&key=${apiKey}`).then(r => r.json()),
        ])

        const upcomingEvents = Array.isArray(gUpcoming?.items) ? gUpcoming.items : []
        const pastEvents = Array.isArray(gPast?.items) ? gPast.items : []

        const rawUpcomingMeetings = upcomingEvents.map(transformComposioEventToMeeting)
        const rawPastMeetings = pastEvents.map(transformComposioEventToMeeting)

        const sanitizedUpcoming: Meeting[] = sanitizeMeetingData(rawUpcomingMeetings)
        const sanitizedPast: Meeting[] = sanitizeMeetingData(rawPastMeetings)

        const upcomingMeetings: Meeting[] = sanitizedUpcoming
          .filter((meeting: Meeting) => new Date(meeting.startTime) > new Date())
          .sort((a: Meeting, b: Meeting) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .slice(0, 5)

        const pastMeetings: Meeting[] = sanitizedPast
          .filter((meeting: Meeting) => new Date(meeting.endTime) < new Date())
          .sort((a: Meeting, b: Meeting) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
          .slice(0, 5)

        const duration = Date.now() - startTime
        logger.info("Calendar data fetched via API key fallback", { userId, upcomingCount: upcomingMeetings.length, pastCount: pastMeetings.length, duration: `${duration}ms` })

        return { upcomingMeetings, pastMeetings, lastUpdated: new Date().toISOString(), hasConnection: true }
      } catch (apiKeyFallbackError) {
        logger.error("API key fallback failed", apiKeyFallbackError as Error, userId)
      }
    }

    // Transform, sanitize, and sort events
    const rawUpcomingMeetings = upcomingEvents.map(transformComposioEventToMeeting)
    const rawPastMeetings = pastEvents.map(transformComposioEventToMeeting)
    
    // Sanitize the data to ensure data integrity
    const sanitizedUpcoming: Meeting[] = sanitizeMeetingData(rawUpcomingMeetings)
    const sanitizedPast: Meeting[] = sanitizeMeetingData(rawPastMeetings)

    const upcomingMeetings: Meeting[] = sanitizedUpcoming
      .filter((meeting: Meeting) => new Date(meeting.startTime) > new Date()) // Ensure truly upcoming
      .sort((a: Meeting, b: Meeting) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5)

    const pastMeetings: Meeting[] = sanitizedPast
      .filter((meeting: Meeting) => new Date(meeting.endTime) < new Date()) // Ensure truly past
      .sort((a: Meeting, b: Meeting) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()) // Most recent first
      .slice(0, 5)

    const duration = Date.now() - startTime
    logger.info("Calendar data fetched successfully", { 
      userId, 
      upcomingCount: upcomingMeetings.length,
      pastCount: pastMeetings.length,
      duration: `${duration}ms`
    })

    return {
      upcomingMeetings,
      pastMeetings,
      lastUpdated: new Date().toISOString(),
      hasConnection: true,
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

// Retry helper function with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3, 
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries - 1) {
        throw lastError
      }
      
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      logger.warn(`Retry attempt ${attempt + 1} failed, retrying in ${delay}ms`, { error: (error as Error)?.message })
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

export async function initiateCalendarConnection(userId: string, redirectUrl?: string) {
  try {
    const connectionRequest = await composioClient.initiateConnection(userId, redirectUrl)
    return connectionRequest
  } catch (error) {
    console.error("Error initiating calendar connection:", error)
    throw error
  }
}

export async function checkCalendarConnection(userId: string): Promise<boolean> {
  try {
    const connectedAccount = await composioClient.getConnectedAccount(userId)
    return !!connectedAccount && connectedAccount.status === "ACTIVE"
  } catch (error) {
    console.error("Error checking calendar connection:", error)
    return false
  }
}
