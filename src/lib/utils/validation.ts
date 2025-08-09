import { z } from "zod"

// Environment validation schema
export const envSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  // Optional API key fallback for public calendars
  GOOGLE_API_KEY: z.string().optional(),
  GOOGLE_CALENDAR_ID: z.string().optional(),
  ENABLE_API_KEY_FALLBACK: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1),
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
})

// API request validation schemas
export const calendarConnectionSchema = z.object({
  userId: z.string().email(),
  redirectUrl: z.string().url().optional(),
})

export const calendarActionSchema = z.object({
  action: z.string(),
  parameters: z.record(z.any()).optional(),
})

// Response validation schemas
export const meetingSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  duration: z.number(),
  attendees: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
    responseStatus: z.enum(["accepted", "declined", "tentative", "needsAction"]).optional(),
  })),
  organizer: z.object({
    email: z.string().email(),
    name: z.string().optional(),
  }),
  location: z.string().optional(),
  meetingUrl: z.string().url().optional(),
})

export const calendarDataSchema = z.object({
  upcomingMeetings: z.array(meetingSchema),
  pastMeetings: z.array(meetingSchema),
  lastUpdated: z.string(),
  hasConnection: z.boolean().optional(),
})

// Utility functions for validation
export function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.'))
      throw new Error(`Missing or invalid environment variables: ${missingVars.join(', ')}`)
    }
    throw error
  }
}

export function sanitizeInput(input: string): string {
  // Basic input sanitization
  return input
    .trim()
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
    .slice(0, 1000) // Limit length
}

export function isValidEmail(email: string): boolean {
  return z.string().email().safeParse(email).success
}

export function isValidUrl(url: string): boolean {
  return z.string().url().safeParse(url).success
}
