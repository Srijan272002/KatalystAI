import type { JWT } from "next-auth/jwt"
import { config } from "../config"
import { logger } from "../utils/logger"

interface RefreshTokenResponse {
  access_token: string
  expires_in: number
  scope: string
  token_type: string
}

interface TokenWithError extends JWT {
  error?: string
  errorDescription?: string
}

export async function refreshGoogleAccessToken(token: JWT): Promise<TokenWithError> {
  try {
    if (!token?.refreshToken) {
      return { ...token, error: "NO_REFRESH_TOKEN" }
    }

    const params = new URLSearchParams({
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken as string,
    })

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      cache: "no-store",
    })

    const data = await response.json() as RefreshTokenResponse

    if (!response.ok) {
      throw new Error(data.access_token || "Failed to refresh token")
    }

    // Calculate new expiry time
    const nowInSeconds = Math.floor(Date.now() / 1000)
    const expiresAt = nowInSeconds + data.expires_in

    return {
      ...token,
      accessToken: data.access_token,
      expiresAt,
      error: undefined,
      errorDescription: undefined,
    }
  } catch (error) {
    logger.tokenError(
      "refresh",
      error as Error,
      token.email as string || "unknown",
      { tokenId: token.id }
    )

    return {
      ...token,
      error: "REFRESH_TOKEN_ERROR",
      errorDescription: error instanceof Error ? error.message : "Unknown error",
    }
  }
}