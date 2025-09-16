'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface SignupDisabledProps {
  variant?: 'page' | 'button' | 'banner';
  className?: string;
}

export function SignupDisabled({
  variant = 'page',
  className = '',
}: SignupDisabledProps) {
  if (variant === 'button') {
    return (
      <Button
        size="lg"
        disabled
        className={`bg-muted text-muted-foreground cursor-not-allowed ${className}`}
      >
        <Clock className="mr-2 h-4 w-4" />
        Coming Soon
      </Button>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        className={`bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-amber-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                New signups are temporarily paused
              </p>
              <p className="text-xs text-amber-700">
                We&apos;re preparing something amazing for you!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full page variant
  return (
    <div className={`min-h-screen bg-background flex flex-col ${className}`}>
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-foreground hover:bg-accent hover:text-accent-foreground"
              asChild
            >
              <Link href="/">← Back to Home</Link>
            </Button>
            <div className="flex items-center space-x-2">
              <Image
                src="/eatZone Logo - Rnd Corners.png"
                alt="eatZone logo"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <span className="text-lg font-bold text-foreground">eatZone</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-foreground hover:bg-accent hover:text-accent-foreground"
              asChild
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                New Signups Paused
              </CardTitle>
              <Badge variant="secondary" className="mx-auto mt-2">
                Temporarily Closed
              </Badge>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-muted-foreground">
                We&apos;re currently preparing some exciting improvements to
                eatZone. New account creation is temporarily paused while we
                enhance your experience.
              </p>

              <div className="space-y-4">
                <p className="text-sm font-medium text-foreground">
                  Already have an account?
                </p>
                <Button
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  asChild
                >
                  <Link href="/login">
                    Sign In to Your Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Thank you for your patience as we make eatZone even better!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
