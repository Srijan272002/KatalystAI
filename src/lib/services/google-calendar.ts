import { google, calendar_v3 } from 'googleapis'
import { config } from '../config'
import { Meeting } from '@/types/meeting'

export class GoogleCalendarService {
  private oauth2Client: any
  private userEmail: string

  constructor(accessToken: string, userEmail: string) {
    if (!accessToken || accessToken.trim() === '') {
      throw new Error('Access token is required for Google Calendar API')
    }
    
    this.oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret
    )
    this.oauth2Client.setCredentials({
      access_token: accessToken,
    })
    this.userEmail = userEmail.toLowerCase()
    
    console.log(`🔐 Google Calendar service initialized for user: ${this.userEmail}`)
  }

  /**
   * Check if the user is involved in this event - STRICT filtering
   */
  private isUserInvolvedInEvent(event: calendar_v3.Schema$Event): boolean {
    const userEmail = this.userEmail
    const eventTitle = event.summary || 'Untitled Event'
    
    console.log(`🔍 Analyzing event: "${eventTitle}"`, {
      organizer: event.organizer?.email,
      creator: event.creator?.email,
      attendees: event.attendees?.map(a => a.email) || [],
      userEmail,
      calendarId: event.organizer?.self
    })

    // STRICT RULE 1: User must be the organizer/creator to show events with attendees
    if (event.attendees && event.attendees.length > 0) {
      const isOrganizer = event.organizer?.email?.toLowerCase() === userEmail
      const isCreator = event.creator?.email?.toLowerCase() === userEmail
      
      if (isOrganizer || isCreator) {
        console.log(`✅ "${eventTitle}" - User is organizer/creator of multi-attendee event`)
        return true
      } else {
        console.log(`❌ "${eventTitle}" - User is NOT organizer/creator of multi-attendee event`)
        return false
      }
    }

    // STRICT RULE 2: For single-person events, user must be organizer OR creator
    if (!event.attendees || event.attendees.length === 0) {
      const isOrganizer = event.organizer?.email?.toLowerCase() === userEmail
      const isCreator = event.creator?.email?.toLowerCase() === userEmail
      
      if (isOrganizer || isCreator) {
        console.log(`✅ "${eventTitle}" - User is organizer/creator of personal event`)
        return true
      } else {
        console.log(`❌ "${eventTitle}" - User is NOT organizer/creator of personal event`)
        return false
      }
    }

    // Default: reject
    console.log(`❌ "${eventTitle}" - Rejected by default filter`)
    return false
  }

  /**
   * Transform Google Calendar event to Meeting type
   */
  private transformEventToMeeting(event: calendar_v3.Schema$Event): Meeting {
    // Handle all-day events correctly
    const startTime = event.start?.dateTime || (event.start?.date ? `${event.start.date}T00:00:00Z` : new Date().toISOString())
    const endTime = event.end?.dateTime || (event.end?.date ? `${event.end.date}T00:00:00Z` : new Date().toISOString())
    
    // Calculate duration in minutes
    const start = new Date(startTime)
    const end = new Date(endTime)
    const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60))

    // Extract meeting URL from various sources
    const meetingUrl = 
      event.hangoutLink ||
      event.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri ||
      event.description?.match(/https:\/\/[^\s]*(?:zoom|meet|teams|webex)[^\s]*/i)?.[0]

    return {
      id: event.id || `event-${Date.now()}`,
      title: event.summary || 'Untitled Event',
      description: event.description || '',
      startTime,
      endTime,
      duration,
      attendees: (event.attendees || []).map(attendee => ({
        email: attendee.email || '',
        name: attendee.displayName || '',
        responseStatus: (attendee.responseStatus as 'accepted' | 'declined' | 'tentative' | 'needsAction') || 'needsAction',
      })),
      organizer: {
        email: event.organizer?.email || '',
        name: event.organizer?.displayName || '',
      },
      location: event.location || '',
      meetingUrl,
    }
  }

  /**
   * Get the user's own calendar ID to ensure we're only fetching their events
   */
  private async getUserCalendarId(): Promise<string> {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
      
      // Get the user's calendar list
      const calendarList = await calendar.calendarList.list()
      
      console.log(`📋 Available calendars for ${this.userEmail}:`, 
        calendarList.data.items?.map(cal => ({
          id: cal.id,
          summary: cal.summary,
          primary: cal.primary,
          accessRole: cal.accessRole
        }))
      )
      
      // ONLY use the primary calendar that belongs to the user
      const primaryCalendar = calendarList.data.items?.find(cal => 
        cal.primary === true && cal.id?.toLowerCase() === this.userEmail
      )
      
      if (primaryCalendar) {
        console.log(`✅ Using primary calendar: ${primaryCalendar.id}`)
        return primaryCalendar.id!
      }
      
      // Fallback: use the user's email as calendar ID
      console.log(`⚠️ Primary calendar not found, using user email as calendar ID: ${this.userEmail}`)
      return this.userEmail
    } catch (error) {
      console.warn('Could not get user calendar ID, using user email:', error)
      return this.userEmail
    }
  }

  /**
   * Get upcoming events from Google Calendar
   */
  async getUpcomingEvents(maxResults: number = 5): Promise<Meeting[]> {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
      
      // Get the user's specific calendar ID
      const calendarId = await this.getUserCalendarId()
      
      const now = new Date()
      const timeMin = now.toISOString()
      
      console.log(`📅 Fetching upcoming events for user ${this.userEmail}`, {
        calendarId,
        timeMin,
        maxResults
      })

      const response = await calendar.events.list({
        calendarId,
        timeMin,
        maxResults: maxResults, // Limit to requested count
        singleEvents: true,
        orderBy: 'startTime',
        // Only show events where the user is the organizer
        showDeleted: false,
        showHiddenInvitations: false,
      })

      const events = response.data.items || []
      console.log(`📋 Raw upcoming events fetched: ${events.length}`)
      
      // Filter events to only include those the user is involved in
      const userEvents = events.filter(event => this.isUserInvolvedInEvent(event))
      console.log(`✅ Filtered upcoming events for user (${this.userEmail}): ${userEvents.length}`)
      
      // Return only the requested number of results
      return userEvents
        .map(event => this.transformEventToMeeting(event))
        .slice(0, maxResults)
    } catch (error) {
      console.error('Error fetching upcoming events:', error)
      throw new Error(`Failed to fetch upcoming events: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Get past events from Google Calendar
   */
  async getPastEvents(maxResults: number = 5): Promise<Meeting[]> {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
      
      // Get the user's specific calendar ID
      const calendarId = await this.getUserCalendarId()
      
      const now = new Date()
      const pastMonth = new Date()
      pastMonth.setMonth(pastMonth.getMonth() - 1)
      
      const timeMin = pastMonth.toISOString()
      const timeMax = now.toISOString()
      
      console.log(`📅 Fetching past events for user ${this.userEmail}`, {
        calendarId,
        timeMin,
        timeMax,
        maxResults
      })

      const response = await calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        maxResults: maxResults, // Limit to requested count
        singleEvents: true,
        orderBy: 'startTime',
        // Only show events where the user is the organizer
        showDeleted: false,
        showHiddenInvitations: false,
      })

      const events = response.data.items || []
      console.log(`📋 Raw past events fetched: ${events.length}`)
      
      // Filter events to only include those the user is involved in
      const userEvents = events.filter(event => this.isUserInvolvedInEvent(event))
      console.log(`✅ Filtered past events for user (${this.userEmail}): ${userEvents.length}`)
      
      // Return only the requested number of results
      return userEvents
        .map(event => this.transformEventToMeeting(event))
        .slice(0, maxResults)
    } catch (error) {
      console.error('Error fetching past events:', error)
      throw new Error(`Failed to fetch past events: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Get all events (upcoming and past) with better organization
   */
  async getEvents(): Promise<{ upcoming: Meeting[], past: Meeting[] }> {
    try {
      const [upcoming, past] = await Promise.all([
        this.getUpcomingEvents(),
        this.getPastEvents(),
      ])

      return {
        upcoming,
        past,
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error)
      throw error
    }
  }
}

/**
 * Factory function to create Google Calendar service with access token and user email
 */
export function createGoogleCalendarService(accessToken: string, userEmail: string): GoogleCalendarService {
  return new GoogleCalendarService(accessToken, userEmail)
}
