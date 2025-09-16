'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Shield,
  Loader2,
  Smartphone,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/features/auth/components/auth-provider';
// Simple PWA detection utilities
const isPWAContext = () => {
  if (typeof window === 'undefined') return false;
  const isIOSPWA =
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
    true;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
  return isIOSPWA || isStandalone || isMinimalUI;
};

const isIOSDevice = () => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export function LoginFormClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  // Check if signup is enabled via environment variable
  const signupEnabled = process.env.NEXT_PUBLIC_SIGNUP_ENABLED !== 'false';

  // All hooks must be called before any conditional returns
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPWAInfo, setShowPWAInfo] = useState(false);

  // PWA detection
  const isPWA = typeof window !== 'undefined' ? isPWAContext() : false;
  const isIOS = typeof window !== 'undefined' ? isIOSDevice() : false;

  // Check for redirect message
  const redirectMessage = searchParams.get('message');

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/app');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (redirectMessage === 'signup_success') {
      setError('');
    }
  }, [redirectMessage]);

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if user is authenticated
  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
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
            {signupEnabled ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground hover:bg-accent hover:text-accent-foreground"
                asChild
              >
                <Link href="/signup">Get Started</Link>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="text-muted-foreground cursor-not-allowed"
              >
                Coming Soon
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          {/* Privacy Badge */}
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              <Shield className="h-3 w-3 mr-1" />
              Privacy-First • AI-Powered
            </Badge>
            {/* PWA Status indicator */}
            {isPWA && (
              <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground mt-2">
                <Smartphone className="h-3 w-3" />
                <span>PWA Mode {isIOS ? '(iOS)' : ''}</span>
              </div>
            )}
          </div>

          {/* Success Message */}
          {redirectMessage === 'signup_success' && (
            <Alert className="border-primary/30 bg-primary/10">
              <CheckCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary">
                Account created successfully! Please sign in.
              </AlertDescription>
            </Alert>
          )}

          {/* PWA Information Card for iOS users */}
          {isPWA && isIOS && (
            <Card className="bg-card border border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/30"
                  >
                    <div className="flex items-center space-x-1">
                      <Smartphone className="h-3 w-3" />
                      <span>iOS PWA</span>
                    </div>
                  </Badge>
                  <button
                    onClick={() => setShowPWAInfo(!showPWAInfo)}
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    {showPWAInfo ? 'Hide' : 'Info'}
                  </button>
                </div>
              </CardHeader>
              {showPWAInfo && (
                <CardContent className="space-y-2">
                  <p className="text-sm text-foreground">
                    <strong>iOS PWA Detected:</strong> Enhanced storage is
                    active for better app experience.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                    <li>• Your login will persist across app launches</li>
                    <li>• Data is stored securely in multiple locations</li>
                    <li>
                      • If login issues occur, try closing and reopening the app
                    </li>
                  </ul>
                </CardContent>
              )}
            </Card>
          )}

          {/* Login Form */}
          <Card className="bg-card border border-border shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-foreground">
                Welcome back to{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500">
                  eatZone
                </span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Continue discovering your food-feeling patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Continue Your Journey{' '}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              {signupEnabled ? (
                <Link
                  href="/signup"
                  className="font-medium text-primary hover:text-primary/80"
                >
                  Start your journey
                </Link>
              ) : (
                <span className="font-medium text-muted-foreground">
                  Signup coming soon
                </span>
              )}
            </p>
          </div>

          {/* Desktop-specific content */}
          <div className="hidden md:block text-center">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                For the best experience, use this app on your mobile device.
              </p>
              <p>You can install it as a PWA for app-like experience.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-muted-foreground py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm">
            <p>
              © 2025 eatZone. Intelligent correlation discovery through
              science-based tracking.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
