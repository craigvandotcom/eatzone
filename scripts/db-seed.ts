#!/usr/bin/env node

/**
 * Database Seed Utility for Supabase
 * Creates sample data for development and testing
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';
import type { Food, Symptom } from '../lib/types';

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

// Sample data
const sampleFoods: Omit<Food, 'id' | 'user_id' | 'timestamp'>[] = [
  {
    name: 'Green Smoothie',
    ingredients: [
      {
        name: 'Spinach',
        organic: true,
        group: 'Leafy Greens',
        category: 'Vegetables',
        zone: 'green',
      },
      {
        name: 'Banana',
        organic: false,
        group: 'Higher-Sugar Fruits',
        category: 'Fruits',
        zone: 'yellow',
      },
      {
        name: 'Coconut Milk',
        organic: true,
        group: 'Fresh/Low-Lactose Dairy',
        category: 'Dairy',
        zone: 'yellow',
      },
    ],
    notes: 'Morning energy boost',
    status: 'processed',
  },
  {
    name: 'Grilled Chicken Salad',
    ingredients: [
      {
        name: 'Chicken Breast',
        organic: true,
        group: 'Quality Animal Proteins',
        category: 'Proteins',
        zone: 'green',
      },
      {
        name: 'Mixed Greens',
        organic: true,
        group: 'Leafy Greens',
        category: 'Vegetables',
        zone: 'green',
      },
      {
        name: 'Olive Oil',
        organic: false,
        group: 'Cold-Use Oils',
        category: 'Fats & Oils',
        zone: 'green',
      },
      {
        name: 'Cherry Tomatoes',
        organic: true,
        group: 'Nightshades',
        category: 'Vegetables',
        zone: 'yellow',
      },
    ],
    notes: 'Lunch - felt very satisfied',
    status: 'processed',
  },
  {
    name: 'Coffee with Sugar',
    ingredients: [
      {
        name: 'Coffee',
        organic: false,
        group: 'Caffeinated Drinks',
        category: 'Beverages',
        zone: 'yellow',
      },
      {
        name: 'White Sugar',
        organic: false,
        group: 'Refined Sugars',
        category: 'Sweeteners',
        zone: 'red',
      },
      {
        name: 'Whole Milk',
        organic: false,
        group: 'Conventional Dairy',
        category: 'Dairy',
        zone: 'red',
      },
    ],
    notes: 'Afternoon pick-me-up',
    status: 'processed',
  },
];

const sampleSymptoms: Omit<Symptom, 'id' | 'user_id' | 'timestamp'>[] = [
  {
    symptom_id: 'fatigue',
    category: 'energy',
    name: 'Fatigue',
    notes: 'Feeling more tired than usual after lunch',
  },
  {
    symptom_id: 'bloat',
    category: 'digestion',
    name: 'Bloating',
    notes: 'Experiencing bloating after breakfast',
  },
  // Note: Removed baseline anxiety entry since symptom existence implies presence
];

async function seedDatabase(): Promise<void> {
  console.log('🌱 Starting database seeding...');

  try {
    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('⚠️  No authenticated user found.');
      console.log(
        '📝 Please log in first, then run this script to create sample data'
      );
      return;
    }

    console.log(`👤 Creating sample data for user: ${user.email}`);

    // Create sample foods
    const foodsWithTimestamps = sampleFoods.map((food, index) => {
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() - index * 2); // Spread over several hours

      return {
        ...food,
        user_id: user.id,
        timestamp: timestamp.toISOString(),
      };
    });

    const { error: foodsError } = await supabase
      .from('foods')
      .insert(foodsWithTimestamps);

    if (foodsError) {
      console.error('❌ Error creating sample foods:', foodsError.message);
    } else {
      console.log(`✅ Created ${sampleFoods.length} sample food entries`);
    }

    // Create sample symptoms
    const symptomsWithTimestamps = sampleSymptoms.map((symptom, index) => {
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() - index * 3); // Spread over time

      return {
        ...symptom,
        user_id: user.id,
        timestamp: timestamp.toISOString(),
      };
    });

    const { error: symptomsError } = await supabase
      .from('symptoms')
      .insert(symptomsWithTimestamps);

    if (symptomsError) {
      console.error(
        '❌ Error creating sample symptoms:',
        symptomsError.message
      );
    } else {
      console.log(`✅ Created ${sampleSymptoms.length} sample symptom entries`);
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('💡 You can now explore the app with sample data');
  } catch (error) {
    console.error('❌ Seeding failed:', (error as Error).message);
    process.exit(1);
  }
}

// Run the seeding
seedDatabase()
  .then(() => {
    console.log('🌟 Seeding process complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
