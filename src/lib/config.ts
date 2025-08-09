import { validateEnv } from './utils/validation'

// Validate environment variables on module load with graceful fallback
let validatedEnv: ReturnType<typeof validateEnv>

try {
  validatedEnv = validateEnv()
} catch (error) {
  console.warn('Environment validation failed, using fallback values:', error)
  // Fallback configuration for development
  validatedEnv = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || undefined,
    GOOGLE_CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID || undefined,
    ENABLE_API_KEY_FALLBACK: process.env.ENABLE_API_KEY_FALLBACK || undefined,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
    NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test' | undefined,
  }
}

export const config = {
  google: {
    clientId: validatedEnv.GOOGLE_CLIENT_ID,
    clientSecret: validatedEnv.GOOGLE_CLIENT_SECRET,
    apiKey: (validatedEnv as any).GOOGLE_API_KEY as string | undefined,
    calendarId: (validatedEnv as any).GOOGLE_CALENDAR_ID as string | undefined,
    enableApiKeyFallback: ((validatedEnv as any).ENABLE_API_KEY_FALLBACK || '').toLowerCase() === 'true',
  },
  supabase: {
    url: validatedEnv.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: validatedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: validatedEnv.SUPABASE_SERVICE_ROLE_KEY,
  },
  nextAuth: {
    url: validatedEnv.NEXTAUTH_URL || 'http://localhost:3000',
    secret: validatedEnv.NEXTAUTH_SECRET,
  },
  app: {
    isDevelopment: validatedEnv.NODE_ENV === 'development',
    isProduction: validatedEnv.NODE_ENV === 'production',
  },
}
