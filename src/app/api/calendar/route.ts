import { getCurrentUserSimple } from "@/lib/auth/server-auth"
import { getCalendarData } from "@/lib/supabase/calendar"
import { logger } from "@/lib/utils/logger"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const startTime = Date.now()
  let userId: string | undefined

  try {
    // Get current user from Supabase auth
    const user = await getCurrentUserSimple()

    if (!user?.email) {
      logger.warn("Unauthorized calendar access attempt", {
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        timestamp: new Date().toISOString()
      })
      
      return NextResponse.json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        message: 'Please sign in to access your calendar'
      }, { status: 401 })
    }

    userId = user.email
    
    // Check for force refresh parameter
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'
    
    logger.apiRequest("GET", "/api/calendar", userId)

    // Get calendar data using Supabase service
    const calendarData = await getCalendarData(user.id, forceRefresh)
    
    const duration = Date.now() - startTime
    logger.apiRequest("GET", "/api/calendar", userId, duration)
    
    // Always use private cache and include user ID in Vary header
    const headers = {
      'Cache-Control': forceRefresh 
        ? 'no-cache, no-store, must-revalidate'
        : 'private, max-age=30', // 30 seconds cache, private to prevent sharing between users
      'Vary': 'Authorization, X-User-Email', // Vary on both auth and user email
      'X-User-Email': userId, // Include user email for debugging
      'ETag': `"${userId}-${Date.now()}"` // User-specific ETag
    }
    
    return NextResponse.json(calendarData, { headers })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiError("GET", "/api/calendar", error as Error, userId, duration)
    
    // Handle specific authentication errors
    if (error instanceof Error && error.message.includes('Auth session missing')) {
      logger.error("Session missing in calendar API", error, userId)
      
      return NextResponse.json({
        error: 'Session expired',
        code: 'SESSION_EXPIRED',
        message: 'Your session has expired. Please refresh the page and try again.'
      }, { status: 401 })
    }
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    
    return NextResponse.json(
      { 
        error: errorMessage,
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while fetching calendar data"
      },
      { status: 500 }
    )
  }
}
