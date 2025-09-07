import type React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/features/auth/components/auth-provider';

const inter = Inter({ subsets: ['latin'] });

// Centralized metadata using Next.js App Router conventions
export const metadata: Metadata = {
  title: "Puls - Your Body's Compass",
  description:
    'Private health tracking with AI-powered insights. Your data stays on your device.',
  manifest: '/manifest.json',
  applicationName: 'Puls',
  appleWebApp: {
    capable: true,
    title: 'Puls',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  // The 'apple-icon.png' in the 'app/' directory is automatically detected.
  // No need to add it to the 'icons' array here for the apple-touch-icon link.
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`${inter.className} h-full overflow-x-hidden bg-background text-foreground`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <div className="h-full min-h-0">
            {children}
            <Toaster />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
