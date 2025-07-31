"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getZoneBgClass, getZoneTextClass } from "@/lib/utils/zone-colors";
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
  Smartphone,
} from "lucide-react";
import { useAuth } from "@/features/auth/components/auth-provider";
// Simple PWA detection utilities
const isPWAContext = () => {
  if (typeof window === "undefined") return false;
  const isIOSPWA = (window.navigator as any).standalone === true;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
  return isIOSPWA || isStandalone || isMinimalUI;
};

const isIOSDevice = () => {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export function LoginFormClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  // All hooks must be called before any conditional returns
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPWAInfo, setShowPWAInfo] = useState(false);

  
  // PWA detection
  const isPWA = typeof window !== "undefined" ? isPWAContext() : false;
  const isIOS = typeof window !== "undefined" ? isIOSDevice() : false;

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
      await login(email, password);
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
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

          
          {/* PWA Status indicator */}
          {isPWA && (
            <div className="flex items-center justify-center space-x-1 text-xs text-blue-600">
              <Smartphone className="h-3 w-3" />
              <span>PWA Mode {isIOS ? "(iOS)" : ""}</span>
            </div>
          )}
        </div>

        {/* Success Message */}
        {redirectMessage === "signup_success" && (
          <Alert className={`border-zone-green/30 ${getZoneBgClass("green", "light")}`}>
            <AlertDescription className={getZoneTextClass("green")}>
              Account created successfully! Please sign in.
            </AlertDescription>
          </Alert>
        )}

        {/* PWA Information Card for iOS users */}
        {isPWA && isIOS && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                  <div className="flex items-center space-x-1">
                    <Smartphone className="h-3 w-3" />
                    <span>iOS PWA</span>
                  </div>
                </Badge>
                <button
                  onClick={() => setShowPWAInfo(!showPWAInfo)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {showPWAInfo ? "Hide" : "Info"}
                </button>
              </div>
            </CardHeader>
            {showPWAInfo && (
              <CardContent className="space-y-2">
                <p className="text-sm text-blue-700">
                  <strong>iOS PWA Detected:</strong> Enhanced storage is active for better app experience.
                </p>
                <ul className="text-xs text-blue-600 space-y-1 ml-4">
                  <li>• Your login will persist across app launches</li>
                  <li>• Data is stored securely in multiple locations</li>
                  <li>• If login issues occur, try closing and reopening the app</li>
                </ul>
              </CardContent>
            )}
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
                <Alert className={`border-zone-red/30 ${getZoneBgClass("red", "light")}`}>
                  <AlertDescription className={getZoneTextClass("red")}>
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
