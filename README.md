# Katalyst Calendar

A modern, real-time calendar integration built with Next.js 14 and Composio MCP. View your upcoming and past meetings with a beautiful, responsive interface.

## Features

- 🔄 Real-time calendar synchronization
- 📅 View upcoming and past meetings
- 👥 Meeting attendee management
- 🔗 Direct meeting link access
- 🎨 Modern, responsive UI with Tailwind CSS
- 🔒 Secure authentication with NextAuth.js
- ⚡ Server-side rendering for optimal performance

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: NextAuth.js
- **Calendar Integration**: Composio MCP
- **Styling**: Tailwind CSS + Shadcn/ui
- **Database**: Supabase
- **State Management**: React Hooks
- **Type Safety**: TypeScript
- **Deployment**: Vercel

## Prerequisites

- Node.js 18.x or later
- npm or yarn
- A Composio account with MCP access
- Supabase account (for user data)

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Composio MCP Configuration
COMPOSIO_API_KEY=your-composio-api-key
COMPOSIO_AUTH_CONFIG_ID=your-composio-auth-config-id

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/katalyst-calendar.git
   cd katalyst-calendar
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure MCP:
   Create `mcp.json` in the root directory:
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
         "url": "https://mcp.composio.dev/composio/server/<YOUR_SERVER_ID>/mcp?include_composio_helper_actions=true&agent=cursor"
       }
     }
   }
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
katalyst-calendar/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/             # Utility functions and services
│   ├── types/           # TypeScript type definitions
│   └── styles/          # Global styles
├── public/              # Static assets
└── ...config files
```

## Key Features Implementation

### Calendar Integration
- Real-time calendar sync using Composio MCP
- Automatic refresh on initial load
- Manual refresh option
- Meeting filtering and sorting

### Authentication Flow
- Secure OAuth implementation with NextAuth.js
- Session management
- Protected routes

### User Interface
- Responsive design for all screen sizes
- Dark/light mode support
- Loading states and error handling
- Toast notifications for user feedback

## Deployment

The application is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

## Development Guidelines

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages
- Test thoroughly before deploying

## Performance Considerations

- Server-side rendering for initial page load
- Optimized calendar data fetching
- Efficient state management
- Lazy loading of components

## Security

- Environment variables for sensitive data
- Secure authentication flow
- API route protection
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, email support@yourdomain.com or open an issue in the repository.

---

Built with ❤️ using Next.js and Composio MCP
