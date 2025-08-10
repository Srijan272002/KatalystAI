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

    // Pass access token with better validation
    const accessToken = (session as any)?.accessToken as string | undefined
    
    // Log token availability for debugging
    console.log(`🔑 Access token available: ${!!accessToken}, User: ${userId}`)
    
    if (!accessToken) {
      logger.warn("No access token in session, user may need to re-authenticate", { userId })
    }

    const calendarData = await getCalendarData(userId, forceRefresh, accessToken)
    
    // Validate response data
    const validatedData = calendarDataSchema.parse(calendarData)
    
    const duration = Date.now() - startTime
    logger.apiRequest("GET", "/api/calendar", userId, duration)
    
    // Always use private cache and include user ID in Vary header
    const headers = {
      'Cache-Control': forceRefresh 
        ? 'no-cache, no-store, must-revalidate'
        : 'private, max-age=60', // 1 minute cache, private to prevent sharing between users
      'Vary': 'Authorization', // Vary on auth header to prevent cache mixing between users
      'X-User-Email': userId // Include user email for debugging
    }
    
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
