import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const webhookSecret = Deno.env.get('WEBHOOK_SECRET'); // Optional shared secret

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    // Security checks
    // 1. Validate request method
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // 2. Check for webhook secret if configured (optional but recommended)
    if (webhookSecret) {
      const providedSecret = req.headers.get('x-webhook-secret');
      if (providedSecret !== webhookSecret) {
        console.error('Invalid webhook secret');
        return new Response('Unauthorized', { status: 401 });
      }
    }

    // 3. Validate content type
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response('Invalid content type', { status: 400 });
    }

    // Parse and validate the webhook payload
    const payload = await req.json();
    
    // 4. Validate webhook payload structure
    if (!payload.type || !payload.table || !payload.record) {
      console.error('Invalid webhook payload structure');
      return new Response('Invalid payload', { status: 400 });
    }

    // 5. Ensure this is a user insert event
    if (payload.type !== 'INSERT' || payload.table !== 'auth.users') {
      console.log('Webhook called for non-user-insert event, ignoring');
      return new Response('Not a user insert event', { status: 200 });
    }

    const user = payload.record;

    // 6. Validate required user fields
    if (!user.id || !user.email) {
      console.error('Missing required user fields');
      return new Response('Invalid user data', { status: 400 });
    }

    // Check if profile already exists (idempotency)
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile) {
      console.log('User profile already exists, skipping creation');
      return new Response(JSON.stringify({ success: true, message: 'Profile already exists' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Create user profile with upsert for safety
    const { error } = await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      created_at: user.created_at || new Date().toISOString(),
      updated_at: user.created_at || new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to create user profile:', error);
      throw error;
    }

    console.log(`Successfully created profile for user ${user.id}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
