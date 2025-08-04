'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { WifiOff, RotateCcw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <WifiOff className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            You&apos;re Offline
          </CardTitle>
          <CardDescription className="text-gray-600">
            Your health data is safe and stored locally. Some features may be
            limited without an internet connection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              What you can still do:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• View your logged data</li>
              <li>• Add new entries manually</li>
              <li>• Export your data</li>
              <li>• Access your insights</li>
            </ul>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg">
            <h3 className="font-semibold text-amber-900 mb-2">
              Requires internet:
            </h3>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Camera-based food analysis</li>
              <li>• Syncing across devices</li>
            </ul>
          </div>

          <Button
            onClick={() => window.location.reload()}
            className="w-full"
            size="lg"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>

          <Button
            onClick={() => (window.location.href = '/app')}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Continue Offline
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
