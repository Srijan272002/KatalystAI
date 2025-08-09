import { MockAISummary, Meeting } from "@/types/meeting"

const mockSummaryTemplates = [
  {
    summary: "This meeting focused on project alignment and strategic planning. The team discussed key milestones, resource allocation, and upcoming deliverables.",
    keyPoints: [
      "Reviewed Q4 project milestones and deliverables",
      "Discussed resource allocation for upcoming sprint",
      "Aligned on communication protocols with stakeholders",
      "Identified potential risks and mitigation strategies"
    ],
    actionItems: [
      "Follow up with design team on mockups by Friday",
      "Schedule stakeholder review session next week",
      "Update project timeline in project management tool",
      "Prepare risk assessment document"
    ]
  },
  {
    summary: "A productive team sync covering progress updates, blocker resolution, and next quarter planning.",
    keyPoints: [
      "Sprint velocity increased by 15% this quarter",
      "Successfully resolved critical infrastructure issues",
      "New team member onboarding completed",
      "Client feedback incorporation strategy finalized"
    ],
    actionItems: [
      "Implement new testing framework by month-end",
      "Organize team building event for Q1",
      "Create documentation for new processes",
      "Schedule quarterly performance reviews"
    ]
  },
  {
    summary: "Weekly check-in focused on feature development progress and cross-team collaboration initiatives.",
    keyPoints: [
      "Feature development on track for beta release",
      "Cross-functional collaboration improved significantly",
      "User feedback analysis completed",
      "Technical debt reduction plan approved"
    ],
    actionItems: [
      "Coordinate with QA team for beta testing",
      "Implement user feedback in next iteration",
      "Schedule architecture review session",
      "Update deployment pipeline documentation"
    ]
  },
  {
    summary: "Strategic planning session covering market analysis, competitive positioning, and growth opportunities.",
    keyPoints: [
      "Market research findings presented and analyzed",
      "Competitive landscape assessment completed",
      "Growth strategy for next quarter outlined",
      "Budget allocation for new initiatives approved"
    ],
    actionItems: [
      "Finalize go-to-market strategy document",
      "Schedule customer interview sessions",
      "Prepare investor presentation for next board meeting",
      "Research new technology partnerships"
    ]
  },
  {
    summary: "Engineering retrospective focusing on process improvements, technical challenges, and team development.",
    keyPoints: [
      "Code review process efficiency improved",
      "Technical challenges in scaling addressed",
      "Team skill development plan created",
      "New tools and technologies evaluated"
    ],
    actionItems: [
      "Implement new code review guidelines",
      "Schedule technical training sessions",
      "Evaluate and pilot new development tools",
      "Create knowledge sharing initiative"
    ]
  }
]

export function generateMockAISummary(meetingId: string): MockAISummary {
  // Use meetingId to ensure consistent summary for same meeting
  const templateIndex = Math.abs(meetingId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % mockSummaryTemplates.length
  const template = mockSummaryTemplates[templateIndex]
  
  return {
    id: `summary-${meetingId}-${Date.now()}`,
    meetingId,
    ...template,
    createdAt: new Date().toISOString(),
  }
}

export function validateMeetingData(meeting: unknown): boolean {
  try {
    const m = meeting as Record<string, unknown>
    return !!(
      meeting &&
      typeof m.id === 'string' &&
      typeof m.title === 'string' &&
      typeof m.startTime === 'string' &&
      typeof m.endTime === 'string' &&
      Array.isArray(m.attendees) &&
      m.organizer &&
      typeof (m.organizer as Record<string, unknown>).email === 'string'
    )
  } catch {
    return false
  }
}

export function sanitizeMeetingData(meetings: Meeting[]): Meeting[] {
  return meetings
    .filter(validateMeetingData)
    .map((meeting) => {
      const m = meeting as unknown as Record<string, unknown>
      const sanitized: Meeting = {
        ...(m as unknown as Meeting),
        title: (m.title as string)?.substring(0, 200) || 'Untitled Meeting',
        description: (m.description as string)?.substring(0, 1000) || undefined,
        location: (m.location as string)?.substring(0, 200) || undefined,
      }
      return sanitized
    })
}
