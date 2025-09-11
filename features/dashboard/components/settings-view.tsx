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
import { User, LogOut, Smartphone } from 'lucide-react';
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
    <div className="space-y-4">
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
