#!/bin/bash
set -euo pipefail

# ===== SCRIPT 1: CREATE CONTRACT =====
# This script compiles a Simplicity program and generates contract information
# including CMR (commitment Merkle root), contract address, and bytecode.
#
# Usage:
#   ./1-create-contract.sh
#
# Environment Variables (optional):
#   PROGRAM_SOURCE - Path to the Simplicity source file (default: ../contracts/p2ms.simf)
#   INTERNAL_KEY   - Unspendable internal key for the contract (default: hardcoded NUMS key)
#   OUTPUT_FILE    - File to save contract info JSON (default: ../tmp/contract-info.json)
#   NO_PAUSE       - Set to skip interactive pauses (default: unset)

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
PROGRAM_SOURCE="${PROGRAM_SOURCE:-$PROJECT_ROOT/contracts/p2ms.simf}"

# This is an unspendable public key address.
# It is semi-hardcoded in some Simplicity tools. You can change it in order
# to make existing contract source code have a different address on the
# blockchain (I think) but you must use a NUMS method to make sure that
# the key is unspendable. If someone else offers you a contract, you must
# make sure that the internal key used for that instance of the contract
# is an unspendable value (if it is changed from this default). Otherwise
# the contract creator may be able to unilaterally steal value from
# the contract.
INTERNAL_KEY="${INTERNAL_KEY:-50929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0}"

# Output file for contract information
OUTPUT_FILE="${OUTPUT_FILE:-$PROJECT_ROOT/tmp/contract-info.json}"

echo "=== CREATE CONTRACT ==="
echo "Configuration:"
echo "  PROGRAM_SOURCE = $PROGRAM_SOURCE"
echo "  INTERNAL_KEY = $INTERNAL_KEY"
echo "  OUTPUT_FILE = $OUTPUT_FILE"
echo

pause

# ===== STEP 1: COMPILE SIMPLICITY PROGRAM =====
echo "Step 1: Compiling Simplicity program..."
echo "Command: simc $PROGRAM_SOURCE"
echo

if ! command -v simc &> /dev/null; then
    echo "ERROR: simc command not found"
    echo "Please install Simplicity tools"
    exit 1
fi

# Compile the program
COMPILED_PROGRAM=$(simc "$PROGRAM_SOURCE" | tail -1)

if [ -z "$COMPILED_PROGRAM" ]; then
    echo "ERROR: Failed to compile Simplicity program"
    exit 1
fi

echo "✓ Program compiled successfully"
echo

pause

# ===== STEP 2: EXTRACT PROGRAM INFO =====
echo "Step 2: Extracting program information..."
echo "Command: hal-simplicity simplicity info $COMPILED_PROGRAM"
echo

if ! command -v hal-simplicity &> /dev/null; then
    echo "ERROR: hal-simplicity command not found"
    echo "Please install hal-simplicity tools"
    exit 1
fi

# Get program info
PROGRAM_INFO=$(hal-simplicity simplicity info "$COMPILED_PROGRAM")

if [ -z "$PROGRAM_INFO" ]; then
    echo "ERROR: Failed to get program info"
    exit 1
fi

# Display the full info
echo "$PROGRAM_INFO" | jq

# Extract key values
BYTECODE=$(echo "$PROGRAM_INFO" | jq -r .commit_decode)
CMR=$(echo "$PROGRAM_INFO" | jq -r .cmr)
CONTRACT_ADDRESS=$(echo "$PROGRAM_INFO" | jq -r .liquid_testnet_address_unconf)

if [ -z "$CMR" ] || [ "$CMR" = "null" ]; then
    echo "ERROR: Failed to extract CMR from program info"
    exit 1
fi

if [ -z "$CONTRACT_ADDRESS" ] || [ "$CONTRACT_ADDRESS" = "null" ]; then
    echo "ERROR: Failed to extract contract address from program info"
    exit 1
fi

echo
echo "✓ Program info extracted successfully"
echo

pause

# ===== STEP 3: DISPLAY RESULTS =====
echo "=== CONTRACT CREATED ==="
echo "CMR = $CMR"
echo "CONTRACT_ADDRESS = $CONTRACT_ADDRESS"
echo "BYTECODE = $BYTECODE"
echo "INTERNAL_KEY = $INTERNAL_KEY"
echo "PROGRAM_SOURCE = $PROGRAM_SOURCE"
echo "COMPILED_PROGRAM = $COMPILED_PROGRAM"
echo

# ===== STEP 4: SAVE TO FILE =====
if [ "$OUTPUT_FILE" != "/dev/null" ]; then
    echo "Saving contract information to $OUTPUT_FILE..."
    
    # Create directory if it doesn't exist
    mkdir -p "$(dirname "$OUTPUT_FILE")"
    
    # Create JSON output
    cat > "$OUTPUT_FILE" << EOF
{
  "cmr": "$CMR",
  "contractAddress": "$CONTRACT_ADDRESS",
  "bytecode": "$BYTECODE",
  "internalKey": "$INTERNAL_KEY",
  "programSource": "$PROGRAM_SOURCE",
  "compiledProgram": "$COMPILED_PROGRAM",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    
    echo "✓ Contract information saved to $OUTPUT_FILE"
    echo
fi

echo "=== SCRIPT COMPLETE ==="
echo
echo "Next step: Fund the contract using 2-fund-contract.sh"
echo "  CONTRACT_ADDRESS=$CONTRACT_ADDRESS ./scripts/2-fund-contract.sh"
