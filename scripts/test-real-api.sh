#!/bin/bash
# Script to test real API endpoints

echo "🏗️  Building production version..."
pnpm build

echo "🚀 Starting production server..."
# Kill any existing server
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start server in background
nohup pnpm start > /tmp/eatZone-test.log 2>&1 &
SERVER_PID=$!

echo "⏳ Waiting for server to start..."
sleep 5

# Check if server is running
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Server is running at http://localhost:3000"
    
    echo "🧪 Running real API tests..."
    pnpm test:real-api
    
    echo "📋 Test complete!"
else
    echo "❌ Server failed to start"
    cat /tmp/eatZone-test.log
fi

# Cleanup
echo "🧹 Stopping server..."
kill $SERVER_PID 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "✨ Done!"