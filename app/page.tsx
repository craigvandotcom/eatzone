import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LandingPage from '@/components/landing-page';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect authenticated users to the dashboard
  if (user) {
    redirect('/app');
  }

  // Show landing page to unauthenticated users
  return <LandingPage />;
}