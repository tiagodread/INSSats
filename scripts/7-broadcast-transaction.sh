#!/usr/bin/env bash

# Script: 7-broadcast-transaction.sh
# Purpose: Broadcast finalized transaction to Liquid testnet
# Dependencies: curl, jq
# Input: RAW_TX
# Output: TXID and transaction status

set -euo pipefail

# Error handler
error_exit() {
    echo "Error on line $1" >&2
    echo "Command: ${BASH_COMMAND}" >&2
    exit 1
}

trap 'error_exit $LINENO' ERR

# Pause function for debugging
pause() {
    if [ "${NO_PAUSE:-}" != "1" ]; then
        echo "Press any key to continue..." >&2
        read -n 1 -s
    fi
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Esplora API endpoint
ESPLORA_API="${ESPLORA_API:-https://blockstream.info/liquidtestnet/api}"

# File paths
FINALIZED_PSET_FILE="${FINALIZED_PSET_FILE:-$PROJECT_ROOT/tmp/finalized-pset-info.json}"
OUTPUT_FILE="${OUTPUT_FILE:-$PROJECT_ROOT/tmp/broadcast-info.json}"

echo "=== Step 7: Broadcast Transaction ===" >&2
echo "Script directory: $SCRIPT_DIR" >&2
echo "Finalized PSET file: $FINALIZED_PSET_FILE" >&2
echo "Esplora API: $ESPLORA_API" >&2
echo "Output file: $OUTPUT_FILE" >&2

# Load raw transaction from file
if [ -f "$FINALIZED_PSET_FILE" ]; then
    echo "Loading raw transaction from $FINALIZED_PSET_FILE" >&2
    RAW_TX_FROM_FILE=$(jq -r '.rawTx' "$FINALIZED_PSET_FILE")
else
    echo "Warning: Finalized PSET file not found at $FINALIZED_PSET_FILE" >&2
    RAW_TX_FROM_FILE=""
fi

# Environment override
RAW_TX="${RAW_TX_OVERRIDE:-$RAW_TX_FROM_FILE}"

# Validation
if [ -z "$RAW_TX" ]; then
    echo "Error: RAW_TX is required (from file or RAW_TX_OVERRIDE)" >&2
    exit 1
fi

echo "Raw transaction length: ${#RAW_TX} chars" >&2
echo "Raw TX (first 100): ${RAW_TX:0:100}..." >&2

pause

# ===== BROADCAST TRANSACTION =====
echo "=== Broadcasting Transaction ===" >&2
echo "Submitting raw transaction via Esplora API..." >&2
echo "POST $ESPLORA_API/tx" >&2

BROADCAST_OUTPUT=$(curl -s -X POST "$ESPLORA_API/tx" -d "$RAW_TX" 2>&1) || {
    echo "Error broadcasting transaction:" >&2
    echo "$BROADCAST_OUTPUT" >&2
    exit 1
}

echo "Broadcast response: $BROADCAST_OUTPUT" >&2

# The response should be the transaction ID
TXID="$BROADCAST_OUTPUT"

# Validate TXID (should be 64 hex characters)
if ! [[ "$TXID" =~ ^[0-9a-f]{64}$ ]]; then
    echo "Error: Invalid TXID format received" >&2
    echo "Response: $TXID" >&2
    
    # Check if it's an error message
    if echo "$TXID" | grep -q -i "error\|invalid\|failed"; then
        echo "Broadcast failed with error message" >&2
        exit 1
    fi
    
    # Maybe it's wrapped in quotes
    TXID=$(echo "$TXID" | tr -d '"' | tr -d '\n')
    
    if ! [[ "$TXID" =~ ^[0-9a-f]{64}$ ]]; then
        echo "Error: Could not extract valid TXID" >&2
        exit 1
    fi
fi

echo "Transaction broadcast successful!" >&2
echo "TXID: $TXID" >&2

EXPLORER_URL="https://blockstream.info/liquidtestnet/tx/$TXID?expand"
echo "View online at: $EXPLORER_URL" >&2

pause

# ===== VERIFY TRANSACTION =====
echo "=== Verifying Transaction ===" >&2
echo "Waiting for transaction to be indexed by Esplora API..." >&2

MAX_ATTEMPTS=30
ATTEMPT=0
TX_FOUND=false
TX_DATA=""

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    echo "Attempt $((ATTEMPT+1))/$MAX_ATTEMPTS: Checking transaction status..." >&2
    
    TX_DATA=$(curl -s "$ESPLORA_API/tx/$TXID" 2>&1 || echo "")
    
    # Check if response is valid JSON
    if echo "$TX_DATA" | jq empty 2>/dev/null; then
        echo "Transaction found and confirmed!" >&2
        TX_FOUND=true
        break
    fi
    
    ATTEMPT=$((ATTEMPT+1))
    
    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
        sleep 3
    fi
done

if [ "$TX_FOUND" = "false" ]; then
    echo "Transaction not yet indexed after $MAX_ATTEMPTS attempts." >&2
    echo "Response from API:" >&2
    echo "$TX_DATA" >&2
    echo "" >&2
    echo "Note: Transaction may still be pending in mempool." >&2
    echo "Check the explorer link for current status." >&2
    
    TX_STATUS="pending"
else
    echo "Transaction data:" >&2
    echo "$TX_DATA" | jq >&2
    TX_STATUS="confirmed"
fi

pause

# Save to file
if [ "$OUTPUT_FILE" != "/dev/null" ]; then
    mkdir -p "$(dirname "$OUTPUT_FILE")"
    
    if [ "$TX_FOUND" = "true" ]; then
        cat > "$OUTPUT_FILE" <<EOF
{
    "txid": "$TXID",
    "status": "$TX_STATUS",
    "explorerUrl": "$EXPLORER_URL",
    "rawTx": "$RAW_TX",
    "transaction": $TX_DATA,
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    else
        cat > "$OUTPUT_FILE" <<EOF
{
    "txid": "$TXID",
    "status": "$TX_STATUS",
    "explorerUrl": "$EXPLORER_URL",
    "rawTx": "$RAW_TX",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    fi
    
    echo "Broadcast info saved to: $OUTPUT_FILE" >&2
fi

echo "" >&2
echo "=== Transaction Broadcast Complete ===" >&2

# Output key-value pairs for API
echo "TXID=$TXID"
echo "STATUS=$TX_STATUS"
echo "EXPLORER_URL=$EXPLORER_URL"

echo "" >&2
echo "Summary:" >&2
echo "  TXID: $TXID" >&2
echo "  Status: $TX_STATUS" >&2
echo "  Explorer: $EXPLORER_URL" >&2
