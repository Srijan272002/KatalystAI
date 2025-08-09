import { auth } from "@/lib/auth"
import { initiateCalendarConnection } from "@/lib/api/calendar"
import { logger } from "@/lib/utils/logger"
import { isValidUrl } from "@/lib/utils/validation"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const startTime = Date.now()
  let userId: string | undefined

  try {
    const session = await auth()

    if (!session?.user?.email) {
      logger.securityEvent("Unauthorized calendar connection attempt")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    userId = session.user.email
    logger.apiRequest("POST", "/api/calendar/connect", userId)

    // Try to get redirect URL from request body, fallback to default
    let redirectUrl = `${process.env.NEXTAUTH_URL}/dashboard`
    
    try {
      const body = await request.json()
      if (body.redirectUrl && isValidUrl(body.redirectUrl)) {
        redirectUrl = body.redirectUrl
      }
    } catch {
      // Use default if body parsing fails
    }
    
    // Validate redirect URL
    if (!isValidUrl(redirectUrl)) {
      throw new Error("Invalid redirect URL configuration")
    }

    const connectionRequest = await initiateCalendarConnection(userId, redirectUrl)
    
    const duration = Date.now() - startTime
    logger.info("Calendar connection initiated", { redirectUrl: connectionRequest.redirectUrl }, userId)
    logger.apiRequest("POST", "/api/calendar/connect", userId, duration)
    
    return NextResponse.json({
      redirectUrl: connectionRequest.redirectUrl,
      connectionUrl: connectionRequest.redirectUrl, // Support both property names
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiError("POST", "/api/calendar/connect", error as Error, userId, duration)
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
