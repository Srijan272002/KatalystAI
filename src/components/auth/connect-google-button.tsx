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

  const handleClick = async () => {
    try {
      setLoading(true)
      await signIn("google", { callbackUrl: "/dashboard", redirect: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size={size} className={className} onClick={handleClick} disabled={loading}>
      {loading ? "Connecting..." : label}
    </Button>
  )
}


