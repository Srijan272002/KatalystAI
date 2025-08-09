import { auth } from "@/lib/auth"
import { getCalendarData } from "@/lib/api/calendar"
import { logger } from "@/lib/utils/logger"
import { calendarDataSchema } from "@/lib/utils/validation"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const startTime = Date.now()
  let userId: string | undefined

  try {
    const session = await auth()

    if (!session?.user?.email) {
      logger.securityEvent("Unauthorized calendar access attempt")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    userId = session.user.email
    
    // Check for force refresh parameter
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'
    
    logger.apiRequest("GET", "/api/calendar", userId)

    // Pass access token for graceful Google API fallback if Composio fails
    const accessToken = (session as any)?.accessToken as string | undefined

    const calendarData = await getCalendarData(userId, forceRefresh, accessToken)
    
    // Validate response data
    const validatedData = calendarDataSchema.parse(calendarData)
    
    const duration = Date.now() - startTime
    logger.apiRequest("GET", "/api/calendar", userId, duration)
    
    // Add cache headers based on refresh parameter
    const headers = forceRefresh 
      ? { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      : { 'Cache-Control': 'public, max-age=300' } // 5 minutes cache
    
    return NextResponse.json(validatedData, { headers })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiError("GET", "/api/calendar", error as Error, userId, duration)
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
