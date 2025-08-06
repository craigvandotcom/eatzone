#!/usr/bin/env node

/**
 * Direct API Testing Script
 * Makes real HTTP requests to test actual API behavior
 * No Jest, no mocks - just pure HTTP requests
 */

async function testApi() {
  const BASE_URL = 'http://localhost:3000';

  console.log('🧪 Testing Real API Endpoints...\n');

  // Helper to make requests
  async function makeRequest(endpoint, options = {}) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const contentType = response.headers.get('content-type');
      const data = contentType?.includes('application/json')
        ? await response.json()
        : await response.text();

      return {
        status: response.status,
        ok: response.ok,
        data,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      return {
        status: 0,
        ok: false,
        data: { error: error.message },
      };
    }
  }

  // Test 1: Check if server is running
  console.log('1️⃣  Testing server availability...');
  const serverCheck = await makeRequest('/');
  if (!serverCheck.ok) {
    console.log(
      '❌ Server not running. Please start with: pnpm build && pnpm start'
    );
    process.exit(1);
  }
  console.log('✅ Server is running\n');

  // Test 2: AI Status
  console.log('2️⃣  Testing AI Status endpoint...');
  const aiStatus = await makeRequest('/api/ai-status');
  console.log(`   Status: ${aiStatus.status}`);
  console.log(`   Response:`, aiStatus.data);
  console.log(`   Result: ${aiStatus.ok ? '✅ PASS' : '❌ FAIL'}\n`);

  // Test 3: Image Analysis - Valid request
  console.log('3️⃣  Testing Image Analysis - Valid 1x1 pixel...');
  const testImage =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  const imageAnalysis = await makeRequest('/api/analyze-image', {
    method: 'POST',
    body: JSON.stringify({ image: testImage }),
  });

  console.log(`   Status: ${imageAnalysis.status}`);
  if (imageAnalysis.ok) {
    console.log(`   Meal Summary: "${imageAnalysis.data.mealSummary}"`);
    console.log(
      `   Ingredients Count: ${imageAnalysis.data.ingredients?.length || 0}`
    );
    console.log(`   Result: ✅ PASS - API correctly processes images!`);
  } else {
    console.log(`   Error:`, imageAnalysis.data);
    console.log(`   Result: ❌ FAIL - API not working`);
  }
  console.log();

  // Test 4: Image Analysis - Invalid request
  console.log('4️⃣  Testing Image Analysis - Invalid request...');
  const invalidImage = await makeRequest('/api/analyze-image', {
    method: 'POST',
    body: JSON.stringify({}), // Missing image
  });

  console.log(`   Status: ${invalidImage.status}`);
  console.log(`   Error Code: ${invalidImage.data?.error?.code}`);
  console.log(
    `   Result: ${invalidImage.status === 400 ? '✅ PASS' : '❌ FAIL'} - Validation working\n`
  );

  // Test 5: Zone Ingredients
  console.log('5️⃣  Testing Zone Ingredients - Real ingredients...');
  const zoneTest = await makeRequest('/api/zone-ingredients', {
    method: 'POST',
    body: JSON.stringify({
      ingredients: ['spinach', 'white bread', 'olive oil'],
    }),
  });

  console.log(`   Status: ${zoneTest.status}`);
  if (zoneTest.ok) {
    console.log(`   Zoned ingredients:`);
    zoneTest.data.ingredients?.forEach(ing => {
      console.log(`     • ${ing.name}: ${ing.zone} zone`);
    });
    console.log(`   Result: ✅ PASS - Zoning works!`);
  } else {
    console.log(`   Error:`, zoneTest.data);
    console.log(`   Result: ❌ FAIL - Zoning not working`);
  }
  console.log();

  // Test 6: Middleware - API routes accessible
  console.log('6️⃣  Testing Middleware - API accessibility...');
  const middlewareTests = [
    { endpoint: '/api/ai-status', method: 'GET' },
    { endpoint: '/api/analyze-image', method: 'POST', body: '{}' },
    {
      endpoint: '/api/zone-ingredients',
      method: 'POST',
      body: '{"ingredients":[]}',
    },
  ];

  for (const test of middlewareTests) {
    const result = await makeRequest(test.endpoint, {
      method: test.method,
      body: test.body,
    });

    // Should not redirect (307) or be unauthorized (401)
    const accessible = ![307, 401].includes(result.status);
    console.log(
      `   ${test.endpoint}: ${result.status} ${accessible ? '✅' : '❌'}`
    );
  }
  console.log();

  console.log('🎉 Real API Testing Complete!');
  console.log('\n📊 Summary:');
  console.log('   • Server: Running');
  console.log('   • Image Analysis: Tests real OpenRouter integration');
  console.log('   • Zone Ingredients: Tests real AI zoning');
  console.log('   • Middleware: API routes accessible without auth');
  console.log('   • No mocks: All tests use actual HTTP requests');
}

// Run the tests
testApi().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
