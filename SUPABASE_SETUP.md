# Complete Supabase Migration Setup Guide

## Overview

This guide will help you set up the complete Supabase authentication system for the Katalyst Calendar app. We've completely removed NextAuth and now use only Supabase for authentication and data storage.

## Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Google Cloud Console**: Set up OAuth credentials for Google Calendar access
3. **Node.js**: Version 18 or higher

## Step 1: Supabase Project Setup

### 1.1 Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `katalyst-calendar`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 1.2 Configure Authentication

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Google** provider:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
   - **Redirect URL**: `https://your-project-ref.supabase.co/auth/v1/callback`
3. Save the configuration

### 1.3 Set Up Database Schema

Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create meetings table
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  location TEXT,
  meeting_url TEXT,
  organizer_email TEXT NOT NULL,
  organizer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create attendees table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.meeting_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  response_status TEXT DEFAULT 'needsAction' CHECK (response_status IN ('needsAction', 'accepted', 'declined', 'tentative')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user calendar connections table
CREATE TABLE IF NOT EXISTS public.user_calendar_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL DEFAULT 'google',
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  calendar_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON public.meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON public.meetings(start_time);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_meeting_id ON public.meeting_attendees(meeting_id);
CREATE INDEX IF NOT EXISTS idx_user_calendar_connections_user_id ON public.user_calendar_connections(user_id);

-- Enable RLS on all tables
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_calendar_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meetings
CREATE POLICY "Users can view their own meetings" ON public.meetings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meetings" ON public.meetings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meetings" ON public.meetings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meetings" ON public.meetings
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for meeting attendees
CREATE POLICY "Users can view attendees of their meetings" ON public.meeting_attendees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE meetings.id = meeting_attendees.meeting_id 
      AND meetings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert attendees for their meetings" ON public.meeting_attendees
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE meetings.id = meeting_attendees.meeting_id 
      AND meetings.user_id = auth.uid()
    )
  );

-- Create RLS policies for user calendar connections
CREATE POLICY "Users can view their own calendar connections" ON public.user_calendar_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar connections" ON public.user_calendar_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar connections" ON public.user_calendar_connections
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to get meetings with attendees
CREATE OR REPLACE FUNCTION get_user_meetings_with_attendees(
  p_user_id UUID,
  p_start_time TIMESTAMPTZ DEFAULT NULL,
  p_end_time TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  location TEXT,
  meeting_url TEXT,
  organizer_email TEXT,
  organizer_name TEXT,
  attendees JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.title,
    m.description,
    m.start_time,
    m.end_time,
    m.duration_minutes,
    m.location,
    m.meeting_url,
    m.organizer_email,
    m.organizer_name,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'email', ma.email,
          'name', ma.name,
          'response_status', ma.response_status
        )
      ) FILTER (WHERE ma.id IS NOT NULL),
      '[]'::jsonb
    ) as attendees
  FROM public.meetings m
  LEFT JOIN public.meeting_attendees ma ON m.id = ma.meeting_id
  WHERE m.user_id = p_user_id
    AND (p_start_time IS NULL OR m.start_time >= p_start_time)
    AND (p_end_time IS NULL OR m.end_time <= p_end_time)
  GROUP BY m.id, m.title, m.description, m.start_time, m.end_time, 
           m.duration_minutes, m.location, m.meeting_url, 
           m.organizer_email, m.organizer_name
  ORDER BY m.start_time
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Step 2: Google OAuth Setup

### 2.1 Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Calendar API
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **OAuth 2.0 Client IDs**
6. Configure OAuth consent screen:
   - **User Type**: External
   - **App name**: Katalyst Calendar
   - **User support email**: Your email
   - **Developer contact information**: Your email
7. Add scopes:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/calendar.readonly`
8. Add test users (your email addresses)
9. Create OAuth 2.0 Client ID:
   - **Application type**: Web application
   - **Name**: Katalyst Calendar Web Client
   - **Authorized redirect URIs**:
     - `http://localhost:3000/auth/callback`
     - `https://your-project-ref.supabase.co/auth/v1/callback`

### 2.2 Configure Supabase with Google OAuth

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Enter your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
4. Save the configuration

## Step 3: Environment Configuration

### 3.1 Get Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**
   - **Anon public key**
   - **Service role key** (keep this secret!)

### 3.2 Update Environment Variables

Create or update your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth (for Supabase)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Application Configuration
NODE_ENV=development
```

## Step 4: Install Dependencies

```bash
# Remove old NextAuth dependencies
npm uninstall next-auth @auth/supabase-adapter @supabase/auth-helpers-nextjs @supabase/auth-helpers-react

# Install Supabase dependencies
npm install @supabase/ssr @supabase/supabase-js

# Install other required dependencies
npm install googleapis
```

## Step 5: Run the Application

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

## Step 6: Test the Setup

1. Open your browser to `http://localhost:3000`
2. Click "Login with Google Calendar"
3. Complete the Google OAuth flow
4. You should be redirected to the dashboard
5. Check that your calendar data is loading correctly

## Troubleshooting

### Common Issues

1. **"Auth session missing" error**:
   - Ensure Supabase URL and keys are correct
   - Check that Google OAuth is properly configured in Supabase
   - Verify redirect URLs match between Google and Supabase

2. **Calendar data not loading**:
   - Check Google Calendar API is enabled
   - Verify OAuth scopes include calendar access
   - Check browser console for errors

3. **Database connection issues**:
   - Verify Supabase credentials
   - Check that RLS policies are correctly set up
   - Ensure database schema is created

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
```

Check the browser console and server logs for detailed error messages.

## Security Notes

1. **Never commit `.env.local`** to version control
2. **Keep service role key secret** - only use in server-side code
3. **Use RLS policies** to ensure data isolation between users
4. **Regularly rotate** OAuth credentials and API keys

## Next Steps

1. **Customize the UI** to match your brand
2. **Add more calendar providers** (Outlook, Apple Calendar)
3. **Implement real-time updates** using Supabase subscriptions
4. **Add meeting management features** (create, edit, delete)
5. **Set up monitoring and analytics**

## Support

If you encounter issues:

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Review the [Google Calendar API docs](https://developers.google.com/calendar)
3. Check the application logs for detailed error messages
4. Verify all environment variables are correctly set
