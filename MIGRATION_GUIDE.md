# Migration to Supabase - Complete Guide

## Overview

This migration replaces the NextAuth + Google Calendar API approach with a complete Supabase solution that provides:

1. **Better Data Isolation**: Row-Level Security (RLS) ensures users can only access their own data
2. **Centralized Authentication**: Supabase Auth with Google OAuth
3. **Proper Data Storage**: All meeting data stored in Supabase with proper relationships
4. **Real-time Capabilities**: Built-in real-time subscriptions
5. **Better Security**: No more cross-account data leakage

## Key Changes Made

### 1. Authentication System
- **Removed**: NextAuth.js configuration and providers
- **Added**: Supabase Auth with Google OAuth integration
- **Files Changed**:
  - `src/lib/auth/` → `src/lib/supabase/auth.ts`
  - `src/components/providers/session-provider.tsx` → `src/components/providers/supabase-provider.tsx`
  - `src/middleware.ts` (updated for Supabase)

### 2. Data Layer
- **Removed**: Direct Google Calendar API calls with flawed filtering
- **Added**: Supabase database with proper RLS policies
- **Files Changed**:
  - `src/lib/api/calendar.ts` → `src/lib/supabase/calendar.ts`
  - `src/lib/services/google-calendar.ts` (replaced with Supabase service)
  - `src/app/api/calendar/route.ts` (updated to use Supabase)

### 3. Database Schema
- **Added**: Complete database schema with RLS policies
- **File**: `src/lib/supabase/schema.sql`

### 4. Type Safety
- **Added**: Comprehensive TypeScript types for Supabase
- **File**: `src/lib/supabase/types.ts`

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key

### 2. Configure Environment Variables

Update your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth (for Supabase)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
NODE_ENV=development
```

### 3. Set Up Google OAuth in Supabase

1. In your Supabase dashboard, go to Authentication → Providers
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID: Your Google OAuth client ID
   - Client Secret: Your Google OAuth client secret
4. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`

### 4. Set Up Database Schema

1. In your Supabase dashboard, go to SQL Editor
2. Copy and paste the contents of `src/lib/supabase/schema.sql`
3. Run the SQL to create all tables, indexes, and RLS policies

### 5. Configure Google OAuth Scopes

In your Google Cloud Console:
1. Go to APIs & Services → Credentials
2. Edit your OAuth 2.0 client
3. Add the following scopes:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/calendar.readonly`

### 6. Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/auth-helpers-react
```

## Key Features of the New System

### 1. Data Isolation
- **RLS Policies**: Users can only access their own meetings
- **User-Specific Data**: All data is tied to the authenticated user's ID
- **No Cross-Account Leakage**: The previous issue where users could see other accounts' meetings is completely resolved

### 2. Improved Data Structure
```sql
-- Users can only see their own meetings
CREATE POLICY "Users can view their own meetings" ON public.meetings
  FOR SELECT USING (auth.uid() = user_id);

-- Only organizers can see their meetings (not attendees)
-- This prevents the cross-account data leakage issue
```

### 3. Better Authentication Flow
- **Supabase Auth**: More reliable session management
- **Google OAuth**: Seamless integration with proper token handling
- **Automatic Token Refresh**: Handled by Supabase

### 4. Real-time Capabilities
- **Built-in Subscriptions**: Can easily add real-time updates
- **WebSocket Support**: Automatic connection management

## Migration Benefits

### 1. Security
- ✅ **No more cross-account data leakage**
- ✅ **Row-Level Security (RLS)**
- ✅ **Proper user isolation**
- ✅ **Secure token management**

### 2. Performance
- ✅ **Cached data in Supabase**
- ✅ **Reduced API calls to Google**
- ✅ **Better query optimization**

### 3. Scalability
- ✅ **Database-backed storage**
- ✅ **Real-time capabilities**
- ✅ **Better data relationships**

### 4. Developer Experience
- ✅ **Type-safe database operations**
- ✅ **Better error handling**
- ✅ **Simplified authentication flow**

## Testing the Migration

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test authentication**:
   - Visit `http://localhost:3000`
   - Click "Login with Google Calendar"
   - Verify you're redirected to the dashboard

3. **Test data isolation**:
   - Log in with one Google account
   - Verify you only see your own meetings
   - Log out and log in with a different account
   - Verify you only see the new account's meetings

4. **Test calendar sync**:
   - Create a meeting in Google Calendar
   - Refresh the dashboard
   - Verify the meeting appears

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Check Google OAuth configuration in Supabase
   - Verify redirect URIs are correct
   - Check environment variables

2. **Database Errors**:
   - Ensure schema.sql has been executed
   - Check RLS policies are active
   - Verify service role key has proper permissions

3. **Calendar Sync Issues**:
   - Check Google Calendar API permissions
   - Verify access token is being retrieved
   - Check Supabase logs for errors

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## Rollback Plan

If you need to rollback to the previous system:

1. **Revert code changes**:
   ```bash
   git checkout HEAD~1 -- src/
   ```

2. **Restore NextAuth configuration**:
   - Re-enable NextAuth in `package.json`
   - Restore environment variables

3. **Remove Supabase dependencies**:
   ```bash
   npm uninstall @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/auth-helpers-react
   ```

## Support

For issues with this migration:
1. Check the Supabase documentation
2. Review the error logs in your Supabase dashboard
3. Verify all environment variables are correctly set
4. Test with a fresh Supabase project if needed
