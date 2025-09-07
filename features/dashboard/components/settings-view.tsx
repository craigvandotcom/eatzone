'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User, LogOut, Shield, Smartphone } from 'lucide-react';
import { getBuildInfo } from '@/lib/utils/app-version';
import { LoadingSpinner } from '@/components/ui/loading-states';

interface SettingsViewProps {
  user?: any;
  isLoggingOut: boolean;
  handleLogout: () => void;
}

export function SettingsView({
  user,
  isLoggingOut,
  handleLogout,
}: SettingsViewProps) {
  const buildInfo = getBuildInfo();
  return (
    <div className="space-y-4 p-4">
      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account
          </CardTitle>
          <CardDescription>
            Your account details and information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <p className="text-sm text-foreground flex items-center gap-2">
              {user?.email ? (
                user.email
              ) : (
                <>
                  <LoadingSpinner size="sm" />
                  Loading...
                </>
              )}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Member Since</Label>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              {user?.createdAt ? (
                new Date(user.createdAt).toLocaleDateString()
              ) : (
                <>
                  <LoadingSpinner size="sm" />
                  Loading...
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
          <CardDescription>
            Your data privacy and security information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-950/20 p-4 rounded-lg border border-green-800">
            <h4 className="text-sm font-medium text-green-100 mb-2">
              🔒 Privacy First
            </h4>
            <p className="text-xs text-green-300">
              Your health data is securely stored in the cloud with Supabase.
              Only you have access to your data, and it's encrypted at rest and
              in transit.
            </p>
          </div>
          <div className="bg-blue-950/20 p-4 rounded-lg border border-blue-800">
            <h4 className="text-sm font-medium text-blue-100 mb-2">
              ☁️ Cloud Sync
            </h4>
            <p className="text-xs text-blue-300">
              Your data syncs automatically across all your devices. No manual
              backups needed - your data is safe and always available.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* App Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            App Information
          </CardTitle>
          <CardDescription>Version and technical details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm">Version</Label>
            <span className="text-sm text-muted-foreground">
              {buildInfo.version}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <Label className="text-sm">Build</Label>
            <span className="text-sm text-muted-foreground">
              {buildInfo.build}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <Label className="text-sm">Platform</Label>
            <span className="text-sm text-muted-foreground">
              {buildInfo.platform}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Account Actions
          </CardTitle>
          <CardDescription>Sign out of your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {isLoggingOut ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
