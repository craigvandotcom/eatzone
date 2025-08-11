#!/usr/bin/env npx ts-node

/**
 * Chunked migration script for safely migrating photo_url to image_urls array
 * Prevents timeout issues on large datasets by processing in batches
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const BATCH_SIZE = 100; // Process 100 records at a time
const DELAY_BETWEEN_BATCHES = 500; // 500ms delay between batches

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

interface MigrationStats {
  total: number;
  processed: number;
  migrated: number;
  failed: number;
  skipped: number;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getTotalRecordsToMigrate(): Promise<number> {
  console.log('📊 Counting records that need migration...');

  const { count, error } = await supabase
    .from('foods')
    .select('*', { count: 'exact', head: true })
    .not('photo_url', 'is', null)
    .neq('photo_url', '');

  if (error) {
    throw new Error(`Failed to count records: ${error.message}`);
  }

  return count || 0;
}

async function migrateBatch(
  offset: number,
  batchSize: number
): Promise<{
  migrated: number;
  failed: number;
  skipped: number;
}> {
  console.log(`🔄 Processing batch starting at offset ${offset}...`);

  // Fetch batch of records that need migration
  const { data: foods, error: fetchError } = await supabase
    .from('foods')
    .select('id, photo_url, image_urls')
    .not('photo_url', 'is', null)
    .neq('photo_url', '')
    .range(offset, offset + batchSize - 1)
    .order('created_at', { ascending: true });

  if (fetchError) {
    console.error(
      `❌ Failed to fetch batch at offset ${offset}:`,
      fetchError.message
    );
    return { migrated: 0, failed: batchSize, skipped: 0 };
  }

  if (!foods || foods.length === 0) {
    console.log(`✅ No more records to process at offset ${offset}`);
    return { migrated: 0, failed: 0, skipped: 0 };
  }

  let migrated = 0;
  let failed = 0;
  let skipped = 0;

  // Process each record in the batch
  for (const food of foods) {
    try {
      // Skip if image_urls already has data
      if (food.image_urls && food.image_urls.length > 0) {
        console.log(`⏩ Skipping ${food.id} - image_urls already populated`);
        skipped++;
        continue;
      }

      // Skip if photo_url is empty
      if (!food.photo_url || food.photo_url.trim() === '') {
        console.log(`⏩ Skipping ${food.id} - empty photo_url`);
        skipped++;
        continue;
      }

      // Migrate photo_url to image_urls array
      const { error: updateError } = await supabase
        .from('foods')
        .update({
          image_urls: [food.photo_url],
          updated_at: new Date().toISOString(),
        })
        .eq('id', food.id);

      if (updateError) {
        console.error(`❌ Failed to migrate ${food.id}:`, updateError.message);
        failed++;
      } else {
        console.log(`✅ Migrated ${food.id}`);
        migrated++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${food.id}:`, error);
      failed++;
    }
  }

  return { migrated, failed, skipped };
}

async function runMigration(): Promise<void> {
  console.log('🚀 Starting chunked image_urls migration...');
  console.log(
    `📋 Configuration: batch_size=${BATCH_SIZE}, delay=${DELAY_BETWEEN_BATCHES}ms`
  );

  try {
    // Get total count
    const totalRecords = await getTotalRecordsToMigrate();
    console.log(`📊 Found ${totalRecords} records that need migration`);

    if (totalRecords === 0) {
      console.log('✅ No records need migration. Exiting.');
      return;
    }

    const stats: MigrationStats = {
      total: totalRecords,
      processed: 0,
      migrated: 0,
      failed: 0,
      skipped: 0,
    };

    // Process in batches
    let offset = 0;
    while (offset < totalRecords) {
      const batchResult = await migrateBatch(offset, BATCH_SIZE);

      stats.processed += BATCH_SIZE;
      stats.migrated += batchResult.migrated;
      stats.failed += batchResult.failed;
      stats.skipped += batchResult.skipped;

      console.log(
        `📈 Progress: ${Math.min(offset + BATCH_SIZE, totalRecords)}/${totalRecords} (${Math.round(((offset + BATCH_SIZE) / totalRecords) * 100)}%)`
      );
      console.log(
        `   Migrated: ${batchResult.migrated}, Failed: ${batchResult.failed}, Skipped: ${batchResult.skipped}`
      );

      offset += BATCH_SIZE;

      // Delay between batches to avoid overwhelming the database
      if (offset < totalRecords) {
        console.log(
          `⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`
        );
        await sleep(DELAY_BETWEEN_BATCHES);
      }
    }

    // Final summary
    console.log('\n📊 Migration Summary:');
    console.log(`   Total records processed: ${stats.total}`);
    console.log(`   Successfully migrated: ${stats.migrated}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log(`   Skipped: ${stats.skipped}`);
    console.log(
      `   Success rate: ${stats.total > 0 ? Math.round((stats.migrated / stats.total) * 100) : 0}%`
    );

    if (stats.failed > 0) {
      console.log(
        `\n⚠️  ${stats.failed} records failed to migrate. Check logs above for details.`
      );
      process.exit(1);
    } else {
      console.log('\n🎉 Migration completed successfully!');
    }
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Verify environment setup
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SECRET_KEY');
  console.error('\nPlease check your .env.local file.');
  process.exit(1);
}

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration().catch(error => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });
}

export { runMigration };
