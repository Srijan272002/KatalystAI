import type { Metadata } from "next";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";
import "../styles/fonts.css";

export const metadata: Metadata = {
  title: "Katalyst Calendar",
  description: "AI-powered calendar management with Google Calendar integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body
        suppressHydrationWarning
        className="min-h-screen bg-background font-satoshi antialiased"
      >
        <ErrorBoundary>
          <div className="relative flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
          </div>
        </ErrorBoundary>
      </body>
    </html>
  );
}
