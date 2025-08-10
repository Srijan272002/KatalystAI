import { google, calendar_v3 } from 'googleapis'
import { Meeting } from '@/types/meeting'
import { logger } from '../utils/logger'

export class GoogleCalendarService {
  private calendar: calendar_v3.Calendar
  private userEmail: string

  constructor(accessToken: string, userEmail: string) {
    if (!accessToken) {
      throw new Error('Access token is required for Google Calendar API')
    }
    if (!userEmail) {
      throw new Error('User email is required for Google Calendar API')
    }

    this.userEmail = userEmail
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: accessToken })
    this.calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  }

  private async getPrimaryCalendarId(): Promise<string> {
    try {
      const response = await this.calendar.calendarList.list({
        maxResults: 100,
        showDeleted: false,
        fields: 'items(id,summary,primary,accessRole)'
      })

      console.log(`📋 Available calendars for ${this.userEmail}:`, response.data.items)

      const primaryCalendar = response.data.items?.find(cal => cal.primary === true)
      if (!primaryCalendar?.id) {
        throw new Error('No primary calendar found')
      }

      console.log(`✅ Using primary calendar: ${primaryCalendar.id}`)
      return primaryCalendar.id
    } catch (error) {
      logger.error('Failed to get primary calendar', error as Error)
      throw new Error('Failed to get primary calendar')
    }
  }

  async getUpcomingEvents(maxResults: number = 5): Promise<Meeting[]> {
    try {
      const calendarId = await this.getPrimaryCalendarId()
      const now = new Date()
      const nextMonth = new Date(now)
      nextMonth.setMonth(now.getMonth() + 1)

      const timeMin = now.toISOString()
      
      console.log(`📅 Fetching upcoming events for user ${this.userEmail}`, {
        calendarId,
        timeMin,
        maxResults
      })

      const response = await this.calendar.events.list({
        calendarId,
        timeMin,
        maxResults: maxResults * 2, // Fetch more to account for filtering
        singleEvents: true,
        orderBy: 'startTime',
        fields: 'items(id,summary,description,start,end,attendees,organizer,creator,location,hangoutLink,conferenceData,status)'
      })

      const events = response.data.items || []
      console.log(`📋 Raw upcoming events fetched: ${events.length}`)

      // Filter and transform events
      const meetings = events
        .filter(event => {
          const startTime = event.start?.dateTime || event.start?.date
          return startTime && new Date(startTime) > now
        })
        .map(this.transformEventToMeeting)
        .slice(0, maxResults)

      console.log(`✅ Filtered upcoming events for user (${this.userEmail}): ${meetings.length}`)
      return meetings
    } catch (error) {
      logger.error('Failed to fetch upcoming events', error as Error)
      return []
    }
  }

  async getPastEvents(maxResults: number = 5): Promise<Meeting[]> {
    try {
      const calendarId = await this.getPrimaryCalendarId()
      const now = new Date()
      const pastMonth = new Date(now)
      pastMonth.setMonth(now.getMonth() - 1)

      const timeMin = pastMonth.toISOString()
      const timeMax = now.toISOString()
      
      console.log(`📅 Fetching past events for user ${this.userEmail}`, {
        calendarId,
        timeMin,
        timeMax,
        maxResults
      })

      const response = await this.calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        maxResults: maxResults * 2, // Fetch more to account for filtering
        singleEvents: true,
        orderBy: 'startTime',
        fields: 'items(id,summary,description,start,end,attendees,organizer,creator,location,hangoutLink,conferenceData,status)'
      })

      const events = response.data.items || []
      console.log(`📋 Raw past events fetched: ${events.length}`)

      // Filter and transform events
      const meetings = events
        .filter(event => {
          const endTime = event.end?.dateTime || event.end?.date
          return endTime && new Date(endTime) <= now
        })
        .map(this.transformEventToMeeting)
        .reverse() // Most recent first
        .slice(0, maxResults)

      console.log(`✅ Filtered past events for user (${this.userEmail}): ${meetings.length}`)
      return meetings
    } catch (error) {
      logger.error('Failed to fetch past events', error as Error)
      return []
    }
  }

  async getEvents(): Promise<{ upcoming: Meeting[], past: Meeting[] }> {
    try {
      const [upcoming, past] = await Promise.all([
        this.getUpcomingEvents(),
        this.getPastEvents()
      ])

      return {
        upcoming,
        past
      }
    } catch (error) {
      logger.error('Failed to fetch events', error as Error)
      return {
        upcoming: [],
        past: []
      }
    }
  }

  private transformEventToMeeting = (event: calendar_v3.Schema$Event): Meeting => {
    const startTime = event.start?.dateTime || event.start?.date || new Date().toISOString()
    const endTime = event.end?.dateTime || event.end?.date || new Date(Date.now() + 3600000).toISOString()
    
    // Calculate duration in minutes
    const duration = Math.round(
      (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000
    )

    // Extract meeting URL from various sources
    const meetingUrl = 
      event.hangoutLink ||
      (event.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri) ||
      event.description?.match(/https:\/\/[^\s]*(?:zoom|meet|teams|webex)[^\s]*/i)?.[0]

    return {
      id: event.id || `meeting-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: event.summary || 'Untitled Meeting',
      description: event.description || undefined,
      startTime,
      endTime,
      duration,
      location: event.location || undefined,
      meetingUrl,
      attendees: (event.attendees || []).map(attendee => ({
        email: attendee.email || '',
        name: attendee.displayName || attendee.email || '',
        responseStatus: (attendee.responseStatus as 'accepted' | 'declined' | 'tentative' | 'needsAction') || 'needsAction'
      })),
      organizer: {
        email: event.organizer?.email || '',
        name: event.organizer?.displayName || event.organizer?.email || ''
      }
    }
  }
}

export function createGoogleCalendarService(accessToken: string, userEmail: string): GoogleCalendarService {
  return new GoogleCalendarService(accessToken, userEmail)
}