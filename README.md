# Google Calendar MCP Web App

A modern web application that integrates Google Calendar using the Model Context Protocol (MCP), providing a seamless interface to view and manage meetings with AI-powered summaries.

## 🚀 Features

- **Google Calendar Integration**: Fetch upcoming and past meetings using MCP
- **AI-Powered Summaries**: Generate intelligent meeting summaries using Google Gemini
- **Modern UI**: Beautiful, responsive interface built with React, TypeScript, and Tailwind CSS
- **Real-time Authentication**: Google OAuth integration with Supabase Auth
- **Smart Caching**: Efficient data caching with Supabase PostgreSQL
- **Meeting Analytics**: Visual insights into meeting patterns and attendance
- **Search & Filter**: Advanced search and filtering capabilities
- **Export Functionality**: Export meeting data for external use

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Calendar Integration**: GongRzhe Calendar MCP Server
- **AI Integration**: Google Gemini API
- **Authentication**: Supabase Auth with Google OAuth
- **Deployment**: Vercel-ready

### MCP (Model Context Protocol) Integration

This application leverages MCP to provide seamless access to Google Calendar data:

#### MCP Server: GongRzhe Calendar MCP
- **Package**: `@gongrzhe/server-calendar-mcp`
- **Purpose**: Provides standardized access to Google Calendar API
- **Benefits**: 
  - Unified interface for calendar operations
  - Automatic token management and refresh
  - Type-safe calendar data access
  - Simplified integration with AI models

#### MCP Client Implementation
The backend uses the MCP SDK to communicate with the calendar server:

```typescript
// MCP Client for Calendar Operations
export class McpCalendarClient {
  async listEvents(args: McpCalendarListArgs): Promise<JsonObject[]>
  async getEvent(eventId: string): Promise<JsonObject | null>
  async createEvent(eventData: JsonObject): Promise<JsonObject>
  async updateEvent(eventId: string, eventData: JsonObject): Promise<JsonObject>
  async deleteEvent(eventId: string): Promise<void>
}
```

#### Key MCP Features Used
- **Calendar List**: Fetch upcoming and past meetings
- **Event Management**: Create, read, update, delete events
- **Attendee Management**: Handle meeting participants
- **Time Zone Support**: Proper timezone handling
- **OAuth Integration**: Seamless Google authentication

## 📁 Project Structure

```
mcp/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── services/
│   │   │   ├── mcpClient.ts        # MCP Calendar client
│   │   │   ├── geminiService.ts    # AI summary generation
│   │   │   ├── supabaseService.ts  # Database operations
│   │   │   └── userCalendarService.ts
│   │   ├── routes/
│   │   │   ├── meetings.ts         # Meeting API endpoints
│   │   │   └── auth.ts            # Authentication routes
│   │   └── middleware/
│   │       └── auth.ts            # JWT authentication
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── MeetingCard.tsx     # Individual meeting display
│   │   │   ├── MeetingSearch.tsx   # Search functionality
│   │   │   ├── MeetingAnalytics.tsx # Analytics dashboard
│   │   │   └── ProtectedRoute.tsx  # Route protection
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx       # Main dashboard
│   │   │   ├── LandingPage.tsx     # Landing page
│   │   │   └── MeetingDetail.tsx   # Meeting details
│   │   ├── services/
│   │   │   ├── api.ts             # API client
│   │   │   └── supabase.ts        # Supabase client
│   │   └── contexts/
│   │       └── AuthContext.tsx    # Authentication state
│   └── package.json
├── database-schema.sql     # Supabase database schema
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Google Cloud Platform account
- Supabase account
- Google Gemini API key

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd mcp

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Google Cloud Platform Setup

1. Create a new project in Google Cloud Console
2. Enable Google Calendar API
3. Create OAuth 2.0 credentials
4. Download the credentials JSON file

### 3. Environment Configuration

#### Backend (.env)
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token

# MCP Calendar Server
MCP_CALENDAR_COMMAND=node
MCP_CALENDAR_ARGS=./node_modules/@gongrzhe/server-calendar-mcp/build/index.js

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup

1. Create a new Supabase project
2. Run the database schema in Supabase SQL editor:

```sql
-- Execute database-schema.sql in Supabase SQL editor
```

### 5. Start Development Servers

```bash
# Start backend server
cd backend
npm run dev

# Start frontend server (in new terminal)
cd frontend
npm start
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Meetings
- `GET /api/meetings/upcoming` - Fetch upcoming meetings
- `GET /api/meetings/past` - Fetch past meetings
- `GET /api/meetings/:id` - Get specific meeting details
- `POST /api/meetings/sync` - Sync with Google Calendar
- `POST /api/meetings/:id/summary` - Generate AI summary

## 🎯 Key Features Implementation

### 1. MCP Calendar Integration

The application uses the GongRzhe Calendar MCP Server to provide a standardized interface for Google Calendar operations:

```typescript
// Example: Fetching upcoming meetings via MCP
const upcomingMeetings = await mcpClient.listEvents({
  timeMin: new Date().toISOString(),
  timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  maxResults: 5,
  orderBy: 'startTime'
});
```

### 2. AI-Powered Meeting Summaries

Integration with Google Gemini API for intelligent meeting analysis:

```typescript
// Generate meeting summary using Gemini
const summary = await geminiService.generateSummary({
  title: meeting.title,
  description: meeting.description,
  attendees: meeting.attendees,
  duration: meeting.duration_minutes
});
```

### 3. Real-time Authentication

Supabase Auth with Google OAuth for seamless user authentication:

```typescript
// Google OAuth sign-in
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/dashboard`
  }
});
```

### 4. Smart Data Caching

Efficient caching strategy using Supabase:

- Cache meeting data for faster loading
- Sync with Google Calendar every 15 minutes
- Store AI-generated summaries
- Real-time updates via Supabase subscriptions

## 🚀 Deployment

### Vercel Deployment

1. **Backend Deployment**:
   ```bash
   cd backend
   vercel --prod
   ```

2. **Frontend Deployment**:
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Environment Variables**: Configure all environment variables in Vercel dashboard

### Production Considerations

- Set up proper CORS configuration
- Configure Google OAuth redirect URIs
- Set up Supabase production database
- Configure MCP server for production

## 🔍 Usage Examples

### Viewing Meetings
1. Navigate to the dashboard
2. Switch between "Upcoming" and "Past" tabs
3. Click on any meeting for detailed view

### Generating AI Summaries
1. Open a past meeting
2. Click "Generate Summary" button
3. View AI-generated insights and action items

### Searching Meetings
1. Use the search bar in the dashboard
2. Filter by date range
3. Export results if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [GongRzhe Calendar MCP Server](https://github.com/gongrzhe/server-calendar-mcp) for MCP integration
- [Supabase](https://supabase.com) for backend-as-a-service
- [Google Gemini](https://ai.google.dev/) for AI capabilities
- [Tailwind CSS](https://tailwindcss.com) for styling

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting guide
- Review the MCP documentation

---

**Built with ❤️ using MCP (Model Context Protocol) for seamless AI integration**

