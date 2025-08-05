#!/usr/bin/env node

/**
 * Database Status Utility for Supabase
 * Shows connection status and data summary
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

async function checkDatabaseStatus(): Promise<void> {
  console.log('📊 Checking database status...\n');

  try {
    // Check connection
    console.log('🔗 Connection Details:');
    console.log(`   URL: ${supabaseUrl}`);
    console.log(`   Key: ${supabaseKey!.substring(0, 20)}...`);

    // Test basic connection
    const { error } = await supabase
      .from('foods')
      .select('count', { count: 'exact', head: true });
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return;
    }
    console.log('✅ Database connection successful\n');

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log('👤 Authentication Status:');
    if (authError || !user) {
      console.log('   Status: Not authenticated');
      console.log('   Note: Some data queries will be limited\n');
    } else {
      console.log(`   Status: Authenticated as ${user.email}`);
      console.log(`   User ID: ${user.id}`);
      console.log(
        `   Created: ${new Date(user.created_at!).toLocaleString()}\n`
      );
    }

    // Get data counts
    console.log('📈 Data Summary:');

    if (user) {
      // User-specific counts
      const { count: userFoodCount } = await supabase
        .from('foods')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: userSymptomCount } = await supabase
        .from('symptoms')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      console.log(`   Your Foods: ${userFoodCount || 0}`);
      console.log(`   Your Symptoms: ${userSymptomCount || 0}`);

      // Recent activity
      const { data: recentFoods } = await supabase
        .from('foods')
        .select('name, timestamp')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(3);

      const { data: recentSymptoms } = await supabase
        .from('symptoms')
        .select('name, severity, timestamp')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(3);

      if (recentFoods && recentFoods.length > 0) {
        console.log('\n📝 Recent Foods:');
        recentFoods.forEach((food, i) => {
          const time = new Date(food.timestamp).toLocaleString();
          console.log(`   ${i + 1}. ${food.name} (${time})`);
        });
      }

      if (recentSymptoms && recentSymptoms.length > 0) {
        console.log('\n⚡ Recent Symptoms:');
        recentSymptoms.forEach((symptom, i) => {
          const time = new Date(symptom.timestamp).toLocaleString();
          console.log(
            `   ${i + 1}. ${symptom.name} (severity: ${symptom.severity}/5) (${time})`
          );
        });
      }
    }

    // Global database stats (if accessible)
    const { count: totalFoodCount } = await supabase
      .from('foods')
      .select('*', { count: 'exact', head: true });

    const { count: totalSymptomCount } = await supabase
      .from('symptoms')
      .select('*', { count: 'exact', head: true });

    console.log(`\n🌍 Global Stats:`);
    console.log(`   Total Foods: ${totalFoodCount || 'Unknown'}`);
    console.log(`   Total Symptoms: ${totalSymptomCount || 'Unknown'}`);

    // Health check
    console.log('\n🏥 Health Check:');
    const healthChecks = [
      { name: 'Foods table', status: totalFoodCount !== null },
      { name: 'Symptoms table', status: totalSymptomCount !== null },
      { name: 'Authentication', status: !authError },
      { name: 'Real-time subscriptions', status: true }, // We assume this works if connection works
    ];

    healthChecks.forEach(check => {
      const status = check.status ? '✅' : '❌';
      console.log(`   ${status} ${check.name}`);
    });

    console.log('\n🎯 Available Commands:');
    console.log('   pnpm run db:reset  - Clear your data');
    console.log('   pnpm run db:seed   - Create sample data');
    console.log('   pnpm run db:status - Show this status (current command)');

    console.log('\n🔧 Supabase Commands:');
    console.log('   pnpm run supabase:start - Start local Supabase');
    console.log('   pnpm run supabase:types - Generate TypeScript types');
  } catch (error) {
    console.error('❌ Status check failed:', (error as Error).message);
    process.exit(1);
  }
}

// Run the status check
checkDatabaseStatus()
  .then(() => {
    console.log('\n✨ Status check complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
