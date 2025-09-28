#!/bin/bash

# Test script for purging all transaction caches
# Make sure your backend server is running on localhost:3000

echo "🧹 Testing Purge All Caches Endpoint"
echo "====================================="

# Test the purge all caches endpoint
echo "📡 Calling POST /api/hedera/purge-all-caches..."
echo ""

response=$(curl -s -X POST http://localhost:3000/api/hedera/purge-all-caches \
  -H "Content-Type: application/json")

echo "📋 Response:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"

echo ""
echo "✅ Test completed!"
echo ""
echo "💡 Usage examples:"
echo "   # Purge all caches"
echo "   curl -X POST http://localhost:3000/api/hedera/purge-all-caches"
echo ""
echo "   # Purge specific account"
echo "   curl -X POST http://localhost:3000/api/hedera/purge-cache/0.0.123456"
echo ""
echo "   # Force refresh specific account"
echo "   curl -X POST 'http://localhost:3000/api/hedera/refresh-data/0.0.123456?limit=100'"
