# Katalyst Calendar

A modern, real-time calendar dashboard built with Next.js that helps you manage and track your meetings efficiently.

![Katalyst Calendar](public/preview.png)

## Features

- 🔄 Real-time meeting updates
- 👥 View upcoming and past meetings
- 📝 Meeting details including attendees and descriptions
- 🤖 AI-powered meeting summaries
- 🎨 Modern, responsive UI with Tailwind CSS
- 🔒 Secure authentication with NextAuth.js
- 🌐 Seamless calendar integration
- 📱 Mobile-friendly design

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Icons**: [Lucide Icons](https://lucide.dev/)
- **Fonts**: [Satoshi](https://www.fontshare.com/fonts/satoshi)
- **Type Safety**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- A modern web browser

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/katalyst-calendar.git
cd katalyst-calendar
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
katalyst-calendar/
├── src/
│   ├── app/                 # App router pages
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components
│   │   ├── auth/          # Authentication components
│   │   └── dashboard/     # Dashboard components
│   ├── lib/               # Utility functions and configs
│   │   ├── api/          # API handlers
│   │   └── utils/        # Helper functions
│   └── types/             # TypeScript type definitions
├── public/                # Static assets
└── styles/               # Global styles
```

## Key Features Explained

### Real-time Updates
- Automatic meeting data refresh every 60 seconds
- Instant UI updates for new or modified meetings
- Optimized API calls with error handling

### Meeting Management
- View upcoming and past meetings
- Meeting details include:
  - Title and time
  - Duration
  - Attendees
  - Description
  - Status (Upcoming/Completed)

### AI Meeting Summaries
- Generate AI-powered summaries for past meetings
- Quick overview of key points and action items
- Asynchronous processing with loading states

### Authentication
- Secure OAuth authentication flow
- Protected routes and API endpoints
- Persistent user sessions

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

### Code Style

- ESLint configuration for consistent code style
- Prettier for code formatting
- TypeScript for type safety

### Best Practices

- Component-based architecture
- Custom hooks for reusable logic
- Responsive design patterns
- Error boundary implementation
- Performance optimizations

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/)
- [NextAuth.js](https://next-auth.js.org/)
- [Radix UI](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)
- [Fontshare](https://www.fontshare.com/)

