Got it — here’s the final README with an extra section that includes an example `.env` for the MCP server so people can run everything without having to check the MCP repo.

---

# Katalyst Calendar

A modern, real-time calendar integration built with Next.js 14 and the [open-source Google Calendar MCP](https://github.com/MCP-Mirror/GongRzhe_Calendar-MCP-Server). View your upcoming and past meetings with a beautiful, responsive interface.

## Features

* 🔄 Real-time calendar synchronization
* 📅 View upcoming and past meetings
* 👥 Meeting attendee management
* 🔗 Direct meeting link access
* 🎨 Modern, responsive UI with Tailwind CSS
* 🔒 Secure authentication with NextAuth.js
* ⚡ Server-side rendering for optimal performance

## Tech Stack

* **Framework**: Next.js 14 (App Router)
* **Authentication**: NextAuth.js
* **Calendar Integration**: Open-source Google Calendar MCP
* **Styling**: Tailwind CSS + Shadcn/ui
* **Database**: Supabase
* **State Management**: React Hooks
* **Type Safety**: TypeScript
* **Deployment**: Vercel

## Prerequisites

* Node.js 18.x or later
* npm or yarn
* A running instance of the open-source Google Calendar MCP server
* Supabase account (for user data)
* Google Cloud project with Calendar API enabled and OAuth credentials created

## Environment Variables (Next.js App)

Create a `.env.local` file in the root directory of **this project** with the following variables:

```bash
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## MCP Server Environment Variables

Create a `.env.local` file inside the **Google Calendar MCP server** directory with:

```bash
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/oauth2callback
PORT=3001
```

**Steps to get Google OAuth credentials**:

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (or select an existing one).
3. Enable the **Google Calendar API**.
4. Create OAuth 2.0 credentials (Client ID & Client Secret).
5. Set the redirect URI to `http://localhost:3001/oauth2callback`.

## Setup Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/katalyst-calendar.git
   cd katalyst-calendar
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the Google Calendar MCP server**

   ```bash
   git clone https://github.com/MCP-Mirror/GongRzhe_Calendar-MCP-Server.git
   cd GongRzhe_Calendar-MCP-Server
   npm install
   npm start
   ```

   By default, it will run at `http://localhost:3001/mcp`.

4. **Configure MCP in your app**
   Create `mcp.json` in the root directory of your Next.js app:

   ```json
   {
     "mcpServers": {
       "browsermcp": {
         "command": "npx",
         "args": [
           "@browsermcp/mcp@latest"
         ]
       },
       "googlecalendar": {
         "url": "http://localhost:3001/mcp"
       }
     }
   }
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open in your browser**
   Go to [http://localhost:3000](http://localhost:3000).

## Project Structure

```
katalyst-calendar/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/              # Utility functions and services
│   ├── types/            # TypeScript type definitions
│   └── styles/           # Global styles
├── public/               # Static assets
└── ...config files
```

## Key Features Implementation

### Calendar Integration

* Real-time calendar sync using the Google Calendar MCP
* Automatic refresh on initial load
* Manual refresh option
* Meeting filtering and sorting

### Authentication Flow

* Secure OAuth implementation with NextAuth.js
* Session management
* Protected routes

### User Interface

* Responsive design for all screen sizes
* Dark/light mode support
* Loading states and error handling
* Toast notifications for user feedback

## Deployment

The application is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

## Development Guidelines

* Follow TypeScript best practices
* Use ESLint and Prettier for code formatting
* Write meaningful commit messages
* Test thoroughly before deploying

## Performance Considerations

* Server-side rendering for initial page load
* Optimized calendar data fetching
* Efficient state management
* Lazy loading of components

## Security

* Environment variables for sensitive data
* Secure authentication flow
* API route protection
* Input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

