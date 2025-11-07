#!/bin/bash
set -euo pipefail

# ===== SCRIPT 2: FUND CONTRACT =====
# This script funds a contract address using the Liquid Testnet faucet
# and extracts UTXO information needed for spending.
#
# Usage:
#   ./2-fund-contract.sh
#   CONTRACT_ADDRESS=tex1p... ./2-fund-contract.sh
#
# Environment Variables:
#   CONTRACT_ADDRESS       - The contract address to fund (REQUIRED if not using CONTRACT_INFO_FILE)
#   CONTRACT_INFO_FILE     - JSON file with contract info from step 1 (default: ../tmp/contract-info.json)
#   ESPLORA_API           - Esplora API endpoint (default: https://blockstream.info/liquidtestnet/api)
#   FAUCET_SCRIPT         - Path to faucet script (default: ~/faucet.sh)
#   EXTRACT_TX_SCRIPT     - Path to extract transaction script (default: ~/extract-transaction.sh)
#   OUTPUT_FILE           - File to save funding info JSON (default: ../tmp/funding-info.json)
#   NO_PAUSE              - Set to skip interactive pauses (default: unset)
#   CONTRACT_ADDRESS_OVERRIDE - Override address from contract info file

# Error handler
error_exit() {
    echo "ERROR: Script failed at line $1" >&2
    echo "Last command: $BASH_COMMAND" >&2
    exit 1
}

trap 'error_exit $LINENO' ERR

pause() {
  if [ -z "${NO_PAUSE:-}" ]; then
    read -p "Press Enter to continue..."
    echo
  fi
}

# Get the directory where the script is located and the project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Accept parameters from environment or use defaults
CONTRACT_INFO_FILE="${CONTRACT_INFO_FILE:-$PROJECT_ROOT/tmp/contract-info.json}"
ESPLORA_API="${ESPLORA_API:-https://blockstream.info/liquidtestnet/api}"
FAUCET_SCRIPT="${FAUCET_SCRIPT:-$SCRIPT_DIR/faucet.sh}"
EXTRACT_TX_SCRIPT="${EXTRACT_TX_SCRIPT:-$SCRIPT_DIR/extract-transaction.sh}"
OUTPUT_FILE="${OUTPUT_FILE:-$PROJECT_ROOT/tmp/funding-info.json}"

# Temporary directory for intermediate files
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

# Determine contract address
if [ -n "${CONTRACT_ADDRESS_OVERRIDE:-}" ]; then
    CONTRACT_ADDRESS="$CONTRACT_ADDRESS_OVERRIDE"
elif [ -n "${CONTRACT_ADDRESS:-}" ]; then
    # Use from environment
    :
elif [ -f "$CONTRACT_INFO_FILE" ]; then
    # Load from contract info file
    CONTRACT_ADDRESS=$(jq -r .contractAddress "$CONTRACT_INFO_FILE")
    if [ "$CONTRACT_ADDRESS" = "null" ] || [ -z "$CONTRACT_ADDRESS" ]; then
        echo "ERROR: Could not read contractAddress from $CONTRACT_INFO_FILE"
        exit 1
    fi
else
    echo "ERROR: CONTRACT_ADDRESS is required"
    echo "Usage:"
    echo "  CONTRACT_ADDRESS=tex1p... ./2-fund-contract.sh"
    echo "  OR ensure $CONTRACT_INFO_FILE exists from step 1"
    exit 1
fi

echo "=== FUND CONTRACT ===" >&2
echo "Configuration:" >&2
echo "  CONTRACT_ADDRESS = $CONTRACT_ADDRESS" >&2
echo "  ESPLORA_API = $ESPLORA_API" >&2
echo "  FAUCET_SCRIPT = $FAUCET_SCRIPT" >&2
echo "  EXTRACT_TX_SCRIPT = $EXTRACT_TX_SCRIPT" >&2
echo "  OUTPUT_FILE = $OUTPUT_FILE" >&2
echo >&2

pause

# ===== STEP 1: REQUEST FUNDS FROM FAUCET =====
echo "Step 1: Requesting funds from Liquid Testnet faucet..." >&2

# Check if faucet script exists
if [ ! -f "$FAUCET_SCRIPT" ]; then
    echo "ERROR: Faucet script not found at $FAUCET_SCRIPT" >&2
    echo "Please ensure the faucet script is available" >&2
    exit 1
fi

if [ ! -f "$EXTRACT_TX_SCRIPT" ]; then
    echo "ERROR: Extract transaction script not found at $EXTRACT_TX_SCRIPT" >&2
    echo "Please ensure the extract-transaction script is available" >&2
    exit 1
fi

echo "Requesting funds for address: $CONTRACT_ADDRESS" >&2
echo "Running: bash $FAUCET_SCRIPT $CONTRACT_ADDRESS | bash $EXTRACT_TX_SCRIPT" >&2
echo >&2

# Request funds from faucet and extract transaction ID
set +e  # Temporarily disable exit on error to capture faucet output
FAUCET_OUTPUT=$(bash "$FAUCET_SCRIPT" "$CONTRACT_ADDRESS" 2>&1)
FAUCET_EXIT_CODE=$?
set -e  # Re-enable exit on error

if [ $FAUCET_EXIT_CODE -ne 0 ]; then
    echo "ERROR: Faucet script failed with exit code $FAUCET_EXIT_CODE" >&2
    echo "Faucet output:" >&2
    echo "$FAUCET_OUTPUT" | tail -20 >&2
    exit 1
fi

FAUCET_TRANSACTION=$(echo "$FAUCET_OUTPUT" | bash "$EXTRACT_TX_SCRIPT")

if [ -z "$FAUCET_TRANSACTION" ]; then
    echo "ERROR: Failed to get transaction ID from faucet" >&2
    echo "The faucet may be rate-limited or unavailable" >&2
    echo "" >&2
    echo "Faucet output (last 10 lines):" >&2
    echo "$FAUCET_OUTPUT" | tail -10 >&2
    echo "" >&2
    echo "You can fund the contract manually and use the TXID with the next script:" >&2
    echo "  FUNDING_TXID=<your_txid> ./scripts/3-create-pset.sh" >&2
    exit 1
fi

echo "✓ Faucet request successful" >&2
echo "FAUCET_TRANSACTION = $FAUCET_TRANSACTION"
echo >&2

pause

# ===== STEP 2: WAIT FOR TRANSACTION TO BE AVAILABLE =====
echo "Step 2: Waiting for transaction to be indexed..." >&2
echo "Checking via Esplora API: $ESPLORA_API" >&2
echo >&2

MAX_ATTEMPTS=60
ATTEMPT=0
TX_DATA=""

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    echo "Attempt $((ATTEMPT+1))/$MAX_ATTEMPTS: Checking if transaction is available..." >&2
    
    TX_DATA=$(curl -s "$ESPLORA_API/tx/$FAUCET_TRANSACTION")
    
    if [ -n "$TX_DATA" ] && [ "$TX_DATA" != "Transaction not found" ]; then
        # Check if it's valid JSON
        if echo "$TX_DATA" | jq empty 2>/dev/null; then
            echo "✓ Transaction found and indexed!" >&2
            break
        fi
    fi
    
    ATTEMPT=$((ATTEMPT+1))
    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
        sleep 5
    fi
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "ERROR: Transaction not found after $MAX_ATTEMPTS attempts" >&2
    echo "Transaction ID: $FAUCET_TRANSACTION" >&2
    echo "You may need to wait longer or check the explorer manually:" >&2
    echo "https://blockstream.info/liquidtestnet/tx/$FAUCET_TRANSACTION" >&2
    exit 1
fi

# Save transaction data
echo "$TX_DATA" | jq > "$TMPDIR/faucet-tx-full.json"
echo >&2

pause

# ===== STEP 3: EXTRACT UTXO DETAILS =====
echo "Step 3: Extracting UTXO details..." >&2

# Get the output details for vout 0
VOUT_0=$(cat "$TMPDIR/faucet-tx-full.json" | jq '.vout[0]')

if [ -z "$VOUT_0" ] || [ "$VOUT_0" = "null" ]; then
    echo "ERROR: Could not extract vout[0] from transaction" >&2
    echo "Transaction data:" >&2
    cat "$TMPDIR/faucet-tx-full.json" | jq >&2
    exit 1
fi

echo "Output 0 details:" >&2
echo "$VOUT_0" | jq >&2
echo >&2

# Extract scriptPubKey (hex), asset, and value
SCRIPT_PUBKEY=$(echo "$VOUT_0" | jq -r '.scriptpubkey')
ASSET=$(echo "$VOUT_0" | jq -r '.asset')
VALUE_SATS=$(echo "$VOUT_0" | jq -r '.value')

if [ -z "$SCRIPT_PUBKEY" ] || [ "$SCRIPT_PUBKEY" = "null" ]; then
    echo "ERROR: Could not extract scriptpubkey" >&2
    exit 1
fi

if [ -z "$ASSET" ] || [ "$ASSET" = "null" ]; then
    echo "ERROR: Could not extract asset" >&2
    exit 1
fi

if [ -z "$VALUE_SATS" ] || [ "$VALUE_SATS" = "null" ]; then
    echo "ERROR: Could not extract value" >&2
    exit 1
fi

# Convert value from satoshis to BTC
VALUE=$(echo "scale=8; $VALUE_SATS / 100000000" | bc)

echo "✓ UTXO details extracted successfully" >&2
echo >&2

pause

# ===== STEP 4: DISPLAY RESULTS =====
echo "=== FUNDING COMPLETE ===" >&2
echo "FAUCET_TRANSACTION = $FAUCET_TRANSACTION"
echo "SCRIPT_PUBKEY = $SCRIPT_PUBKEY"
echo "ASSET = $ASSET"
echo "VALUE = $VALUE BTC ($VALUE_SATS satoshis)" >&2
echo "VALUE_SATS = $VALUE_SATS"
echo >&2

# ===== STEP 5: SAVE TO FILE =====
if [ "$OUTPUT_FILE" != "/dev/null" ]; then
    echo "Saving funding information to $OUTPUT_FILE..." >&2
    
    # Create directory if it doesn't exist
    mkdir -p "$(dirname "$OUTPUT_FILE")"
    
    # Create JSON output
    cat > "$OUTPUT_FILE" << EOF
{
  "txid": "$FAUCET_TRANSACTION",
  "vout": 0,
  "scriptPubkey": "$SCRIPT_PUBKEY",
  "asset": "$ASSET",
  "value": "$VALUE",
  "valueSats": $VALUE_SATS,
  "contractAddress": "$CONTRACT_ADDRESS",
  "explorerUrl": "https://blockstream.info/liquidtestnet/tx/$FAUCET_TRANSACTION",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    
    echo "✓ Funding information saved to $OUTPUT_FILE" >&2
    echo >&2
fi

echo "=== SCRIPT COMPLETE ===" >&2
echo >&2
echo "Next step: Create PSET using 3-create-pset.sh" >&2
echo "  FUNDING_TXID=$FAUCET_TRANSACTION ./scripts/3-create-pset.sh" >&2
