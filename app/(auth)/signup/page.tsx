'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getZoneTextClass, getZoneBgStyle } from '@/lib/utils/zone-colors';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Shield,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import Image from 'next/image';
// Remove direct database import - we'll use the API route instead
import { useAuth } from '@/features/auth/components/auth-provider';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  // All hooks must be called before any conditional returns
  // Check for redirect parameter
  const redirectTo = searchParams.get('redirect');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect authenticated users to app
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/app');
    }
  }, [isAuthenticated, authLoading, router]);

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

  // Don't render signup form if user is authenticated
  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!agreeToTerms) {
      setError('Please acknowledge the privacy notice');
      return;
    }

    setIsLoading(true);

    try {
      // Use API route for signup which handles profile creation properly
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Signup failed');
      }

      // Auto-login after successful signup using Supabase
      await login(email, password);

      // Redirect to intended page or dashboard
      router.push(redirectTo || '/app');
    } catch (err) {
      // Safe error handling - check if error has a message property
      setError(
        err &&
          typeof err === 'object' &&
          'message' in err &&
          typeof err.message === 'string'
          ? err.message
          : 'Account creation failed'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = email.includes('@') && email.includes('.');
  const isPasswordStrong = password.length >= 8;
  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;
  const isFormValid =
    isValidEmail && isPasswordStrong && passwordsMatch && agreeToTerms;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent hover:text-accent-foreground" asChild>
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
            <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent hover:text-accent-foreground" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
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
          </div>

          {/* Signup Card */}
          <Card className="bg-card border border-border shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-foreground">
                Connect Food to{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500">
                  Feeling
                </span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Start discovering your unique food-feeling patterns with intelligent tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

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
                    disabled={isLoading}
                    className="h-12"
                  />
                  {email.length > 0 && (
                    <div className="flex items-center text-xs">
                      {isValidEmail ? (
                        <>
                          <CheckCircle
                            className={`h-3 w-3 ${getZoneTextClass('green')} mr-1`}
                          />{' '}
                          Valid email format
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3 w-3 text-amber-500 mr-1" />{' '}
                          Enter a valid email
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password (min 8 characters)"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-12 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  {password.length > 0 && (
                    <div className="flex items-center text-xs">
                      {isPasswordStrong ? (
                        <>
                          <CheckCircle
                            className={`h-3 w-3 ${getZoneTextClass('green')} mr-1`}
                          />{' '}
                          Strong password
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3 w-3 text-amber-500 mr-1" />{' '}
                          At least 8 characters required
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-12 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  {confirmPassword.length > 0 && (
                    <div className="flex items-center text-xs">
                      {passwordsMatch ? (
                        <>
                          <CheckCircle
                            className={`h-3 w-3 ${getZoneTextClass('green')} mr-1`}
                          />{' '}
                          Passwords match
                        </>
                      ) : (
                        <>
                          <AlertTriangle
                            className={`h-3 w-3 ${getZoneTextClass('red')} mr-1`}
                          />{' '}
                          Passwords do not match
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={checked =>
                      setAgreeToTerms(checked as boolean)
                    }
                    disabled={isLoading}
                    className="mt-1"
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed">
                    I understand that my account and health data will be stored
                    locally on this device only. There is no way to recover my
                    data if I forget my password or lose this device.
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={!isFormValid || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Start Feeling Better <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>

              {/* Privacy Notice */}
              <div className="bg-card border border-border p-4 rounded-lg">
                <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-primary" />
                  Privacy-First Cloud Storage
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Secure cloud storage with encryption</li>
                  <li>• Complete data ownership and control</li>
                  <li>• Sync across devices with privacy protection</li>
                  <li>• Export your data anytime</li>
                </ul>
              </div>
            </CardContent>
          </Card>

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
              © 2025 eatZone. Intelligent correlation discovery through science-based tracking.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
