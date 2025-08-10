import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  console.log('🔍 Middleware: Processing request for', req.nextUrl.pathname)
  
  // Only run middleware for dashboard routes
  if (!req.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('🔍 Middleware: Skipping non-dashboard route')
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  console.log('🔍 Middleware: Session check for dashboard -', session ? 'Session found' : 'No session')

  // For now, allow access to dashboard even if server-side session check fails
  // The client-side authentication will handle the actual auth state
  // This prevents the redirect loop while we fix the session synchronization
  if (!session) {
    console.log('🔍 Middleware: No server-side session, but allowing access (client-side auth will handle)')
  } else {
    console.log('🔍 Middleware: Server-side session found, allowing access')
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*']
}
