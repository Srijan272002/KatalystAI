"use client"

import { useSimpleAuth, signOutSimple } from "@/lib/auth/simple-auth"
import { Button } from "@/components/ui/button"
import { User, LogOut, Loader2 } from "lucide-react"

export function SimpleAuthStatus() {
  const { user, isAuthenticated, loading } = useSimpleAuth()

  const handleSignOut = async () => {
    try {
      await signOutSimple()
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </div>
    )
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <User className="h-4 w-4 text-gray-600" />
          <span className="hidden sm:inline font-medium">{user.email}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span>Not signed in</span>
    </div>
  )
}
