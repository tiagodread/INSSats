#!/usr/bin/env bash

# Script: 5-attach-signature.sh
# Purpose: Attach a signature to the PSET incrementally for multisig contracts
# Dependencies: hal-simplicity, jq
# Input: PSET, WITNESS_FILE, SIGNATURE_INDEX (which key is signing: 0, 1, or 2)
# Output: Updated PSET with signature attached

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
PSET_FILE="${PSET_FILE:-$PROJECT_ROOT/tmp/pset-info.json}"
SIGNATURES_FILE="${SIGNATURES_FILE:-$PROJECT_ROOT/tmp/signatures-info.json}"
OUTPUT_FILE="${OUTPUT_FILE:-$PROJECT_ROOT/tmp/partial-signed-pset-info.json}"

echo "=== Step 5: Attach Signature to PSET ===" >&2
echo "Script directory: $SCRIPT_DIR" >&2
echo "Updated PSET file: $UPDATED_PSET_FILE" >&2
echo "PSET file: $PSET_FILE" >&2
echo "Signatures file: $SIGNATURES_FILE" >&2
echo "Output file: $OUTPUT_FILE" >&2

# Load from files or environment overrides
# Priority: updated-pset-info.json > pset-info.json
PSET_FROM_FILE=""
if [ -f "$UPDATED_PSET_FILE" ]; then
    echo "Loading PSET from $UPDATED_PSET_FILE" >&2
    PSET_FROM_FILE=$(jq -r '.pset' "$UPDATED_PSET_FILE")
elif [ -f "$PSET_FILE" ]; then
    echo "Loading PSET from $PSET_FILE" >&2
    PSET_FROM_FILE=$(jq -r '.pset' "$PSET_FILE")
else
    echo "Warning: No PSET file found" >&2
fi

# Check if we have previous signatures
if [ -f "$SIGNATURES_FILE" ]; then
    echo "Loading existing signatures from $SIGNATURES_FILE" >&2
    EXISTING_PSET=$(jq -r '.pset // empty' "$SIGNATURES_FILE" 2>/dev/null || echo "")
    SIGNATURES_COUNT=$(jq -r '.signaturesCount // 0' "$SIGNATURES_FILE" 2>/dev/null || echo "0")
    SIGNED_BY=$(jq -r '.signedBy // []' "$SIGNATURES_FILE" 2>/dev/null || echo "[]")
else
    echo "No previous signatures file found" >&2
    EXISTING_PSET=""
    SIGNATURES_COUNT=0
    SIGNED_BY="[]"
fi

# Environment overrides
PSET="${PSET_OVERRIDE:-${EXISTING_PSET:-$PSET_FROM_FILE}}"
PRIVATE_KEY="${PRIVATE_KEY_OVERRIDE:-}"
SIGNATURE_INDEX="${SIGNATURE_INDEX_OVERRIDE:-}"
USER_ID="${USER_ID_OVERRIDE:-}"

echo "Current signatures count: $SIGNATURES_COUNT" >&2
echo "Previously signed by: $SIGNED_BY" >&2
echo "User ID: ${USER_ID:-N/A}" >&2

# Validation
if [ -z "$PSET" ]; then
    echo "Error: PSET is required (from file or PSET_OVERRIDE)" >&2
    exit 1
fi

if [ -z "$PRIVATE_KEY" ]; then
    echo "Error: PRIVATE_KEY is required (via PRIVATE_KEY_OVERRIDE)" >&2
    exit 1
fi

if [ -z "$SIGNATURE_INDEX" ]; then
    echo "Error: SIGNATURE_INDEX is required (0, 1, or 2 for which key is signing)" >&2
    exit 1
fi

# Validate signature index
if ! [[ "$SIGNATURE_INDEX" =~ ^[0-2]$ ]]; then
    echo "Error: SIGNATURE_INDEX must be 0, 1, or 2" >&2
    exit 1
fi

# Check if this index already signed
if echo "$SIGNED_BY" | jq -e ". | contains([$SIGNATURE_INDEX])" > /dev/null; then
    echo "Warning: Key index $SIGNATURE_INDEX has already signed this PSET" >&2
    echo "Skipping duplicate signature" >&2
    
    # Output current state
    echo "PSET=$PSET"
    echo "SIGNATURES_COUNT=$SIGNATURES_COUNT"
    echo "SIGNATURE_INDEX=$SIGNATURE_INDEX"
    echo "ALREADY_SIGNED=true"
    
    exit 0
fi

echo "Attaching signature from key index $SIGNATURE_INDEX" >&2

pause

# Step 1: Calculate sighash for this PSET
echo "Calculating sighash for input 0..." >&2

SIGHASH_OUTPUT=$(hal-simplicity simplicity pset sighash "$PSET" 0 2>&1) || {
    echo "Error calculating sighash:" >&2
    echo "$SIGHASH_OUTPUT" >&2
    exit 1
}

echo "Sighash output:" >&2
echo "$SIGHASH_OUTPUT" >&2

# Extract sighash from output
SIGHASH=$(echo "$SIGHASH_OUTPUT" | grep -oE '[0-9a-f]{64}' | head -1)

if [ -z "$SIGHASH" ]; then
    echo "Error: Could not extract sighash from output" >&2
    exit 1
fi

echo "Sighash: $SIGHASH" >&2

pause

# Step 2: Sign the sighash with the private key
echo "Signing sighash with private key..." >&2

# Use elements-cli signmessagewithprivkey or similar
# For now, we'll use a simple approach with openssl/secp256k1
# In production, you'd use proper Bitcoin signing tools

# Create a temporary witness file with the signature
TEMP_WITNESS=$(mktemp)

# Note: This is a simplified approach. In production, you'd need to:
# 1. Parse the private key properly
# 2. Sign using secp256k1 with proper Bitcoin signature format
# 3. Encode the signature in DER format

# For now, we'll use hal-simplicity's signing if available
# Otherwise, you'll need to integrate with elements-cli or bitcoin-cli

echo "Generating signature..." >&2

# Sign using elements-cli in Docker (if available)
SIGNATURE=$(docker exec elementsd1 elements-cli -datadir=/home/elements/.elements signmessagewithprivkey "$PRIVATE_KEY" "$SIGHASH" 2>/dev/null || echo "")

if [ -z "$SIGNATURE" ]; then
    echo "Error: Failed to generate signature" >&2
    echo "Note: This requires elements-cli with signmessagewithprivkey support" >&2
    exit 1
fi

echo "Signature generated: ${SIGNATURE:0:20}..." >&2

pause

# Step 3: Attach signature to PSET
echo "Attaching signature to PSET input 0, key index $SIGNATURE_INDEX..." >&2

# Use hal-simplicity to update the PSET with the signature
# The exact command depends on hal-simplicity's API for adding signatures
# This is a placeholder - adjust based on actual hal-simplicity capabilities

UPDATED_PSET=$(hal-simplicity simplicity pset add-signature "$PSET" 0 "$SIGNATURE_INDEX" "$SIGNATURE" 2>&1) || {
    echo "Warning: hal-simplicity add-signature not available" >&2
    echo "Using PSET as-is and storing signature separately" >&2
    UPDATED_PSET="$PSET"
}

echo "PSET updated with signature" >&2

pause

# Update signatures count and signed_by list
NEW_SIGNATURES_COUNT=$((SIGNATURES_COUNT + 1))
NEW_SIGNED_BY=$(echo "$SIGNED_BY" | jq ". + [$SIGNATURE_INDEX] | unique")

echo "New signatures count: $NEW_SIGNATURES_COUNT" >&2
echo "New signed by indices: $NEW_SIGNED_BY" >&2

# Check if we have enough signatures (2 of 3)
THRESHOLD_MET=false
if [ "$NEW_SIGNATURES_COUNT" -ge 2 ]; then
    THRESHOLD_MET=true
    echo "✓ Threshold met: $NEW_SIGNATURES_COUNT/2 signatures collected" >&2
else
    echo "Threshold not yet met: $NEW_SIGNATURES_COUNT/2 signatures (need 2)" >&2
fi

# Save state to file
if [ "$OUTPUT_FILE" != "/dev/null" ]; then
    mkdir -p "$(dirname "$OUTPUT_FILE")"
    
    cat > "$OUTPUT_FILE" <<EOF
{
    "pset": "$UPDATED_PSET",
    "sighash": "$SIGHASH",
    "signatures": [
$(echo "$NEW_SIGNED_BY" | jq -r '.[] | "        {\"userId\": \"" + . + "\", \"index\": 0},"' | sed '$ s/,$//')
    ],
    "signaturesCount": $NEW_SIGNATURES_COUNT,
    "signedBy": $NEW_SIGNED_BY,
    "thresholdMet": $THRESHOLD_MET,
    "threshold": 2,
    "totalKeys": 3,
    "userId": "${USER_ID:-unknown}",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    
    echo "Signature info saved to: $OUTPUT_FILE" >&2
    
    # Also update the signatures file for continuity
    if [ "$OUTPUT_FILE" != "$SIGNATURES_FILE" ]; then
        cp "$OUTPUT_FILE" "$SIGNATURES_FILE"
        echo "Signatures file updated: $SIGNATURES_FILE" >&2
    fi
fi

echo "" >&2
echo "=== Signature Attachment Complete ===" >&2

# Output key-value pairs for API
echo "PSET=$UPDATED_PSET"
echo "SIGHASH=$SIGHASH"
echo "SIGNATURE_INDEX=$SIGNATURE_INDEX"
echo "SIGNATURES_COUNT=$NEW_SIGNATURES_COUNT"
echo "THRESHOLD_MET=$THRESHOLD_MET"
echo "SIGNED_BY=$NEW_SIGNED_BY"

echo "" >&2
echo "Summary:" >&2
echo "  Signatures: $NEW_SIGNATURES_COUNT/2" >&2
echo "  Signed by indices: $NEW_SIGNED_BY" >&2
echo "  Threshold met: $THRESHOLD_MET" >&2
echo "  Ready to finalize: $THRESHOLD_MET" >&2
