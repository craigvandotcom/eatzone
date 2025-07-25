/**
 * PWA Storage Test Utility
 * 
 * This file provides utilities to test PWA storage functionality.
 * Can be run in browser console to verify storage works correctly.
 */

import { pwaStorage } from './pwa-storage';

export async function testPWAStorage() {
  console.log('🧪 Testing PWA Storage...');
  
  const testKey = 'pwa_test_token';
  const testValue = 'test_token_12345';
  
  try {
    // Test storage
    console.log('📝 Storing test token...');
    await pwaStorage.setItem(testKey, testValue, 5 * 60 * 1000); // 5 minutes
    
    // Test retrieval
    console.log('📖 Retrieving test token...');
    const retrieved = await pwaStorage.getItem(testKey);
    
    if (retrieved === testValue) {
      console.log('✅ Storage test passed!');
    } else {
      console.error('❌ Storage test failed - value mismatch');
      console.log('Expected:', testValue);
      console.log('Got:', retrieved);
    }
    
    // Test environment detection
    const recommendations = pwaStorage.getStorageRecommendations();
    console.log('🔍 Environment Detection:');
    console.log(`  PWA: ${recommendations.isPWA}`);
    console.log(`  iOS: ${recommendations.isIOS}`);
    console.log('  Recommendations:');
    recommendations.recommendations.forEach(rec => console.log(`    - ${rec}`));
    
    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await pwaStorage.removeItem(testKey);
    
    console.log('🎉 PWA Storage test completed successfully!');
    
  } catch (error) {
    console.error('❌ PWA Storage test failed:', error);
  }
}

// Export for console testing
if (typeof window !== 'undefined') {
  (window as any).testPWAStorage = testPWAStorage;
  console.log('💡 Run testPWAStorage() in console to test PWA storage');
}