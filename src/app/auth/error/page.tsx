"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"

export default function AuthError() {
  const searchParams = useSearchParams()
  const { addToast } = useToast()
  const error = searchParams.get("error")

  useEffect(() => {
    const errorMessage = getErrorMessage(error)
    addToast(errorMessage, "error")
  }, [error, addToast])

  const getErrorMessage = (error: string | null): string => {
    switch (error) {
      case "Configuration":
        return "There is a problem with the server configuration. Please try again later."
      case "AccessDenied":
        return "Access was denied. Please ensure you grant all required permissions."
      case "Verification":
        return "The verification link has expired or has already been used."
      case "OAuthSignin":
        return "Error occurred during sign in attempt. Please try again."
      case "OAuthCallback":
        return "Error received from OAuth provider."
      case "OAuthCreateAccount":
        return "Could not create OAuth provider account."
      case "EmailCreateAccount":
        return "Could not create email provider account."
      case "Callback":
        return "Error occurred during callback processing."
      case "OAuthAccountNotLinked":
        return "Email already exists with different provider."
      case "EmailSignin":
        return "Check your email address."
      case "CredentialsSignin":
        return "Sign in failed. Check the details you provided are correct."
      case "SessionRequired":
        return "Please sign in to access this page."
      default:
        return "An unexpected error occurred. Please try again."
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="text-2xl font-bold">Authentication Error</h2>
          <p className="mt-2 text-muted-foreground">
            {getErrorMessage(error)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Please contact support if this issue persists.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Button
            onClick={() => window.location.href = "/"}
            variant="outline"
            className="w-full"
          >
            Return to Home
          </Button>
          <Button
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}