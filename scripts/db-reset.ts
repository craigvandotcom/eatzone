#!/usr/bin/env node

/**
 * Database Reset Utility for Supabase
 * Clears all user data from the current user's session
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  const envVars = envFile.split('\n').filter(line => line.includes('='));

  envVars.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').replace(/"/g, '');
    process.env[key] = value;
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.error(
    'Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set in .env.local'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetDatabase(): Promise<void> {
  console.log('🔄 Starting database reset...');

  try {
    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log(
        '⚠️  No authenticated user found. Creating demo data instead...'
      );

      // For development, we can create demo data
      console.log(
        '📝 Use this script after logging in to reset your personal data'
      );
      console.log('💡 For now, this serves as a connection test...');

      // Test connection with timeout and retry
      const MAX_RETRIES = 3;
      const TIMEOUT_MS = 5000;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(
            `🔍 Testing database connection (attempt ${attempt}/${MAX_RETRIES})...`
          );

          // Create a timeout promise
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(
              () => reject(new Error('Connection timeout')),
              TIMEOUT_MS
            );
          });

          // Create the query promise
          const queryPromise = supabase
            .from('foods')
            .select('count', { count: 'exact', head: true });

          // Race between timeout and query
          const result = await Promise.race([queryPromise, timeoutPromise]);

          if ('error' in result && result.error) {
            throw result.error;
          }

          console.log('✅ Database connection successful');
          return;
        } catch (error) {
          lastError = error as Error;
          console.error(
            `❌ Connection attempt ${attempt} failed:`,
            (error as Error).message
          );

          if (attempt < MAX_RETRIES) {
            const waitTime = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
            console.log(`⏳ Waiting ${waitTime / 1000}s before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }

      // All retries failed
      console.error('\n❌ Database connection failed after all retries');
      console.error('\n🔧 Troubleshooting tips:');
      console.error('1. Check your internet connection');
      console.error('2. Verify NEXT_PUBLIC_SUPABASE_URL in .env.local');
      console.error('3. Ensure Supabase project is active');
      console.error('4. Check if the database is paused (free tier)');
      console.error(`\nLast error: ${lastError?.message || 'Unknown error'}`);
      process.exit(1);
    }

    console.log(`👤 Resetting data for user: ${user.email}`);

    // Delete user's foods
    const { error: foodsError } = await supabase
      .from('foods')
      .delete()
      .eq('user_id', user.id);

    if (foodsError) {
      console.error('❌ Error deleting foods:', foodsError.message);
    } else {
      console.log('🗑️  Deleted all food entries');
    }

    // Delete user's symptoms
    const { error: symptomsError } = await supabase
      .from('symptoms')
      .delete()
      .eq('user_id', user.id);

    if (symptomsError) {
      console.error('❌ Error deleting symptoms:', symptomsError.message);
    } else {
      console.log('🗑️  Deleted all symptom entries');
    }

    console.log('✅ Database reset completed successfully!');
    console.log('💡 Your account remains active, only your data was cleared');
  } catch (error) {
    console.error('❌ Reset failed:', (error as Error).message);
    process.exit(1);
  }
}

// Run the reset
resetDatabase()
  .then(() => {
    console.log('🎉 Reset process complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
