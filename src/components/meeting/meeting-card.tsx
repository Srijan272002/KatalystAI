"use client"

import { useState } from 'react'
import { Meeting } from '@/types/meeting'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime, formatDuration, getRelativeDateLabel } from '@/lib/utils'
import { Calendar, Clock, Users, MapPin, ExternalLink, Sparkles } from 'lucide-react'

interface MeetingCardProps {
  meeting: Meeting
  isPast?: boolean
  onAISummary?: (meetingId: string) => void
}

export function MeetingCard({ meeting, isPast = false, onAISummary }: MeetingCardProps) {
  const [summarizing, setSummarizing] = useState(false)

  const handleSummaryClick = async () => {
    if (!onAISummary) return
    try {
      setSummarizing(true)
      await Promise.resolve(onAISummary(meeting.id))
    } finally {
      setSummarizing(false)
    }
  }

  const relative = getRelativeDateLabel(meeting.startTime)

  return (
    <Card className="w-full transition-shadow duration-200 hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg font-semibold truncate">
            {meeting.title}
          </CardTitle>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {relative}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(meeting.startTime)}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
            {' '}({formatDuration(meeting.duration)})
          </span>
        </div>

        {meeting.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{meeting.location}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? 's' : ''}
          </span>
        </div>

        {meeting.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {meeting.description}
          </p>
        )}

        <div className="flex items-center gap-2">
          {meeting.meetingUrl && (
            <a
              href={meeting.meetingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              <ExternalLink className="mr-1 h-3.5 w-3.5" /> Join meeting
            </a>
          )}
        </div>

        {isPast && onAISummary && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSummaryClick}
            className="w-full group"
            disabled={summarizing}
          >
            <Sparkles className={`mr-2 h-4 w-4 ${summarizing ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
            {summarizing ? 'Generating...' : 'Generate AI Summary'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
