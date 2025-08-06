/**
 * Integration test that makes REAL HTTP requests to our API
 * This tests the actual endpoint behavior, not mocks
 */

const fetch = require('node-fetch'); // or undici

async function testRealApiEndpoint() {
  console.log('🧪 Testing real API endpoint...');

  try {
    // 1. Start the server first (you'd do this manually or with a test script)
    // pnpm build && pnpm start

    // 2. Make a REAL HTTP request to our API
    const response = await fetch('http://localhost:3000/api/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      }),
    });

    // 3. Check the REAL response
    console.log('Status:', response.status);

    const data = await response.json();
    console.log('Response:', data);

    // 4. Assert what we expect
    if (response.status === 200) {
      console.log('✅ API works correctly!');
      console.log('✅ Got ingredients:', data.ingredients?.length || 0);
    } else {
      console.log('❌ API failed:', data.error?.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRealApiEndpoint();
