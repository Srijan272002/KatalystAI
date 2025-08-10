"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

interface ConnectGoogleButtonProps {
  size?: "default" | "sm" | "lg"
  className?: string
  label?: string
}

export function ConnectGoogleButton({ size = "lg", className, label = "Connect with Google Calendar" }: ConnectGoogleButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Direct authentication with Google
      await signIn("google", { 
        callbackUrl: "/dashboard",
        redirect: true, // We want immediate redirect to Google
        prompt: "select_account consent", // Always show account selection
        scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly"
      })
      
      // This code won't run because we're redirecting
      // Error handling will be done by the error page
      
    } catch (err) {
      // This will only catch client-side errors before redirect
      console.error("Failed to initiate authentication:", err)
      setError("Unable to start authentication. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button 
        size={size} 
        className={className} 
        onClick={handleClick} 
        disabled={loading}
      >
        <div className="flex items-center gap-2">
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          )}
          {loading ? "Connecting..." : label}
        </div>
      </Button>
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  )
}


