import type { NextAuthConfig, Session } from "next-auth"
import type { AdapterSession } from "@auth/core/adapters"
import type { JWT } from "next-auth/jwt"
import GoogleProvider from "next-auth/providers/google"
import { config } from "./config"
import { logger } from "./utils/logger"

async function refreshGoogleAccessToken(token: any) {
  try {
    // Validate token structure
    if (!token) {
      logger.tokenError("refresh", new Error("No token provided"));
      return { error: "InvalidTokenError" };
    }

    if (!token.refreshToken) {
      logger.tokenError("refresh", new Error("No refresh token available"), token.userId as string);
      return { ...token, error: "NoRefreshTokenError" };
    }

    // Prepare request parameters
    const params = new URLSearchParams({
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken as string,
    });

    // Attempt token refresh with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json"
        },
        body: params.toString(),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const refreshed = await res.json();

      // Handle HTTP errors
      if (!res.ok) {
        logger.tokenError("refresh", new Error(refreshed.error || "RefreshTokenError"), token.userId as string, {
          statusCode: res.status,
          errorDescription: refreshed.error_description
        });
        return { 
          ...token, 
          error: refreshed.error || "RefreshTokenError",
          errorDescription: refreshed.error_description
        };
      }

      // Validate response data
      if (!refreshed.access_token) {
        logger.tokenError("refresh", new Error("Invalid response: missing access_token"), token.userId as string, {
          responseData: refreshed
        });
        return { ...token, error: "InvalidResponseError" };
      }

      const nowInSeconds = Math.floor(Date.now() / 1000);
      
      // Return refreshed token
      return {
        ...token,
        accessToken: refreshed.access_token,
        expiresAt: refreshed.expires_in ? nowInSeconds + Number(refreshed.expires_in) : token.expiresAt,
        refreshToken: token.refreshToken, // Preserve existing refresh token
        error: undefined, // Clear any previous errors
        errorDescription: undefined
      };
    } catch (err) {
      clearTimeout(timeoutId);
      const fetchError = err as Error;
      if (fetchError.name === "AbortError") {
        console.error("Token refresh timeout");
        return { ...token, error: "RefreshTimeoutError" };
      }
      throw fetchError; // Re-throw other fetch errors
    }
  } catch (err) {
    // Log the error with context
    const error = err as Error;
    console.error("Token refresh error:", {
      error: error.message,
      tokenId: token?.id,
      errorType: error.name,
      stack: error.stack
    });

    // Return token with error info
    return { 
      ...token, 
      error: "RefreshAccessTokenError",
      errorDescription: error.message
    };
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
        // Validate user data
        if (!user?.email) {
          logger.authError('signin', new Error('SIGNIN_EMAIL_REQUIRED'), undefined, {
            provider: account?.provider
          });
          throw new Error('SIGNIN_EMAIL_REQUIRED')
        }

        if (!user?.name) {
          logger.authEvent('signin_warning', {
            message: 'No user name provided',
            email: user.email,
            provider: account?.provider
          });
        }

        if (account?.provider === "google") {
          // Validate Google-specific requirements
          const emailVerified = profile?.email_verified ?? false // Default to false for security
          
          if (!emailVerified) {
            if (config.app.isProduction) {
              logger.authError('signin', new Error('SIGNIN_EMAIL_NOT_VERIFIED'), user.email, {
                provider: account.provider,
                email: user.email
              });
              throw new Error('SIGNIN_EMAIL_NOT_VERIFIED')
            } else {
              logger.authEvent('signin_warning', {
                message: 'Unverified email allowed in development',
                email: user.email,
                provider: account.provider
              });
            }
          }

          // Validate required Google scopes
          const requiredScopes = ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/calendar.readonly']
          const missingScopes = requiredScopes.filter(scope => !account.scope?.includes(scope))
          
          if (missingScopes.length > 0) {
            logger.authError('signin', new Error('SIGNIN_MISSING_SCOPES'), user.email, {
              provider: account.provider,
              missingScopes
            });
            throw new Error('SIGNIN_MISSING_SCOPES')
          }
          
          // Log successful sign in
          logger.authEvent('signin_success', {
            provider: account.provider,
            email: user.email,
            name: user.name,
            verified: emailVerified,
            scopes: account.scope
          }, user.email);
          
          return true
        }
        
        // For non-Google providers (if added in future)
        logger.authEvent('signin_warning', {
          message: 'Non-Google provider used',
          provider: account?.provider,
          email: user.email
        });
        return false

      } catch (err) {
        // Enhanced error logging
        const error = err as Error;
        logger.authError('signin', error, user?.email || undefined, {
          provider: account?.provider,
          isDevelopment: config.app.isDevelopment
        });

        // In development, allow sign in for testing
        if (config.app.isDevelopment && error.message !== 'SIGNIN_EMAIL_REQUIRED') {
          logger.authEvent('signin_warning', {
            message: 'Allowing sign in despite error in development mode',
            error: error.message,
            email: user?.email,
            provider: account?.provider
          });
          return true
        }

        return false
      }
    },
  },
  events: {
    async signIn({ user, account }) {
      logger.authEvent('signin_event', {
        provider: account?.provider,
        email: user.email
      }, user.email || undefined);
    },
    async signOut(message: { session: void | AdapterSession | null | undefined } | { token: JWT | null }) {
      let email: string | undefined;
      
      if ('session' in message && message.session) {
        // Handle both Session and AdapterSession types
        email = (message.session as any)?.user?.email;
      }

      logger.authEvent('signout_event', {
        email
      }, email || undefined);
    },
  },
  pages: {
    error: "/auth/error",
    signIn: "/", // Redirect all sign-in attempts to home page
  },
  debug: config.app.isDevelopment && process.env.NEXTAUTH_DEBUG?.toLowerCase() === 'true',
}
