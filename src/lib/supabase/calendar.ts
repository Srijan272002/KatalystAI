import { createServerSupabaseClient } from './client'
import { CalendarData, MeetingWithAttendees, MeetingInsert, MeetingAttendeeInsert } from './types'
import { logger } from '../utils/logger'
import { google } from 'googleapis'

export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string | null
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: string
  }>
  organizer?: {
    email: string
    displayName?: string
  }
  location?: string
  hangoutLink?: string
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType: string
      uri: string
    }>
  }
}

/**
 * Get calendar data for a user
 */
export async function getCalendarData(userId: string, forceRefresh: boolean = false): Promise<CalendarData> {
  try {
    // Check if we should fetch from cache or force refresh
    if (!forceRefresh) {
      const cachedData = await getCachedCalendarData(userId)
      if (cachedData) {
        return cachedData
      }
    }

    // Get Google access token
    const accessToken = await getGoogleAccessToken()
    if (!accessToken) {
      throw new Error('No Google access token available')
    }

    // Fetch from Google Calendar API
    const googleEvents = await fetchGoogleCalendarEvents(accessToken)
    
    // Store in Supabase
    await storeCalendarData(userId, googleEvents)
    
    // Return formatted data
    return formatCalendarData(googleEvents)
  } catch (error) {
    logger.error('Error getting calendar data', error as Error)
    throw error
  }
}

/**
 * Get cached calendar data from Supabase
 */
async function getCachedCalendarData(userId: string): Promise<CalendarData | null> {
  try {
    const supabaseClient = await createServerSupabaseClient()
    
    // Get meetings from the past 30 days to include both past and upcoming meetings
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: meetings, error } = await supabaseClient
      .from('meetings')
      .select(`
        *,
        meeting_attendees (
          id,
          email,
          name,
          response_status
        )
      `)
      .eq('user_id', userId)
      .gte('start_time', thirtyDaysAgo.toISOString())
      .order('start_time', { ascending: true })
      .limit(100) // Increased limit to get more meetings

    if (error) {
      logger.error('Error fetching cached meetings', error)
      return null
    }

    if (!meetings || meetings.length === 0) {
      return null
    }

    // Check if cache is fresh (less than 5 minutes old)
    const latestMeeting = meetings[0]
    const cacheAge = Date.now() - new Date(latestMeeting.updated_at).getTime()
    if (cacheAge < 5 * 60 * 1000) { // 5 minutes
      return formatCalendarDataFromMeetings(meetings)
    }

    return null
  } catch (error) {
    logger.error('Error getting cached calendar data', error as Error)
    return null
  }
}

/**
 * Get Google access token for a user
 */
async function getGoogleAccessToken(): Promise<string | null> {
  try {
    const supabaseClient = await createServerSupabaseClient()
    const { data: { session }, error } = await supabaseClient.auth.getSession()
    
    if (error || !session) {
      return null
    }
    
    return session.provider_token || null
  } catch (error) {
    logger.error('Error getting Google access token', error as Error)
    return null
  }
}

/**
 * Fetch events from Google Calendar API
 */
async function fetchGoogleCalendarEvents(accessToken: string): Promise<GoogleCalendarEvent[]> {
  try {
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: accessToken })
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    
    // Get events from the past 30 days to include both past and upcoming meetings
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: thirtyDaysAgo.toISOString(),
      maxResults: 100, // Increased to get more meetings
      singleEvents: true,
      orderBy: 'startTime'
    })

    return (response.data.items || []).map(event => ({
      id: event.id!,
      summary: event.summary || 'No Title',
      description: event.description || undefined,
      start: {
        dateTime: event.start?.dateTime || undefined,
        date: event.start?.date || undefined
      },
      end: {
        dateTime: event.end?.dateTime || undefined,
        date: event.end?.date || undefined
      },
      attendees: event.attendees?.filter(attendee => attendee.email).map(attendee => ({
        email: attendee.email!,
        displayName: attendee.displayName || undefined,
        responseStatus: attendee.responseStatus || undefined
      })),
      organizer: event.organizer ? {
        email: event.organizer.email || '',
        displayName: event.organizer.displayName || undefined
      } : undefined,
      location: event.location || undefined,
      hangoutLink: event.hangoutLink || undefined,
      conferenceData: event.conferenceData ? {
        entryPoints: event.conferenceData.entryPoints?.filter(ep => ep.entryPointType && ep.uri).map(ep => ({
          entryPointType: ep.entryPointType!,
          uri: ep.uri!
        }))
      } : undefined
    }))
  } catch (error) {
    logger.error('Error fetching Google Calendar events', error as Error)
    throw error
  }
}

/**
 * Store calendar data in Supabase
 */
async function storeCalendarData(userId: string, events: GoogleCalendarEvent[]): Promise<void> {
  try {
    const supabaseClient = await createServerSupabaseClient()
    
    // Clear existing meetings for this user
    await supabaseClient
      .from('meetings')
      .delete()
      .eq('user_id', userId)

    // Insert new meetings
    for (const event of events) {
      const meetingData: MeetingInsert = {
        user_id: userId,
        title: event.summary,
        description: event.description || null,
        start_time: event.start.dateTime || event.start.date!,
        end_time: event.end.dateTime || event.end.date!,
        duration_minutes: calculateDuration(event.start, event.end),
        location: event.location || null,
        meeting_url: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri || null,
        organizer_email: event.organizer?.email || '',
        organizer_name: event.organizer?.displayName || null
      }

      const { data: meeting, error: meetingError } = await supabaseClient
        .from('meetings')
        .insert(meetingData)
        .select()
        .single()

      if (meetingError) {
        logger.error('Error inserting meeting', meetingError)
        continue
      }

      // Insert attendees
      if (event.attendees && event.attendees.length > 0) {
        const attendeeData: MeetingAttendeeInsert[] = event.attendees.map(attendee => ({
          meeting_id: meeting.id,
          email: attendee.email,
          name: attendee.displayName || null,
          response_status: (attendee.responseStatus as 'needsAction' | 'accepted' | 'declined' | 'tentative') || 'needsAction'
        }))

        const { error: attendeeError } = await supabaseClient
          .from('meeting_attendees')
          .insert(attendeeData)

        if (attendeeError) {
          logger.error('Error inserting attendees', attendeeError)
        }
      }
    }
  } catch (error) {
    logger.error('Error storing calendar data', error as Error)
    throw error
  }
}

/**
 * Format calendar data for response
 */
function formatCalendarData(events: GoogleCalendarEvent[]): CalendarData {
  const now = new Date()
  const upcomingMeetings: MeetingWithAttendees[] = []
  const pastMeetings: MeetingWithAttendees[] = []

  events.forEach(event => {
    const meeting: MeetingWithAttendees = {
      id: event.id,
      user_id: '', // Will be set by the database
      title: event.summary,
      description: event.description || null,
      start_time: event.start.dateTime || event.start.date!,
      end_time: event.end.dateTime || event.end.date!,
      duration_minutes: calculateDuration(event.start, event.end),
      location: event.location || null,
      meeting_url: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri || null,
      organizer_email: event.organizer?.email || '',
      organizer_name: event.organizer?.displayName || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attendees: event.attendees?.map(attendee => ({
        email: attendee.email,
        name: attendee.displayName || null,
        responseStatus: (attendee.responseStatus as 'needsAction' | 'accepted' | 'declined' | 'tentative') || 'needsAction'
      })) || []
    }

    const startTime = new Date(event.start.dateTime || event.start.date!)
    if (startTime > now) {
      upcomingMeetings.push(meeting)
    } else {
      pastMeetings.push(meeting)
    }
  })

  // Sort meetings by start time
  upcomingMeetings.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  pastMeetings.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())

  // Limit to 5 meetings each as requested
  const limitedUpcomingMeetings = upcomingMeetings.slice(0, 5)
  const limitedPastMeetings = pastMeetings.slice(0, 5)

  return {
    upcomingMeetings: limitedUpcomingMeetings,
    pastMeetings: limitedPastMeetings,
    lastUpdated: new Date().toISOString(),
    hasConnection: true
  }
}

/**
 * Format calendar data from database meetings
 */
function formatCalendarDataFromMeetings(meetings: any[]): CalendarData {
  const now = new Date()
  const upcomingMeetings: MeetingWithAttendees[] = []
  const pastMeetings: MeetingWithAttendees[] = []

  meetings.forEach(meeting => {
    // Ensure attendees is always an array and properly formatted
    const attendees = Array.isArray(meeting.meeting_attendees) 
      ? meeting.meeting_attendees.map((attendee: any) => ({
          email: attendee.email,
          name: attendee.name || null,
          responseStatus: (attendee.response_status as 'needsAction' | 'accepted' | 'declined' | 'tentative') || 'needsAction'
        }))
      : []

    const formattedMeeting: MeetingWithAttendees = {
      ...meeting,
      attendees: attendees
    }

    const startTime = new Date(meeting.start_time)
    if (startTime > now) {
      upcomingMeetings.push(formattedMeeting)
    } else {
      pastMeetings.push(formattedMeeting)
    }
  })

  // Sort meetings by start time
  upcomingMeetings.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  pastMeetings.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())

  // Limit to 5 meetings each as requested
  const limitedUpcomingMeetings = upcomingMeetings.slice(0, 5)
  const limitedPastMeetings = pastMeetings.slice(0, 5)

  return {
    upcomingMeetings: limitedUpcomingMeetings,
    pastMeetings: limitedPastMeetings,
    lastUpdated: new Date().toISOString(),
    hasConnection: false
  }
}

/**
 * Calculate duration between start and end times
 */
function calculateDuration(start: { dateTime?: string; date?: string }, end: { dateTime?: string; date?: string }): number {
  const startTime = new Date(start.dateTime || start.date!)
  const endTime = new Date(end.dateTime || end.date!)
  return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
}
