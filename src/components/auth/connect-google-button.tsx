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
      const result = await signIn("google", { 
        callbackUrl: "/dashboard",
        redirect: false // Handle redirect manually to catch errors
      })

      if (result?.error) {
        console.error("Authentication error:", result.error)
        setError("Failed to connect. Please try again.")
      } else if (result?.url) {
        // Successful auth, redirect
        window.location.href = result.url
      }
    } catch (err) {
      console.error("Unexpected error during authentication:", err)
      setError("An unexpected error occurred. Please try again.")
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


