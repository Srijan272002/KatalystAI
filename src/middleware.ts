import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth/error"]
  const apiRoutes = ["/api/auth"]
  
  // Check if the current path is a public route or API route
  const isPublicRoute = publicRoutes.includes(pathname)
  const isApiRoute = apiRoutes.some(route => pathname.startsWith(route))
  
  // Check if user is authenticated
  const isAuthenticated = !!req.auth

  // Create response
  let response: NextResponse

  // Allow API routes to pass through
  if (isApiRoute) {
    response = NextResponse.next()
  }
  // If trying to access protected route without authentication
  else if (!isPublicRoute && !isAuthenticated) {
    const homeUrl = new URL("/", req.url)
    homeUrl.searchParams.set("callbackUrl", pathname)
    response = NextResponse.redirect(homeUrl)
  }
  // If authenticated user tries to access public pages, redirect to dashboard
  else if (isAuthenticated && pathname === "/") {
    response = NextResponse.redirect(new URL("/dashboard", req.url))
  }
  // Handle any attempts to access old auth routes
  else if (pathname.startsWith("/auth/signin")) {
    response = NextResponse.redirect(new URL("/", req.url))
  }
  else {
    response = NextResponse.next()
  }

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Add CSP header for additional security
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://api.fontshare.com; img-src 'self' data: https:; font-src 'self' https://api.fontshare.com; connect-src 'self' https://*.supabase.co https://*.googleapis.com https://api.fontshare.com"
  )

  return response
})

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}
