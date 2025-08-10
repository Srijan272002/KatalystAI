export interface Database {
  public: {
    Tables: {
      meetings: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          duration_minutes: number
          location: string | null
          meeting_url: string | null
          organizer_email: string
          organizer_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          start_time: string
          end_time: string
          duration_minutes: number
          location?: string | null
          meeting_url?: string | null
          organizer_email: string
          organizer_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          duration_minutes?: number
          location?: string | null
          meeting_url?: string | null
          organizer_email?: string
          organizer_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      meeting_attendees: {
        Row: {
          id: string
          meeting_id: string
          email: string
          name: string | null
          response_status: 'accepted' | 'declined' | 'tentative' | 'needsAction'
          created_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          email: string
          name?: string | null
          response_status?: 'accepted' | 'declined' | 'tentative' | 'needsAction'
          created_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          email?: string
          name?: string | null
          response_status?: 'accepted' | 'declined' | 'tentative' | 'needsAction'
          created_at?: string
        }
      }
      user_calendar_connections: {
        Row: {
          id: string
          user_id: string
          provider: string
          access_token: string | null
          refresh_token: string | null
          expires_at: string | null
          calendar_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider?: string
          access_token?: string | null
          refresh_token?: string | null
          expires_at?: string | null
          calendar_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          access_token?: string | null
          refresh_token?: string | null
          expires_at?: string | null
          calendar_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_meetings_with_attendees: {
        Args: {
          p_user_id: string
          p_start_time?: string
          p_end_time?: string
          p_limit?: number
        }
        Returns: {
          id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          duration_minutes: number
          location: string | null
          meeting_url: string | null
          organizer_email: string
          organizer_name: string | null
          attendees: unknown
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Type helpers
export type Meeting = Database['public']['Tables']['meetings']['Row']
export type MeetingInsert = Database['public']['Tables']['meetings']['Insert']
export type MeetingUpdate = Database['public']['Tables']['meetings']['Update']

export type MeetingAttendee = Database['public']['Tables']['meeting_attendees']['Row']
export type MeetingAttendeeInsert = Database['public']['Tables']['meeting_attendees']['Insert']
export type MeetingAttendeeUpdate = Database['public']['Tables']['meeting_attendees']['Update']

export type UserCalendarConnection = Database['public']['Tables']['user_calendar_connections']['Row']
export type UserCalendarConnectionInsert = Database['public']['Tables']['user_calendar_connections']['Insert']
export type UserCalendarConnectionUpdate = Database['public']['Tables']['user_calendar_connections']['Update']

// Extended types for frontend use
export interface MeetingWithAttendees extends Meeting {
  attendees: Array<{
    email: string
    name: string | null
    responseStatus: 'accepted' | 'declined' | 'tentative' | 'needsAction'
  }>
}

export interface CalendarData {
  upcomingMeetings: MeetingWithAttendees[]
  pastMeetings: MeetingWithAttendees[]
  lastUpdated: string
  hasConnection: boolean
}
