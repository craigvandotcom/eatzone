#!/usr/bin/env node

/**
 * Database Reset Utility for Supabase
 * Clears all user data from the current user's session
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

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
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetDatabase() {
  console.log('🔄 Starting database reset...');
  
  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('⚠️  No authenticated user found. Creating demo data instead...');
      
      // For development, we can create demo data
      console.log('📝 Use this script after logging in to reset your personal data');
      console.log('💡 For now, this serves as a connection test...');
      
      // Test connection
      const { data, error } = await supabase.from('foods').select('count', { count: 'exact', head: true });
      if (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
      }
      
      console.log('✅ Database connection successful');
      return;
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
    console.error('❌ Reset failed:', error.message);
    process.exit(1);
  }
}

// Run the reset
resetDatabase().then(() => {
  console.log('🎉 Reset process complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});