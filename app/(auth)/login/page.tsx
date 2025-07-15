"use client";

import { useState, useEffect, Suspense } from "react";
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
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Shield,
  Loader2,
  Zap,
  RotateCcw,
} from "lucide-react";
import {
  authenticateUser,
  isDevelopment,
  quickDevLogin,
  resetDevUser,
} from "@/lib/db";
import { useAuth } from "@/features/auth/components/auth-provider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  // All hooks must be called before any conditional returns
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDevLoginLoading, setIsDevLoginLoading] = useState(false);
  const [devLoginError, setDevLoginError] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);

  // Check for redirect message
  const redirectMessage = searchParams.get("message");

  // Redirect authenticated users to app
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/app");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (redirectMessage === "signup_success") {
      setError("");
    }
  }, [redirectMessage]);

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

  // Don't render login form if user is authenticated
  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await authenticateUser(email, password);
      login(result.token, result.user);
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setIsDevLoginLoading(true);
    setDevLoginError("");

    try {
      const result = await quickDevLogin();
      if (result) {
        login(result.token, result.user);
        router.push("/app");
      } else {
        setDevLoginError("Development login failed");
      }
    } catch (err) {
      setDevLoginError(
        err instanceof Error ? err.message : "Development login failed"
      );
    } finally {
      setIsDevLoginLoading(false);
    }
  };

  const handleResetDevUser = async () => {
    setIsResetLoading(true);
    setDevLoginError("");

    try {
      await resetDevUser();
      setDevLoginError("Dev user reset successfully! Try logging in again.");
    } catch (err) {
      setDevLoginError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Body Compass</h1>
          </div>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Success Message */}
        {redirectMessage === "signup_success" && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              Account created successfully! Please sign in.
            </AlertDescription>
          </Alert>
        )}

        {/* Development Mode Card */}
        {isDevelopment() && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Badge
                  variant="outline"
                  className="bg-orange-100 text-orange-800 border-orange-300"
                >
                  Development Mode
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-orange-700">
                Quick login for testing: <strong>dev@test.com</strong> /{" "}
                <strong>password</strong>
              </p>
              <div className="flex space-x-2">
                <Button
                  onClick={handleDevLogin}
                  disabled={isDevLoginLoading}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                  size="sm"
                >
                  {isDevLoginLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  Quick Dev Login
                </Button>
                <Button
                  onClick={handleResetDevUser}
                  disabled={isResetLoading}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  size="sm"
                >
                  {isResetLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  Reset
                </Button>
              </div>
              {devLoginError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800 text-sm">
                    {devLoginError}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email and password to access your account
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
                    type={showPassword ? "text" : "password"}
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
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
