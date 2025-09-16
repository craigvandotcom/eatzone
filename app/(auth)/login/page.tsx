import { Suspense } from 'react';
import { LoginFormClient } from './login-form-client';
import { DataLoadingState } from '@/components/ui/loading-states';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <DataLoadingState
            message="Loading login page..."
            className="min-h-screen justify-center"
          />
        </div>
      }
    >
      <LoginFormClient />
    </Suspense>
  );
}
