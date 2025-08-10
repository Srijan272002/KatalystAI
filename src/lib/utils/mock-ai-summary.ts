/**
 * Generate mock AI summary for past meetings
 */
export function generateMockAISummary(meetingTitle: string, attendees: string[]): string {
  const summaries = [
    `This meeting focused on ${meetingTitle.toLowerCase()}. Key decisions were made regarding project timelines and resource allocation. The team agreed to follow up on action items within the next week.`,
    
    `During this ${meetingTitle.toLowerCase()} session, participants discussed strategic planning and identified several opportunities for improvement. A follow-up meeting was scheduled to review progress.`,
    
    `The ${meetingTitle.toLowerCase()} covered important updates on current initiatives. Team members shared progress reports and collaborated on solutions for identified challenges.`,
    
    `This productive ${meetingTitle.toLowerCase()} session resulted in clear action items and next steps. The team demonstrated strong collaboration and problem-solving skills.`,
    
    `The ${meetingTitle.toLowerCase()} meeting was well-attended with ${attendees.length} participants. Key topics included project milestones, budget considerations, and stakeholder communication.`
  ]
  
  // Return a random summary
  return summaries[Math.floor(Math.random() * summaries.length)]
}

/**
 * Generate detailed mock AI summary with specific sections
 */
export function generateDetailedMockAISummary(meetingTitle: string, attendees: string[], duration: number): string {
  const attendeeNames = attendees.slice(0, 3).join(', ') + (attendees.length > 3 ? ` and ${attendees.length - 3} others` : '')
  
  return `**Meeting Summary: ${meetingTitle}**

**Duration:** ${duration} minutes
**Attendees:** ${attendeeNames}

**Key Discussion Points:**
• Project status updates and milestone tracking
• Resource allocation and budget considerations
• Risk assessment and mitigation strategies
• Next steps and action items

**Decisions Made:**
• Approved the proposed timeline for Q2 deliverables
• Allocated additional resources to high-priority tasks
• Scheduled follow-up meetings for ongoing initiatives

**Action Items:**
• Team leads to provide weekly progress reports
• Budget review meeting scheduled for next month
• Stakeholder communication plan to be finalized

**Next Meeting:** Follow-up session planned for next week to review progress on action items.`
}
