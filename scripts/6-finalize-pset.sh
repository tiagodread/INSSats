#!/usr/bin/env bash

# Script: 6-finalize-pset.sh
# Purpose: Finalize PSET by generating signatures, updating witness, and finalizing with hal-simplicity
# Dependencies: hal-simplicity, simc
# Input: PSET, CMR, INTERNAL_KEY, participant keys
# Output: Finalized PSET and raw transaction

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

# File paths
UPDATED_PSET_FILE="${UPDATED_PSET_FILE:-$PROJECT_ROOT/tmp/updated-pset-info.json}"
CONTRACT_FILE="${CONTRACT_FILE:-$PROJECT_ROOT/tmp/contract-info.json}"
PARTICIPANTS_FILE="${PARTICIPANTS_FILE:-$PROJECT_ROOT/tmp/participants-info.json}"
OUTPUT_FILE="${OUTPUT_FILE:-$PROJECT_ROOT/tmp/finalized-pset-info.json}"

echo "=== Step 6: Finalize PSET ===" >&2
echo "Script directory: $SCRIPT_DIR" >&2
echo "Updated PSET file: $UPDATED_PSET_FILE" >&2
echo "Contract file: $CONTRACT_FILE" >&2
echo "Participants file: $PARTICIPANTS_FILE" >&2
echo "Output file: $OUTPUT_FILE" >&2

# Load PSET from file
if [ -f "$UPDATED_PSET_FILE" ]; then
    echo "Loading PSET from $UPDATED_PSET_FILE" >&2
    PSET_FROM_FILE=$(jq -r '.pset' "$UPDATED_PSET_FILE")
else
    echo "Error: Updated PSET file not found at $UPDATED_PSET_FILE" >&2
    exit 1
fi

# Load contract info
if [ -f "$CONTRACT_FILE" ]; then
    echo "Loading contract info from $CONTRACT_FILE" >&2
    CMR_FROM_FILE=$(jq -r '.cmr' "$CONTRACT_FILE")
    INTERNAL_KEY_FROM_FILE=$(jq -r '.internalKey' "$CONTRACT_FILE")
    PROGRAM_SOURCE_FROM_FILE=$(jq -r '.programSource' "$CONTRACT_FILE")
else
    echo "Error: Contract file not found at $CONTRACT_FILE" >&2
    exit 1
fi

# Environment overrides
PSET="${PSET_OVERRIDE:-$PSET_FROM_FILE}"
CMR="${CMR_OVERRIDE:-$CMR_FROM_FILE}"
INTERNAL_KEY="${INTERNAL_KEY_OVERRIDE:-$INTERNAL_KEY_FROM_FILE}"
PROGRAM_SOURCE="${PROGRAM_SOURCE_OVERRIDE:-$PROGRAM_SOURCE_FROM_FILE}"

# Private keys for signing (2-of-3 multisig)
# In production, these would come from key manager based on participants
PRIVKEY_1="${PRIVKEY_1:-0000000000000000000000000000000000000000000000000000000000000001}"
PRIVKEY_3="${PRIVKEY_3:-0000000000000000000000000000000000000000000000000000000000000003}"

# Witness file template
WITNESS_FILE="${WITNESS_FILE:-$PROJECT_ROOT/contracts/p2ms.wit}"

# Validation
if [ -z "$PSET" ]; then
    echo "Error: PSET is required" >&2
    exit 1
fi

if [ -z "$CMR" ]; then
    echo "Error: CMR is required" >&2
    exit 1
fi

if [ ! -f "$PROGRAM_SOURCE" ]; then
    echo "Error: Program source file not found: $PROGRAM_SOURCE" >&2
    exit 1
fi

if [ ! -f "$WITNESS_FILE" ]; then
    echo "Error: Witness file not found: $WITNESS_FILE" >&2
    exit 1
fi

echo "PSET length: ${#PSET} chars" >&2
echo "CMR: $CMR" >&2
echo "Internal key: $INTERNAL_KEY" >&2
echo "Program source: $PROGRAM_SOURCE" >&2
echo "Witness file: $WITNESS_FILE" >&2

pause

# Create temporary directory for intermediate files
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

# ===== STEP 1: GENERATE SIGNATURES =====
echo "=== Generating Signatures ===" >&2

# Signature 1 (Alice)
echo "Signing on behalf of Alice using private key $PRIVKEY_1" >&2
SIGHASH_OUTPUT_1=$(hal-simplicity simplicity sighash "$PSET" 0 "$CMR" -x "$PRIVKEY_1" 2>&1) || {
    echo "Error generating signature 1:" >&2
    echo "$SIGHASH_OUTPUT_1" >&2
    exit 1
}

echo "$SIGHASH_OUTPUT_1" | jq >&2
SIGNATURE_1=$(echo "$SIGHASH_OUTPUT_1" | jq -r .signature)
echo "Alice's signature: $SIGNATURE_1" >&2

pause

# Signature 3 (Bob)
echo "Signing on behalf of Bob using private key $PRIVKEY_3" >&2
SIGHASH_OUTPUT_3=$(hal-simplicity simplicity sighash "$PSET" 0 "$CMR" -x "$PRIVKEY_3" 2>&1) || {
    echo "Error generating signature 3:" >&2
    echo "$SIGHASH_OUTPUT_3" >&2
    exit 1
}

echo "$SIGHASH_OUTPUT_3" | jq >&2
SIGNATURE_3=$(echo "$SIGHASH_OUTPUT_3" | jq -r .signature)
echo "Bob's signature: $SIGNATURE_3" >&2

pause

# ===== STEP 2: UPDATE WITNESS FILE =====
echo "=== Updating Witness File with Signatures ===" >&2

# Copy witness template to temp directory
cp "$WITNESS_FILE" "$TMPDIR/witness.wit"

echo "Original witness file:" >&2
cat "$TMPDIR/witness.wit" >&2
echo >&2

# Replace signatures in witness file
# For p2ms.wit format: [Some(0xSIG1), None, Some(0xSIG3)]
sed -i.bak "s/Some(0x[0-9a-f]*)/Some(0x$SIGNATURE_1)/" "$TMPDIR/witness.wit"
sed -i.bak "s/\(Some(0x$SIGNATURE_1)[^,]*, None, \)Some(0x[0-9a-f]*)/\1Some(0x$SIGNATURE_3)/" "$TMPDIR/witness.wit"

echo "Updated witness file:" >&2
cat "$TMPDIR/witness.wit" >&2
echo >&2

pause

# ===== STEP 3: COMPILE WITNESS ONLY =====
echo "=== Compiling Witness with Signatures ===" >&2

# Compile program with witness to extract the witness data
# We use the original program source (same as used to generate CMR)
echo "simc \"$PROGRAM_SOURCE\" \"$TMPDIR/witness.wit\"" >&2
SIMC_OUTPUT=$(simc "$PROGRAM_SOURCE" "$TMPDIR/witness.wit" 2>&1) || {
    echo "Error compiling witness:" >&2
    echo "$SIMC_OUTPUT" >&2
    exit 1
}

echo "$SIMC_OUTPUT" > "$TMPDIR/compiled-with-witness"

# Extract WITNESS from simc output (line 4: WITNESS in hex)
WITNESS=$(echo "$SIMC_OUTPUT" | sed -n '4p')

echo "WITNESS length: ${#WITNESS}" >&2
echo "WITNESS (first 50): ${WITNESS:0:50}..." >&2

if [ -z "$WITNESS" ]; then
    echo "Error: Failed to extract WITNESS from simc output" >&2
    exit 1
fi

# Use the original PROGRAM from contract-info.json (without witness)
# This ensures the CMR matches what's in the PSET
PROGRAM=$(jq -r '.compiledProgram' "$CONTRACT_FILE")

echo "Using original PROGRAM from contract (CMR: $CMR)" >&2
echo "PROGRAM length: ${#PROGRAM}" >&2
echo "PROGRAM (first 50): ${PROGRAM:0:50}..." >&2

if [ -z "$PROGRAM" ] || [ "$PROGRAM" = "null" ]; then
    echo "Error: Failed to get original PROGRAM from contract file" >&2
    exit 1
fi

pause

# ===== STEP 4: FINALIZE PSET =====
echo "=== Finalizing PSET ===" >&2

echo "hal-simplicity simplicity pset finalize \"$PSET\" 0 \"$PROGRAM\" \"$WITNESS\"" >&2
FINALIZE_OUTPUT=$(hal-simplicity simplicity pset finalize "$PSET" 0 "$PROGRAM" "$WITNESS" 2>&1) || {
    echo "Error finalizing PSET:" >&2
    echo "$FINALIZE_OUTPUT" >&2
    exit 1
}

echo "$FINALIZE_OUTPUT" | jq >&2

# Check for errors
if echo "$FINALIZE_OUTPUT" | jq -e '.error' > /dev/null 2>&1; then
    echo "Error: PSET finalization failed" >&2
    echo "$FINALIZE_OUTPUT" | jq >&2
    exit 1
fi

FINALIZED_PSET=$(echo "$FINALIZE_OUTPUT" | jq -r .pset)

if [ "$FINALIZED_PSET" = "null" ] || [ -z "$FINALIZED_PSET" ]; then
    echo "Error: Finalized PSET is null or empty" >&2
    exit 1
fi

echo "Finalized PSET length: ${#FINALIZED_PSET} chars" >&2

pause

# ===== STEP 5: FINALIZE PSBT (Extract Raw TX) =====
echo "=== Finalizing PSBT ===" >&2

# Use elements-cli via docker to finalize PSBT
ELEMENTS_CLI="docker compose -f $PROJECT_ROOT/infra/docker-compose.yml exec -T elementsd1 elements-cli"

echo "$ELEMENTS_CLI finalizepsbt \"$FINALIZED_PSET\"" >&2
FINALIZE_PSBT_OUTPUT=$($ELEMENTS_CLI finalizepsbt "$FINALIZED_PSET" 2>&1) || {
    echo "Error finalizing PSBT:" >&2
    echo "$FINALIZE_PSBT_OUTPUT" >&2
    exit 1
}

echo "$FINALIZE_PSBT_OUTPUT" | jq >&2

RAW_TX=$(echo "$FINALIZE_PSBT_OUTPUT" | jq -r '.hex // empty')

if [ -z "$RAW_TX" ]; then
    # Try without jq in case output is just the hex string
    RAW_TX=$(echo "$FINALIZE_PSBT_OUTPUT" | tr -d '"' | tr -d '\n')
fi

if [ -z "$RAW_TX" ]; then
    echo "Error: Raw transaction is null or empty" >&2
    exit 1
fi

echo "Raw transaction length: ${#RAW_TX} chars" >&2

pause

# Save to file
if [ "$OUTPUT_FILE" != "/dev/null" ]; then
    mkdir -p "$(dirname "$OUTPUT_FILE")"
    
    cat > "$OUTPUT_FILE" <<EOF
{
    "pset": "$FINALIZED_PSET",
    "rawTx": "$RAW_TX",
    "finalized": true,
    "signatures": {
        "signature1": "$SIGNATURE_1",
        "signature3": "$SIGNATURE_3"
    },
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    
    echo "Finalized PSET info saved to: $OUTPUT_FILE" >&2
fi

echo "" >&2
echo "=== PSET Finalization Complete ===" >&2

# Output key-value pairs for API
echo "PSET=$FINALIZED_PSET"
echo "RAW_TX=$RAW_TX"
echo "FINALIZED=true"

echo "" >&2
echo "Summary:" >&2
echo "  Finalized PSET: ${FINALIZED_PSET:0:50}..." >&2
echo "  Raw TX: ${RAW_TX:0:50}..." >&2
echo "  Ready to broadcast: Yes" >&2

# Cleanup temporary witness file if needed
[ "${CLEANUP_WITNESS:-false}" = "true" ] && rm -f "$WITNESS_PATH"

echo "" >&2
echo "Next step: Broadcast the transaction using 7-broadcast-transaction.sh" >&2
echo "  RAW_TX=$RAW_TX ./scripts/7-broadcast-transaction.sh" >&2

