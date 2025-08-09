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
            {!error && "An unknown error occurred during authentication."}
          </p>
        </div>
        <Link href="/auth/signin">
          <Button>Try Again</Button>
        </Link>
      </div>
    </div>
  )
}
