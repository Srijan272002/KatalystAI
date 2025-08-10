import { redirect } from "next/navigation"
import { getCurrentUserSimple } from "@/lib/auth/server-auth"
import { DashboardView } from "@/components/dashboard/dashboard-view"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>
}) {
  console.log('🔍 Dashboard page loading...')
  
  // Await searchParams before accessing its properties
  const resolvedSearchParams = await searchParams
  console.log('🔍 Search params:', resolvedSearchParams)
  
  try {
    // Handle OAuth callback if code is present
    if (resolvedSearchParams.code) {
      console.log('🔍 OAuth callback detected in dashboard, code:', resolvedSearchParams.code)
      // Let the client-side handle the session exchange
      // Don't check server-side auth immediately for OAuth callbacks
      return <DashboardView searchParams={resolvedSearchParams} />
    }
    
    if (resolvedSearchParams.error) {
      console.error('🔍 OAuth error in dashboard:', resolvedSearchParams.error)
      redirect("/")
    }

    const user = await getCurrentUserSimple()
    console.log('🔍 Dashboard user check:', user ? user.email : 'No user')
    
    if (!user) {
      console.log('🔍 Redirecting to home - no user')
      redirect("/")
    }

    console.log('🔍 Rendering DashboardView for user:', user.email)
    return <DashboardView searchParams={resolvedSearchParams} />
  } catch (error) {
    console.error('🔍 Dashboard page error:', error)
    redirect("/")
  }
}