#!/bin/bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:3001}"

echo "====================================="
echo "  INSSats Complete Workflow Test"
echo "====================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test health endpoint
echo "Testing health endpoint..."
HEALTH=$(curl -s "$API_URL/health" || echo "FAILED")
if [[ "$HEALTH" == *"ok"* ]]; then
    echo -e "${GREEN}✓ Server is healthy${NC}"
else
    echo -e "${RED}✗ Server health check failed${NC}"
    exit 1
fi
echo

# 1. Create contract
echo "Step 1: Creating contract..."
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/contract/create" \
  -H "Content-Type: application/json" \
  -d '{}')

if [[ "$CREATE_RESPONSE" == *"error"* ]]; then
    echo -e "${RED}✗ Failed to create contract${NC}"
    echo "$CREATE_RESPONSE" | jq
    exit 1
fi

CONTRACT_ADDRESS=$(echo "$CREATE_RESPONSE" | jq -r '.contractAddress')
CMR=$(echo "$CREATE_RESPONSE" | jq -r '.cmr')
INTERNAL_KEY=$(echo "$CREATE_RESPONSE" | jq -r '.internalKey')
PROGRAM_SOURCE=$(echo "$CREATE_RESPONSE" | jq -r '.programSource')

echo -e "${GREEN}✓ Contract created${NC}"
echo "  Address: $CONTRACT_ADDRESS"
echo "  CMR: ${CMR:0:16}..."
echo

# 2. Fund contract
echo "Step 2: Funding contract..."
FUND_RESPONSE=$(curl -s -X POST "$API_URL/contract/fund" \
  -H "Content-Type: application/json" \
  -d "{\"contractAddress\": \"$CONTRACT_ADDRESS\"}")

if [[ "$FUND_RESPONSE" == *"error"* ]]; then
    echo -e "${RED}✗ Failed to fund contract${NC}"
    echo "$FUND_RESPONSE" | jq
    exit 1
fi

TXID=$(echo "$FUND_RESPONSE" | jq -r '.txid')
SCRIPT_PUBKEY=$(echo "$FUND_RESPONSE" | jq -r '.scriptPubkey')
ASSET=$(echo "$FUND_RESPONSE" | jq -r '.asset')
VALUE=$(echo "$FUND_RESPONSE" | jq -r '.value')

echo -e "${GREEN}✓ Contract funded${NC}"
echo "  TXID: ${TXID:0:16}..."
echo "  Value: $VALUE"
echo

# 3. Create PSET
echo "Step 3: Creating PSET..."
PSET_RESPONSE=$(curl -s -X POST "$API_URL/contract/pset/create" \
  -H "Content-Type: application/json" \
  -d "{\"txid\": \"$TXID\"}")

if [[ "$PSET_RESPONSE" == *"error"* ]]; then
    echo -e "${RED}✗ Failed to create PSET${NC}"
    echo "$PSET_RESPONSE" | jq
    exit 1
fi

PSET=$(echo "$PSET_RESPONSE" | jq -r '.pset')
RECIPIENT=$(echo "$PSET_RESPONSE" | jq -r '.recipientAddress')

echo -e "${GREEN}✓ PSET created${NC}"
echo "  Recipient: ${RECIPIENT:0:20}..."
echo

# 4. Finalize PSET
echo "Step 4: Finalizing PSET..."
FINALIZE_RESPONSE=$(curl -s -X POST "$API_URL/contract/pset/finalize" \
  -H "Content-Type: application/json" \
  -d "{
    \"pset\": \"$PSET\",
    \"scriptPubkey\": \"$SCRIPT_PUBKEY\",
    \"asset\": \"$ASSET\",
    \"value\": \"$VALUE\"
  }")

if [[ "$FINALIZE_RESPONSE" == *"error"* ]]; then
    echo -e "${RED}✗ Failed to finalize PSET${NC}"
    echo "$FINALIZE_RESPONSE" | jq
    exit 1
fi

RAW_TX=$(echo "$FINALIZE_RESPONSE" | jq -r '.rawTx')
SIGNATURE=$(echo "$FINALIZE_RESPONSE" | jq -r '.signature')

echo -e "${GREEN}✓ PSET finalized${NC}"
echo "  Signature: ${SIGNATURE:0:16}..."
echo

# 5. Broadcast transaction
echo "Step 5: Broadcasting transaction..."
BROADCAST_RESPONSE=$(curl -s -X POST "$API_URL/contract/broadcast" \
  -H "Content-Type: application/json" \
  -d "{\"rawTx\": \"$RAW_TX\"}")

if [[ "$BROADCAST_RESPONSE" == *"error"* ]]; then
    echo -e "${RED}✗ Failed to broadcast transaction${NC}"
    echo "$BROADCAST_RESPONSE" | jq
    exit 1
fi

CLAIM_TXID=$(echo "$BROADCAST_RESPONSE" | jq -r '.txid')
EXPLORER_URL=$(echo "$BROADCAST_RESPONSE" | jq -r '.explorerUrl')

echo -e "${GREEN}✓ Transaction broadcast${NC}"
echo "  TXID: ${CLAIM_TXID:0:16}..."
echo

# 6. Query transaction
echo "Step 6: Querying transaction..."
echo -e "${YELLOW}⏳ Waiting 5 seconds for blockchain indexing...${NC}"
sleep 5

QUERY_RESPONSE=$(curl -s "$API_URL/contract/transaction/$CLAIM_TXID")

if [[ "$QUERY_RESPONSE" == *"error"* ]]; then
    echo -e "${YELLOW}⚠ Transaction query returned error (may be pending)${NC}"
    echo "$QUERY_RESPONSE" | jq
else
    CONFIRMED=$(echo "$QUERY_RESPONSE" | jq -r '.confirmed')
    if [[ "$CONFIRMED" == "true" ]]; then
        echo -e "${GREEN}✓ Transaction confirmed${NC}"
    else
        echo -e "${YELLOW}⏳ Transaction pending confirmation${NC}"
    fi
fi
echo

echo "====================================="
echo -e "${GREEN}✅ Complete workflow finished!${NC}"
echo "====================================="
echo
echo "Summary:"
echo "  Contract: $CONTRACT_ADDRESS"
echo "  Funding TX: ${TXID:0:16}..."
echo "  Claim TX: ${CLAIM_TXID:0:16}..."
echo
echo "🔗 Explorer:"
echo "   $EXPLORER_URL"
echo
