export interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  attendees: Attendee[];
  organizer: Attendee;
  location?: string;
  meetingUrl?: string;
}

export interface Attendee {
  email: string;
  name?: string;
  responseStatus?: 'accepted' | 'declined' | 'tentative' | 'needsAction';
}

export interface CalendarData {
  upcomingMeetings: Meeting[];
  pastMeetings: Meeting[];
  lastUpdated: string;
  hasConnection?: boolean;
}

export interface MockAISummary {
  id: string;
  meetingId: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  createdAt: string;
}
