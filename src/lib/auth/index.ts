import NextAuth from "next-auth"
import { authConfig } from "./config"

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig)

// Re-export types
export type { Session } from "next-auth"
