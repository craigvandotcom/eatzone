import type React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/features/auth/components/auth-provider';

const inter = Inter({ subsets: ['latin'] });

// Centralized metadata using Next.js App Router conventions
export const metadata: Metadata = {
  title: 'eatZone - Smart Food Tracking with Zone Intelligence',
  description:
    'AI analyzes your food photos and classifies ingredients into Green, Yellow, and Red zones. Track patterns between your food choices and symptoms with secure cloud sync.',
  keywords: [
    'food tracking',
    'ingredient analysis',
    'zone-based nutrition',
    'symptom tracking',
    'AI food analysis',
    'health monitoring',
    'nutrition app',
    'food diary',
    'symptom patterns',
  ],
  authors: [{ name: 'eatZone' }],
  manifest: '/manifest.json',
  applicationName: 'eatZone',
  appleWebApp: {
    capable: true,
    title: 'eatZone',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'eatZone',
    title: 'eatZone - Smart Food Tracking with Zone Intelligence',
    description:
      'AI analyzes your food photos and classifies ingredients into Green, Yellow, and Red zones. Track patterns between your food choices and symptoms.',
    url: 'https://eat.zone',
    images: [
      {
        url: '/new logo.png',
        width: 512,
        height: 512,
        alt: 'eatZone - Smart Food Tracking',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eatZone - Smart Food Tracking with Zone Intelligence',
    description:
      'AI analyzes your food photos and classifies ingredients into Green, Yellow, and Red zones.',
    images: ['/new logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  // The 'apple-icon.png' in the 'app/' directory is automatically detected.
  // No need to add it to the 'icons' array here for the apple-touch-icon link.
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1c1c1c',
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
