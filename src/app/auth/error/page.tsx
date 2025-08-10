import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-destructive">
            Authentication Error
          </h1>
          <p className="text-muted-foreground">
            {error === "Configuration" && "There is a problem with the server configuration."}
            {error === "AccessDenied" && "You do not have permission to sign in."}
            {error === "Verification" && "The verification token has expired or is invalid."}
            {error === "SIGNIN_EMAIL_REQUIRED" && "Email is required to sign in."}
            {error === "SIGNIN_EMAIL_NOT_VERIFIED" && "Please verify your email address before signing in."}
            {error === "SIGNIN_MISSING_SCOPES" && "Additional permissions are required. Please try signing in again."}
            {error === "RefreshAccessTokenError" && "Your session has expired. Please sign in again."}
            {!error && "An unknown error occurred during authentication."}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {error === "Configuration" 
              ? "Please contact support if this issue persists."
              : "Please try signing in again. If the problem continues, contact support."}
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <Link href="/">
            <Button className="w-full">Try Again</Button>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
