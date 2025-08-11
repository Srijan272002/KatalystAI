Katalyst Calendar
A modern, real-time calendar integration built with Next.js 14 and the open-source Google Calendar MCP. View your upcoming and past meetings with a beautiful, responsive interface.

Features
🔄 Real-time calendar synchronization

📅 View upcoming and past meetings

👥 Meeting attendee management

🔗 Direct meeting link access

🎨 Modern, responsive UI with Tailwind CSS

🔒 Secure authentication with NextAuth.js

⚡ Server-side rendering for optimal performance

Tech Stack
Framework: Next.js 14 (App Router)

Authentication: NextAuth.js

Calendar Integration: Open-source Google Calendar MCP - "https://github.com/MCP-Mirror/GongRzhe_Calendar-MCP-Server"

Styling: Tailwind CSS + Shadcn/ui

Database: Supabase

State Management: React Hooks

Type Safety: TypeScript

Deployment: Vercel

Prerequisites
Node.js 18.x or later

npm or yarn

A running instance of the open-source Google Calendar MCP server

Supabase account (for user data)

Environment Variables
Create a .env.local file in the root directory with the following variables:

bash
Copy
Edit
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
Setup Instructions
Clone the repository:

bash
Copy
Edit
git clone https://github.com/yourusername/katalyst-calendar.git
cd katalyst-calendar
Install dependencies:

bash
Copy
Edit
npm install
Configure MCP:
Create mcp.json in the root directory:

json
Copy
Edit
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
Replace http://localhost:3001/mcp with the URL of your running Google Calendar MCP server.

Run the development server:

bash
Copy
Edit
npm run dev
Open http://localhost:3000 in your browser.

Project Structure
php
Copy
Edit
katalyst-calendar/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/              # Utility functions and services
│   ├── types/            # TypeScript type definitions
│   └── styles/           # Global styles
├── public/               # Static assets
└── ...config files
Key Features Implementation
Calendar Integration
Real-time calendar sync using the Google Calendar MCP

Automatic refresh on initial load

Manual refresh option

Meeting filtering and sorting

Authentication Flow
Secure OAuth implementation with NextAuth.js

Session management

Protected routes

User Interface
Responsive design for all screen sizes

Dark/light mode support

Loading states and error handling

Toast notifications for user feedback

Deployment
The application is optimized for deployment on Vercel:

Push your code to GitHub

Connect your repository to Vercel

Configure environment variables in Vercel dashboard

Deploy!

Development Guidelines
Follow TypeScript best practices

Use ESLint and Prettier for code formatting

Write meaningful commit messages

Test thoroughly before deploying

Performance Considerations
Server-side rendering for initial page load

Optimized calendar data fetching

Efficient state management

Lazy loading of components

Security
Environment variables for sensitive data

Secure authentication flow

API route protection

Input validation and sanitization

Contributing
Fork the repository

Create a feature branch

Commit your changes

Push to the branch

Open a pull request

License
MIT License - see LICENSE file for details

Support
For support, email support@yourdomain.com or open an issue in the repository.

Built with ❤️ using Next.js and the open-source Google Calendar MCP.
