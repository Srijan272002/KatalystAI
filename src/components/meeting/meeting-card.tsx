"use client"

import { useState } from 'react'
import { MeetingWithAttendees } from '@/lib/supabase/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatTime, formatDuration, getRelativeDateLabel } from '@/lib/utils'
import { generateMockAISummary } from '@/lib/utils/mock-ai-summary'
import { Calendar, Clock, Users, MapPin, ExternalLink, Sparkles, Brain } from 'lucide-react'

interface MeetingCardProps {
  meeting: MeetingWithAttendees
  isPast?: boolean
  onAISummary?: (meetingId: string) => void
}

export function MeetingCard({ meeting, isPast = false, onAISummary }: MeetingCardProps) {
  const [summarizing, setSummarizing] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [showSummary, setShowSummary] = useState(false)

  // Safety check: ensure meeting object is valid
  if (!meeting) {
    return (
      <Card className="w-full transition-shadow duration-200 hover:shadow-md bg-white border-gray-200">
        <CardContent className="p-4">
          <p className="text-gray-500 text-sm">Invalid meeting data</p>
        </CardContent>
      </Card>
    )
  }

  // Ensure attendees is always an array
  const attendees = Array.isArray(meeting.attendees) ? meeting.attendees : []

  const handleSummaryClick = async () => {
    if (summary) {
      setShowSummary(!showSummary)
      return
    }

    try {
      setSummarizing(true)
      
      // Generate mock AI summary
      const mockSummary = generateMockAISummary(
        meeting.title, 
        attendees.map(a => a.email)
      )
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setSummary(mockSummary)
      setShowSummary(true)
      
      // Call parent callback if provided
      if (onAISummary) {
        await onAISummary(meeting.id)
      }
    } catch (error) {
      console.error('Error generating summary:', error)
    } finally {
      setSummarizing(false)
    }
  }

  const relative = getRelativeDateLabel(meeting.start_time)

  return (
    <Card className="w-full transition-shadow duration-200 hover:shadow-md bg-white border-gray-200 flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg font-semibold truncate text-gray-900">
            {meeting.title}
          </CardTitle>
          <Badge variant="secondary" className="shrink-0 bg-blue-100 text-blue-800 border-blue-200">
            {relative}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Time and Date */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="h-4 w-4 text-gray-600" />
            <span className="font-medium">{formatDate(meeting.start_time)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="h-4 w-4 text-gray-600" />
            <span className="font-medium">
              {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
              <span className="text-gray-600 font-normal ml-1">
                ({formatDuration(meeting.duration_minutes)})
              </span>
            </span>
          </div>

          {/* Location */}
          {meeting.location && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin className="h-4 w-4 text-gray-600" />
              <span className="truncate font-medium">{meeting.location}</span>
            </div>
          )}

          {/* Attendees */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Users className="h-4 w-4 text-gray-600" />
            <span className="font-medium">
              {attendees.length} attendee{attendees.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Attendee List */}
          {attendees.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {attendees.slice(0, 3).map((attendee, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-300 font-medium">
                  {attendee.name || attendee.email}
                </Badge>
              ))}
              {attendees.length > 3 && (
                <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-300 font-medium">
                  +{attendees.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Description */}
          {meeting.description && (
            <div>
              <p 
                className="text-sm text-gray-700 leading-relaxed line-clamp-3"
                dangerouslySetInnerHTML={{ __html: meeting.description }}
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Meeting URL */}
          {meeting.meeting_url && (
            <div className="flex items-center gap-2">
              <a
                href={meeting.meeting_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
              >
                <ExternalLink className="mr-1 h-3.5 w-3.5" /> Join meeting
              </a>
            </div>
          )}

          {/* AI Summary Section for Past Meetings */}
          {isPast && (
            <>
              <Separator className="my-4" />
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSummaryClick}
                  className="w-full group border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={summarizing}
                >
                  {summarizing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mr-2" />
                      Generating Summary...
                    </>
                  ) : summary ? (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      {showSummary ? 'Hide Summary' : 'Show Summary'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                      Generate AI Summary
                    </>
                  )}
                </Button>

                {/* Show Summary */}
                {summary && showSummary && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">AI Summary</span>
                    </div>
                    <p className="text-sm text-blue-900 leading-relaxed">{summary}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
