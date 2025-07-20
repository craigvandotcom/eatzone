import { Suspense } from "react";
import { LoginFormClient } from "./login-form-client";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginFormClient />
    </Suspense>
  );
}
