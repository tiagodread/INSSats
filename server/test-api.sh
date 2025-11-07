#!/bin/bash

API_URL="${API_URL:-http://localhost:3001}"

echo "🧪 Testing INSSats Contract API"
echo "API URL: $API_URL"
echo

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s "$API_URL/health" | jq
echo
echo "---"
echo

# Test root endpoint
echo "2. Testing root endpoint..."
curl -s "$API_URL/" | jq
echo
echo "---"
echo

# Test contract creation
echo "3. Testing contract creation..."
RESPONSE=$(curl -s -X POST "$API_URL/contract/create" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "$RESPONSE" | jq

CONTRACT_ADDRESS=$(echo "$RESPONSE" | jq -r '.contractAddress')
CMR=$(echo "$RESPONSE" | jq -r '.cmr')

if [ "$CONTRACT_ADDRESS" = "null" ] || [ -z "$CONTRACT_ADDRESS" ]; then
    echo "❌ Contract creation failed"
    exit 1
fi

echo "✅ Contract created: $CONTRACT_ADDRESS"
echo "   CMR: $CMR"
echo
echo "---"
echo

# Test funding (requires faucet scripts)
echo "4. Testing contract funding..."
echo "⚠️  This requires faucet scripts to be configured"
echo "   Skipping for now. To test manually:"
echo "   curl -X POST $API_URL/contract/fund \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"contractAddress\": \"$CONTRACT_ADDRESS\"}'"
echo
echo "---"
echo

# Test transaction query
echo "5. Testing transaction query..."
echo "⚠️  This requires a valid transaction ID"
echo "   To test manually with a known TXID:"
echo "   curl $API_URL/contract/transaction/YOUR_TXID"
echo
echo "---"
echo

echo "✅ Basic API tests completed successfully!"
echo
echo "📝 Full workflow test:"
echo "   1. Create contract: ✅"
echo "   2. Fund contract: ⏭️  (requires faucet)"
echo "   3. Create PSET: ⏭️  (requires funded contract)"
echo "   4. Finalize PSET: ⏭️  (requires PSET)"
echo "   5. Broadcast: ⏭️  (requires finalized PSET)"
echo "   6. Query: ⏭️  (requires transaction ID)"
