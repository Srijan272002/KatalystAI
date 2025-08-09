import { Meeting } from '@/types/meeting'
import { MeetingCard } from './meeting-card'
import { MeetingListSkeleton } from '@/components/ui/loading-skeleton'

interface MeetingListProps {
  meetings: Meeting[]
  title: string
  isPast?: boolean
  onAISummary?: (meetingId: string) => void
  loading?: boolean
}

export function MeetingList({ 
  meetings, 
  title, 
  isPast = false, 
  onAISummary,
  loading = false 
}: MeetingListProps) {
  if (loading) {
    return <MeetingListSkeleton />
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {meetings.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No {isPast ? 'past' : 'upcoming'} meetings found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map(meeting => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              isPast={isPast}
              onAISummary={onAISummary}
            />
          ))}
        </div>
      )}
    </div>
  )
}
