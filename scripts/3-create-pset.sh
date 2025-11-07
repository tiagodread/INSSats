#!/bin/bash
set -euo pipefail

# ===== SCRIPT 3: CREATE PSET =====
# This script creates a PSET (Partially Signed Elements Transaction) for spending
# from a funded contract address.
#
# Usage:
#   ./3-create-pset.sh
#   FUNDING_TXID=abc123... ./3-create-pset.sh
#
# Environment Variables:
#   FUNDING_TXID           - The transaction ID that funded the contract (REQUIRED)
#   FUNDING_TXID_OVERRIDE  - Override for funding txid
#   RECIPIENT_ADDRESS      - Address to send funds to (default: Liquid testnet return address)
#   CONTRACT_AMOUNT        - Amount to send (default: 0.00099900)
#   CONTRACT_FEE          - Transaction fee (default: 0.00000100)
#   FUNDING_INFO_FILE     - JSON file with funding info from step 2 (default: ../tmp/funding-info.json)
#   OUTPUT_FILE           - File to save PSET info JSON (default: ../tmp/pset-info.json)
#   NO_PAUSE              - Set to skip interactive pauses (default: unset)

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
FUNDING_INFO_FILE="${FUNDING_INFO_FILE:-$PROJECT_ROOT/tmp/funding-info.json}"
OUTPUT_FILE="${OUTPUT_FILE:-$PROJECT_ROOT/tmp/pset-info.json}"

# Hardcoded address of the Liquid testnet for returning tLBTC
RECIPIENT_ADDRESS="${RECIPIENT_ADDRESS:-tlq1qq2g07nju42l0nlx0erqa3wsel2l8prnq96rlnhml262mcj7pe8w6ndvvyg237japt83z24m8gu4v3yfhaqvrqxydadc9scsmw}"
CONTRACT_AMOUNT="${CONTRACT_AMOUNT:-0.00099900}"
CONTRACT_FEE="${CONTRACT_FEE:-0.00000100}"

# Set the infra directory for docker commands
INFRA_DIR="${INFRA_DIR:-$PROJECT_ROOT/infra}"

# Determine funding transaction ID
if [ -n "${FUNDING_TXID_OVERRIDE:-}" ]; then
    FUNDING_TXID="$FUNDING_TXID_OVERRIDE"
elif [ -n "${FUNDING_TXID:-}" ]; then
    # Use from environment
    :
elif [ -f "$FUNDING_INFO_FILE" ]; then
    # Load from funding info file
    FUNDING_TXID=$(jq -r .txid "$FUNDING_INFO_FILE")
    if [ "$FUNDING_TXID" = "null" ] || [ -z "$FUNDING_TXID" ]; then
        echo "ERROR: Could not read txid from $FUNDING_INFO_FILE" >&2
        exit 1
    fi
else
    echo "ERROR: FUNDING_TXID is required" >&2
    echo "Usage:" >&2
    echo "  FUNDING_TXID=abc123... ./3-create-pset.sh" >&2
    echo "  OR ensure $FUNDING_INFO_FILE exists from step 2" >&2
    exit 1
fi

# Get unconfidential address (will use elements-cli if available, otherwise use as-is)
if command -v docker &> /dev/null; then
    # Test if docker compose and elementsd1 are available
    if (cd "$INFRA_DIR" && docker compose ps elementsd1 2>&1 | grep -q elementsd1); then
        ELEMENTS_CLI="docker compose -f $INFRA_DIR/docker-compose.yml exec -T elementsd1 elements-cli"
        RECIPIENT_ADDRESS_UNCONF=$($ELEMENTS_CLI validateaddress "$RECIPIENT_ADDRESS" 2>/dev/null | jq -r .unconfidential || echo "$RECIPIENT_ADDRESS")
        if [ "$RECIPIENT_ADDRESS_UNCONF" != "null" ] && [ -n "$RECIPIENT_ADDRESS_UNCONF" ]; then
            RECIPIENT_ADDRESS="$RECIPIENT_ADDRESS_UNCONF"
        fi
    fi
fi

echo "=== CREATE PSET ===" >&2
echo "Configuration:" >&2
echo "  FUNDING_TXID = $FUNDING_TXID" >&2
echo "  RECIPIENT_ADDRESS = $RECIPIENT_ADDRESS" >&2
echo "  CONTRACT_AMOUNT = $CONTRACT_AMOUNT" >&2
echo "  CONTRACT_FEE = $CONTRACT_FEE" >&2
echo "  INFRA_DIR = $INFRA_DIR" >&2
echo "  OUTPUT_FILE = $OUTPUT_FILE" >&2
echo >&2

pause

# ===== STEP 1: CREATE PSET =====
echo "Step 1: Creating PSET..." >&2

# Check if we have access to elements-cli via docker
if command -v docker &> /dev/null; then
    if (cd "$INFRA_DIR" && docker compose ps elementsd1 2>&1 | grep -q elementsd1); then
        echo "Using local elements-cli for PSET creation..." >&2
        ELEMENTS_CLI="docker compose -f $INFRA_DIR/docker-compose.yml exec -T elementsd1 elements-cli"
        
        # Create PSET
        echo "Command: $ELEMENTS_CLI createpsbt '[{\"txid\":\"$FUNDING_TXID\",\"vout\":0}]' '[{\"$RECIPIENT_ADDRESS\":$CONTRACT_AMOUNT},{\"fee\":$CONTRACT_FEE}]'" >&2
        
        PSET=$($ELEMENTS_CLI createpsbt \
            "[{\"txid\":\"$FUNDING_TXID\",\"vout\":0}]" \
            "[{\"$RECIPIENT_ADDRESS\":$CONTRACT_AMOUNT},{\"fee\":$CONTRACT_FEE}]")
        
        if [ -z "$PSET" ] || [ "$PSET" = "null" ]; then
            echo "ERROR: Failed to create PSET" >&2
            exit 1
        fi
        
        echo "✓ PSET created successfully" >&2
    else
        echo "ERROR: Docker container elementsd1 is not running" >&2
        echo "Please start it from the infra directory:" >&2
        echo "  cd $INFRA_DIR && docker compose up -d elementsd1" >&2
        exit 1
    fi
else
    echo "ERROR: Docker not available for PSET creation" >&2
    echo "You need either:" >&2
    echo "  1. Docker with elementsd1 running, OR" >&2
    echo "  2. Local elements-cli installation" >&2
    exit 1
fi

echo >&2

pause

# ===== STEP 2: DISPLAY RESULTS =====
echo "=== PSET CREATED ===" >&2
echo "PSET = $PSET"
echo "RECIPIENT_ADDRESS = $RECIPIENT_ADDRESS"
echo >&2

# ===== STEP 3: SAVE TO FILE =====
if [ "$OUTPUT_FILE" != "/dev/null" ]; then
    echo "Saving PSET information to $OUTPUT_FILE..." >&2
    
    # Create directory if it doesn't exist
    mkdir -p "$(dirname "$OUTPUT_FILE")"
    
    # Create JSON output
    cat > "$OUTPUT_FILE" << EOF
{
  "pset": "$PSET",
  "fundingTxid": "$FUNDING_TXID",
  "recipientAddress": "$RECIPIENT_ADDRESS",
  "amount": "$CONTRACT_AMOUNT",
  "fee": "$CONTRACT_FEE",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    
    echo "✓ PSET information saved to $OUTPUT_FILE" >&2
    echo >&2
fi

echo "=== SCRIPT COMPLETE ===" >&2
echo >&2
echo "Next step: Finalize PSET using 4-finalize-pset.sh" >&2
echo "  PSET=$PSET ./scripts/4-finalize-pset.sh" >&2
