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
  Zap,
  RotateCcw,
  Globe,
  Monitor,
  Users,
  Smartphone,
} from "lucide-react";
import {
  isDemoMode,
  getEnvironmentType,
  quickDemoLogin,
  getDemoAccounts,
  resetDevUser,
} from "@/lib/db";
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
  const [isDemoLoginLoading, setIsDemoLoginLoading] = useState(false);
  const [demoLoginError, setDemoLoginError] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [selectedDemoAccount, setSelectedDemoAccount] = useState<number | null>(
    null
  );
  const [showPWAInfo, setShowPWAInfo] = useState(false);

  // Get environment info
  const envType =
    typeof window !== "undefined" ? getEnvironmentType() : "production";
  const demoAccounts = getDemoAccounts();
  
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

  const handleDemoLogin = async (accountIndex?: number) => {
    const targetAccount = accountIndex ?? selectedDemoAccount ?? 0;
    setIsDemoLoginLoading(true);
    setDemoLoginError("");
    setSelectedDemoAccount(targetAccount);

    try {
      const result = await quickDemoLogin(targetAccount);
      if (result) {
        const accountName =
          envType === "development"
            ? "Dev User"
            : demoAccounts[targetAccount]?.name || "Demo User";
        console.log(`✅ Logged in as: ${accountName} (${result.user.email})`);
        // Note: quickDemoLogin already handles Supabase auth, so we don't need to call login here
        router.push("/app");
      } else {
        setDemoLoginError("Demo login failed - not in demo mode");
      }
    } catch (err) {
      setDemoLoginError(
        err instanceof Error ? err.message : "Demo login failed"
      );
    } finally {
      setIsDemoLoginLoading(false);
    }
  };

  const handleResetDevUser = async () => {
    setIsResetLoading(true);
    setDemoLoginError("");

    try {
      await resetDevUser();
      setDemoLoginError("Dev user reset successfully! Try logging in again.");
    } catch (err) {
      setDemoLoginError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setIsResetLoading(false);
    }
  };

  const getDemoModeConfig = () => {
    if (envType === "development") {
      return {
        title: "Development Mode",
        badgeClass: "bg-orange-100 text-orange-800 border-orange-300",
        cardClass: "border-orange-200 bg-orange-50",
        buttonClass: "bg-orange-600 hover:bg-orange-700",
        textClass: "text-orange-700",
        icon: <Monitor className="h-4 w-4" />,
        description: "Quick login for local development",
      };
    } else {
      return {
        title: "Preview Mode",
        badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
        cardClass: "border-blue-200 bg-blue-50",
        buttonClass: "bg-blue-600 hover:bg-blue-700",
        textClass: "text-blue-700",
        icon: <Globe className="h-4 w-4" />,
        description: "Quick demo access for preview deployment",
      };
    }
  };

  const demoConfig = getDemoModeConfig();

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

          {/* Environment indicator */}
          {envType !== "production" && (
            <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
              {demoConfig.icon}
              <span>Running in {envType} mode</span>
            </div>
          )}
          
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

        {/* Demo Mode Card */}
        {isDemoMode() && (
          <Card className={demoConfig.cardClass}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={demoConfig.badgeClass}>
                  <div className="flex items-center space-x-1">
                    {demoConfig.icon}
                    <span>{demoConfig.title}</span>
                  </div>
                </Badge>
                {envType === "preview" && (
                  <div className="text-xs text-gray-500 flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {demoAccounts.length} accounts
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {envType === "development" ? (
                <div className="space-y-2">
                  <p className="text-sm text-orange-700">
                    Quick login for testing: <strong>dev@test.com</strong> /{" "}
                    <strong>password</strong>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-blue-700 font-medium">
                    {demoConfig.description}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {demoAccounts.map((account, index) => (
                      <Button
                        key={account.email}
                        onClick={() => handleDemoLogin(index)}
                        disabled={isDemoLoginLoading}
                        variant="outline"
                        size="sm"
                        className={`justify-start text-left h-auto p-3 ${
                          selectedDemoAccount === index && isDemoLoginLoading
                            ? "ring-2 ring-blue-300"
                            : ""
                        }`}
                      >
                        <div className="flex flex-col items-start space-y-1 w-full">
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium text-sm">
                              {account.name}
                            </span>
                            {selectedDemoAccount === index &&
                              isDemoLoginLoading && (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              )}
                          </div>
                          <span className="text-xs text-gray-500 font-normal">
                            {account.email}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={() => handleDemoLogin()}
                  disabled={isDemoLoginLoading}
                  className={`flex-1 ${demoConfig.buttonClass} text-white`}
                  size="sm"
                >
                  {isDemoLoginLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {envType === "development"
                    ? "Quick Dev Login"
                    : "Quick Demo Login"}
                </Button>

                {envType === "development" && (
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
                )}
              </div>

              {demoLoginError && (
                <Alert className={`border-zone-red/30 ${getZoneBgClass("red", "light")}`}>
                  <AlertDescription className={`${getZoneTextClass("red")} text-sm`}>
                    {demoLoginError}
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
