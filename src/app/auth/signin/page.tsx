import { Suspense } from "react"
import { SignInForm } from "@/components/auth/signin-form"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Sign In</h1>
          <p className="text-muted-foreground">
            Connect your Google Calendar to get started
          </p>
        </div>
        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  )
}
