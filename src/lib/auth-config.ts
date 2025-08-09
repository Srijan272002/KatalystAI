import type { NextAuthConfig } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { config } from "./config"

async function refreshGoogleAccessToken(token: any) {
  try {
    if (!token?.refreshToken) return token
    const params = new URLSearchParams({
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken as string,
    })

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    })

    const refreshed = await res.json()
    if (!res.ok) {
      throw new Error(refreshed.error || "Failed to refresh token")
    }

    const nowInSeconds = Math.floor(Date.now() / 1000)
    return {
      ...token,
      accessToken: refreshed.access_token ?? token.accessToken,
      expiresAt: refreshed.expires_in ? nowInSeconds + Number(refreshed.expires_in) : token.expiresAt,
      // Google's refresh may not return a new refresh_token; keep the old one
      refreshToken: token.refreshToken,
    }
  } catch (e) {
    console.error("Error refreshing Google access token:", e)
    return { ...token, error: "RefreshAccessTokenError" }
  }
}

export const authConfig: NextAuthConfig = {
  secret: config.nextAuth.secret,
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: config.google.clientId,
      clientSecret: config.google.clientSecret,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `${config.app.isProduction ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: config.app.isProduction,
      },
    },
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // First time sign in - store user info and tokens
      if (account && user) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
        token.provider = account.provider
        token.userId = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      // Refresh access token if expired or near expiry (within 60s)
      const nowInSeconds = Math.floor(Date.now() / 1000)
      const expiresAt = typeof token.expiresAt === 'number' ? token.expiresAt : Number(token.expiresAt || 0)
      if (expiresAt && nowInSeconds < expiresAt - 60) {
        return token
      }
      // Attempt refresh when we have a refresh token
      if (token.refreshToken) {
        return await refreshGoogleAccessToken(token)
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client (excluding sensitive refresh token)
      return {
        ...session,
        accessToken: token.accessToken as string,
        user: {
          ...session.user,
          id: token.userId as string,
        }
      }
    },
    async signIn({ user, account, profile }) {
      // Enhanced security checks with better error handling
      try {
        // Always allow sign in if we have valid user data
        if (!user?.email) {
          console.error('Sign in failed: No user email provided')
          return false
        }

        if (account?.provider === "google") {
          // For Google, we prefer verified emails but don't strictly require it in development
          const emailVerified = profile?.email_verified ?? true // Default to true if not provided
          
          if (!emailVerified && config.app.isProduction) {
            console.error('Sign in failed: Email not verified in production', { email: user.email })
            return false
          }
          
          console.log('Google sign in successful', { 
            email: user.email, 
            verified: emailVerified 
          })
          return true
        }
        
        // Allow other providers
        return true
      } catch (error) {
        console.error('Sign in callback error:', error)
        // In development, be more permissive
        if (config.app.isDevelopment) {
          console.warn('Allowing sign in despite error in development mode')
          return true
        }
        return false
      }
    },
  },
  events: {
    async signIn({ user, account }) {
      console.log(`User signed in: ${user.email} via ${account?.provider}`)
    },
    async signOut() {
      console.log(`User signed out`)
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: config.app.isDevelopment,
}
