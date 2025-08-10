import { NextAuthConfig } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { config } from "../config"
import { logger } from "../utils/logger"
import { refreshGoogleAccessToken } from "./token-refresh"
import type { JWT } from "next-auth/jwt"
import type { Session, Account, Profile } from "next-auth"
import type { AdapterSession } from "@auth/core/adapters"
import type { User } from "next-auth"

export const authConfig: NextAuthConfig = {
  secret: config.nextAuth.secret,
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: config.google.clientId,
      clientSecret: config.google.clientSecret,
      authorization: {
        url: "https://accounts.google.com/o/oauth2/v2/auth",
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      allowDangerousEmailAccountLinking: false,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  cookies: {
    sessionToken: {
      name: `${config.app.isProduction ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: config.app.isProduction,
      },
    },
    callbackUrl: {
      name: `${config.app.isProduction ? "__Secure-" : ""}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: config.app.isProduction,
      },
    },
    csrfToken: {
      name: `${config.app.isProduction ? "__Host-" : ""}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: config.app.isProduction,
      },
    },
  },
  callbacks: {
    async jwt({ token, account, user, trigger, session }) {
      // Initial sign in
      if (account && user) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
        token.provider = account.provider
        token.userId = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
        
        if (user.email) {
          logger.tokenEvent("token_created", user.email, {
            provider: account.provider,
            expiresAt: account.expires_at,
          })
        }
        
        return token
      }

      // Handle session update
      if (trigger === "update" && session) {
        return { ...token, ...session }
      }

      // Return existing token if not expired
      const nowInSeconds = Math.floor(Date.now() / 1000)
      const expiresAt = typeof token.expiresAt === "number" ? token.expiresAt : Number(token.expiresAt || 0)
      
      if (expiresAt && nowInSeconds < expiresAt - 60) {
        return token
      }

      // Attempt token refresh
      if (token.refreshToken) {
        const refreshedToken = await refreshGoogleAccessToken(token)
        
        if (refreshedToken.error) {
          logger.tokenError("refresh_failed", new Error(refreshedToken.error), token.email as string)
        } else {
          logger.tokenEvent("token_refreshed", token.email as string)
        }
        
        return refreshedToken
      }

      return token
    },

    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken as string,
        error: token.error,
        user: {
          ...session.user,
          id: token.userId as string,
        },
      }
    },

    async signIn({ user, account, profile }) {
      try {
        // Validate user data
        if (!user?.email) {
          throw new Error("SIGNIN_EMAIL_REQUIRED")
        }

        if (account?.provider === "google") {
          // Validate email verification
          const emailVerified = profile?.email_verified ?? false
          
          if (!emailVerified && config.app.isProduction) {
            throw new Error("SIGNIN_EMAIL_NOT_VERIFIED")
          }

          // Validate required scopes
          const requiredScopes = [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.readonly"
          ]
          
          const missingScopes = requiredScopes.filter(
            scope => !account.scope?.includes(scope)
          )
          
          if (missingScopes.length > 0) {
            throw new Error("SIGNIN_MISSING_SCOPES")
          }

          // Log successful sign in
          logger.authEvent("signin_success", {
            provider: account.provider,
            email: user.email,
            name: user.name,
            verified: emailVerified,
            scopes: account.scope,
          })

          return true
        }

        return false
      } catch (error) {
        logger.authError("signin", error as Error, user?.email || undefined)
        
        if (config.app.isDevelopment && (error as Error).message !== "SIGNIN_EMAIL_REQUIRED") {
          logger.authEvent("signin_warning", {
            message: "Allowing sign in despite error in development",
            error: (error as Error).message,
            email: user?.email,
          })
          return true
        }

        return false
      }
    },
  },

  events: {
    async signIn({ user, account }) {
      if (user?.email) {
        logger.authEvent("signin", {
          provider: account?.provider,
          email: user.email,
        }, user.email)
      }
    },
    
    async signOut(message) {
      let email: string | undefined
      
      if ('session' in message && message.session) {
        email = (message.session as any)?.user?.email
      } else if ('token' in message && message.token) {
        email = message.token.email as string | undefined
      }
      
      if (email) {
        logger.authEvent("signout", { email }, email)
      }
    },
  },

  pages: {
    signIn: "/",
    error: "/auth/error",
  },
}
