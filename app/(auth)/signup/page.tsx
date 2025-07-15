"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Shield,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { createUser, authenticateUser } from "@/lib/db";
import { useAuth } from "@/features/auth/components/auth-provider";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  // All hooks must be called before any conditional returns
  // Check for redirect parameter
  const redirectTo = searchParams.get("redirect");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect authenticated users to app
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/app");
    }
  }, [isAuthenticated, authLoading, router]);

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
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
    setError("");

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (!agreeToTerms) {
      setError("Please acknowledge the privacy notice");
      return;
    }

    setIsLoading(true);

    try {
      const user = await createUser(email, password);

      // Auto-login after successful signup
      const { token } = await authenticateUser(email, password);

      // Use auth context to handle login
      login(token, user);

      // Redirect to intended page or dashboard
      router.push(redirectTo || "/app");
    } catch (err) {
      // Safe error handling - check if error has a message property
      setError(
        err &&
          typeof err === "object" &&
          "message" in err &&
          typeof err.message === "string"
          ? err.message
          : "Account creation failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = email.includes("@") && email.includes(".");
  const isPasswordStrong = password.length >= 8;
  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;
  const isFormValid =
    isValidEmail && isPasswordStrong && passwordsMatch && agreeToTerms;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-green-500 rounded"></div>
              <span className="text-lg font-bold text-gray-900">Puls</span>
            </div>
            <Button variant="ghost" size="sm" asChild>
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
              100% Private & Local
            </Badge>
          </div>

          {/* Signup Card */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">
                Create Your Account
              </CardTitle>
              <CardDescription>
                Start tracking your health privately on this device
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
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1" />{" "}
                          Valid email format
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3 w-3 text-amber-500 mr-1" />{" "}
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
                      type={showPassword ? "text" : "password"}
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
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1" />{" "}
                          Strong password
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3 w-3 text-amber-500 mr-1" />{" "}
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
                      type={showConfirmPassword ? "text" : "password"}
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
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1" />{" "}
                          Passwords match
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3 w-3 text-red-500 mr-1" />{" "}
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
                  className="w-full h-12"
                  disabled={!isFormValid || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>

              {/* Privacy Notice */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Why Your Privacy Matters
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Your health data never leaves this device</li>
                  <li>• No cloud storage or third-party access</li>
                  <li>• You own and control all your information</li>
                  <li>• Export your data anytime</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Desktop-specific content */}
          <div className="hidden md:block text-center">
            <div className="text-sm text-gray-500 space-y-2">
              <p>
                For the best experience, use this app on your mobile device.
              </p>
              <p>You can install it as a PWA for offline access.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>
              © 2024 Puls. Your Body&apos;s Compass - Built with privacy in
              mind.
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
