#!/bin/bash

# Demo script for Hedera DID MVP
# Run this after starting the server with: npm run dev

BASE_URL="http://localhost:3000/api"

# Generate a new UUID for each demo run to make it reusable
if command -v uuidgen &> /dev/null; then
    USER_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
elif command -v python3 &> /dev/null; then
    USER_ID=$(python3 -c "import uuid; print(str(uuid.uuid4()))")
else
    # Exit if we can't generate a proper UUID
    echo "❌ Neither uuidgen nor python3 is available to generate UUID"
    echo "Please install either coreutils (for uuidgen) or python3"
    exit 1
fi

echo "🆔 Generated User ID: $USER_ID"

echo "🚀 Starting Hedera DID Demo..."
echo "================================================"

# Function to make API calls and pretty print JSON
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo
    echo "📋 $description"
    echo "   $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -X GET "$BASE_URL$endpoint" -H "Content-Type: application/json")
    else
        response=$(curl -s -X "$method" "$BASE_URL$endpoint" -H "Content-Type: application/json" -d "$data")
    fi
    
    echo "   Response:"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    echo
}

# Check if server is running
echo "🔍 Checking if server is running..."
health_check=$(curl -s "$BASE_URL/health" 2>/dev/null || echo "")
if [[ $health_check == *"\"success\":true"* ]]; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running. Please start with: npm run dev"
    exit 1
fi

# First, create a user in the database for our demo
echo
echo "📋 Creating demo user in database"
echo "   POST /users"
echo "   Request: {\"balance\": 100, \"user_id\": \"$USER_ID\"}"

user_response=$(curl -s -X POST "$BASE_URL/users" -H "Content-Type: application/json" -d '{"balance": 100, "user_id": "'$USER_ID'"}')
echo "   Response:"
echo "$user_response" | python3 -m json.tool 2>/dev/null || echo "$user_response"

# Verify the user was created successfully
if [[ $user_response == *"\"success\":true"* ]]; then
    echo "✅ User created successfully with ID: $USER_ID"
else
    echo "❌ Failed to create user. This might be because:"
    echo "   - User with this ID already exists"
    echo "   - Database connection issue"
    echo "   - Invalid UUID format"
    echo "   Continuing with generated ID anyway: $USER_ID"
fi
echo

# 1. Create merchant DID
api_call "POST" "/did/users" '{"user_id":"'$USER_ID'"}' "Creating merchant DID"

# 2. Get the created DID
api_call "GET" "/did/users/$USER_ID" "" "Retrieving merchant DID"

# 3. Simulate a payment with DID logging (using realistic account IDs)
api_call "POST" "/transactions" '{
    "fromAccountId": "0.0.6435129",
    "toAccountId": "0.0.6435130",
    "amount": 15.75,
    "memo": "Payment for demo services",
    "merchant_user_id": "'$USER_ID'"
}' "Processing payment with DID logging (may fail if accounts not in DB - this is expected)"

# 4. Log another transaction directly
api_call "POST" "/did/transactions" '{
    "merchant_user_id": "'$USER_ID'",
    "hedera_account": "0.0.6435130",
    "txn_id": "0.0.6435129@'$(date +%s)'.123456789",
    "amount": "250 ZAR"
}' "Logging transaction directly to DID"

echo "================================================"
echo "✅ Demo completed!"
echo
echo "🆔 Demo User ID: $USER_ID"
echo "📖 Check the Hedera Explorer links in the responses above to verify"
echo "   the HCS messages were published successfully."
echo
echo "🔗 Example Explorer URL: https://hashscan.io/testnet/transaction/{transactionId}"
echo
echo "📋 You can also check your Supabase users table to see the DID column populated."
echo "🔄 Run this script again for a fresh demo with a new user."
