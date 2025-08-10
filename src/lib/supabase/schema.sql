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
  response_status TEXT DEFAULT 'needsAction' CHECK (response_status IN ('accepted', 'declined', 'tentative', 'needsAction')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_calendar_connections table
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON public.meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON public.meetings(start_time);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_meeting_id ON public.meeting_attendees(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_email ON public.meeting_attendees(email);
CREATE INDEX IF NOT EXISTS idx_user_calendar_connections_user_id ON public.user_calendar_connections(user_id);

-- Enable RLS on all tables
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_calendar_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meetings table
CREATE POLICY "Users can view their own meetings" ON public.meetings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meetings" ON public.meetings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meetings" ON public.meetings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meetings" ON public.meetings
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for meeting_attendees table
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

CREATE POLICY "Users can update attendees of their meetings" ON public.meeting_attendees
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE meetings.id = meeting_attendees.meeting_id 
      AND meetings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete attendees of their meetings" ON public.meeting_attendees
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE meetings.id = meeting_attendees.meeting_id 
      AND meetings.user_id = auth.uid()
    )
  );

-- RLS Policies for user_calendar_connections table
CREATE POLICY "Users can view their own calendar connections" ON public.user_calendar_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar connections" ON public.user_calendar_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar connections" ON public.user_calendar_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar connections" ON public.user_calendar_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_meetings_updated_at 
  BEFORE UPDATE ON public.meetings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_calendar_connections_updated_at 
  BEFORE UPDATE ON public.user_calendar_connections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get meetings with attendees
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
  attendees JSON
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
      json_agg(
        json_build_object(
          'email', ma.email,
          'name', ma.name,
          'responseStatus', ma.response_status
        )
      ) FILTER (WHERE ma.id IS NOT NULL),
      '[]'::json
    ) as attendees
  FROM public.meetings m
  LEFT JOIN public.meeting_attendees ma ON m.id = ma.meeting_id
  WHERE m.user_id = p_user_id
    AND (p_start_time IS NULL OR m.start_time >= p_start_time)
    AND (p_end_time IS NULL OR m.end_time <= p_end_time)
  GROUP BY m.id, m.title, m.description, m.start_time, m.end_time, 
           m.duration_minutes, m.location, m.meeting_url, 
           m.organizer_email, m.organizer_name
  ORDER BY m.start_time DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
