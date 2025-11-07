#!/bin/bash
set -euo pipefail

# ===== SCRIPT 4: UPDATE PSET INPUT =====
# This script updates a PSET input with contract information (scriptPubkey, asset, value, CMR, internal key)
# needed for spending from a Simplicity contract.
#
# Usage:
#   ./4-update-pset.sh
#   PSET=cHNldP8... SCRIPT_PUBKEY=5120... ASSET=144c... VALUE=0.001 ./4-update-pset.sh
#
# Environment Variables:
#   PSET                  - The PSET to update (REQUIRED)
#   SCRIPT_PUBKEY         - Script public key from funding output (REQUIRED)
#   ASSET                 - Asset ID from funding output (REQUIRED)
#   VALUE                 - Value in BTC from funding output (REQUIRED)
#   CMR                   - Contract commitment Merkle root (REQUIRED)
#   INTERNAL_KEY          - Internal key for the contract (REQUIRED)
#   PSET_OVERRIDE         - Override for PSET
#   SCRIPT_PUBKEY_OVERRIDE - Override for script pubkey
#   ASSET_OVERRIDE        - Override for asset
#   VALUE_OVERRIDE        - Override for value
#   CMR_OVERRIDE          - Override for CMR
#   INTERNAL_KEY_OVERRIDE - Override for internal key
#   PSET_INFO_FILE        - JSON file with PSET info from step 3 (default: ../tmp/pset-info.json)
#   FUNDING_INFO_FILE     - JSON file with funding info from step 2 (default: ../tmp/funding-info.json)
#   CONTRACT_INFO_FILE    - JSON file with contract info from step 1 (default: ../tmp/contract-info.json)
#   OUTPUT_FILE           - File to save updated PSET info JSON (default: ../tmp/updated-pset-info.json)
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
PSET_INFO_FILE="${PSET_INFO_FILE:-$PROJECT_ROOT/tmp/pset-info.json}"
FUNDING_INFO_FILE="${FUNDING_INFO_FILE:-$PROJECT_ROOT/tmp/funding-info.json}"
CONTRACT_INFO_FILE="${CONTRACT_INFO_FILE:-$PROJECT_ROOT/tmp/contract-info.json}"
OUTPUT_FILE="${OUTPUT_FILE:-$PROJECT_ROOT/tmp/updated-pset-info.json}"

# Temporary directory for intermediate files
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

# Determine PSET
if [ -n "${PSET_OVERRIDE:-}" ]; then
    PSET="$PSET_OVERRIDE"
elif [ -n "${PSET:-}" ]; then
    # Use from environment
    :
elif [ -f "$PSET_INFO_FILE" ]; then
    # Load from PSET info file
    PSET=$(jq -r .pset "$PSET_INFO_FILE")
    if [ "$PSET" = "null" ] || [ -z "$PSET" ]; then
        echo "ERROR: Could not read pset from $PSET_INFO_FILE" >&2
        exit 1
    fi
else
    echo "ERROR: PSET is required" >&2
    echo "Usage:" >&2
    echo "  PSET=cHNldP8... ./4-update-pset.sh" >&2
    echo "  OR ensure $PSET_INFO_FILE exists from step 3" >&2
    exit 1
fi

# Determine SCRIPT_PUBKEY
if [ -n "${SCRIPT_PUBKEY_OVERRIDE:-}" ]; then
    SCRIPT_PUBKEY="$SCRIPT_PUBKEY_OVERRIDE"
elif [ -n "${SCRIPT_PUBKEY:-}" ]; then
    :
elif [ -f "$FUNDING_INFO_FILE" ]; then
    SCRIPT_PUBKEY=$(jq -r .scriptPubkey "$FUNDING_INFO_FILE")
    if [ "$SCRIPT_PUBKEY" = "null" ] || [ -z "$SCRIPT_PUBKEY" ]; then
        echo "ERROR: Could not read scriptPubkey from $FUNDING_INFO_FILE" >&2
        exit 1
    fi
else
    echo "ERROR: SCRIPT_PUBKEY is required" >&2
    exit 1
fi

# Determine ASSET
if [ -n "${ASSET_OVERRIDE:-}" ]; then
    ASSET="$ASSET_OVERRIDE"
elif [ -n "${ASSET:-}" ]; then
    :
elif [ -f "$FUNDING_INFO_FILE" ]; then
    ASSET=$(jq -r .asset "$FUNDING_INFO_FILE")
    if [ "$ASSET" = "null" ] || [ -z "$ASSET" ]; then
        echo "ERROR: Could not read asset from $FUNDING_INFO_FILE" >&2
        exit 1
    fi
else
    echo "ERROR: ASSET is required" >&2
    exit 1
fi

# Determine VALUE
if [ -n "${VALUE_OVERRIDE:-}" ]; then
    VALUE="$VALUE_OVERRIDE"
elif [ -n "${VALUE:-}" ]; then
    :
elif [ -f "$FUNDING_INFO_FILE" ]; then
    VALUE=$(jq -r .value "$FUNDING_INFO_FILE")
    if [ "$VALUE" = "null" ] || [ -z "$VALUE" ]; then
        echo "ERROR: Could not read value from $FUNDING_INFO_FILE" >&2
        exit 1
    fi
else
    echo "ERROR: VALUE is required" >&2
    exit 1
fi

# Determine CMR
if [ -n "${CMR_OVERRIDE:-}" ]; then
    CMR="$CMR_OVERRIDE"
elif [ -n "${CMR:-}" ]; then
    :
elif [ -f "$CONTRACT_INFO_FILE" ]; then
    CMR=$(jq -r .cmr "$CONTRACT_INFO_FILE")
    if [ "$CMR" = "null" ] || [ -z "$CMR" ]; then
        echo "ERROR: Could not read cmr from $CONTRACT_INFO_FILE" >&2
        exit 1
    fi
else
    echo "ERROR: CMR is required" >&2
    exit 1
fi

# Determine INTERNAL_KEY
if [ -n "${INTERNAL_KEY_OVERRIDE:-}" ]; then
    INTERNAL_KEY="$INTERNAL_KEY_OVERRIDE"
elif [ -n "${INTERNAL_KEY:-}" ]; then
    :
elif [ -f "$CONTRACT_INFO_FILE" ]; then
    INTERNAL_KEY=$(jq -r .internalKey "$CONTRACT_INFO_FILE")
    if [ "$INTERNAL_KEY" = "null" ] || [ -z "$INTERNAL_KEY" ]; then
        echo "ERROR: Could not read internalKey from $CONTRACT_INFO_FILE" >&2
        exit 1
    fi
else
    echo "ERROR: INTERNAL_KEY is required" >&2
    exit 1
fi

echo "=== UPDATE PSET INPUT ===" >&2
echo "Configuration:" >&2
echo "  PSET (first 50 chars) = ${PSET:0:50}..." >&2
echo "  SCRIPT_PUBKEY = $SCRIPT_PUBKEY" >&2
echo "  ASSET = $ASSET" >&2
echo "  VALUE = $VALUE" >&2
echo "  CMR = $CMR" >&2
echo "  INTERNAL_KEY = $INTERNAL_KEY" >&2
echo "  OUTPUT_FILE = $OUTPUT_FILE" >&2
echo >&2

pause

# ===== STEP 1: UPDATE PSET INPUT =====
echo "Step 1: Updating PSET input with contract information..." >&2

if ! command -v hal-simplicity &> /dev/null; then
    echo "ERROR: hal-simplicity command not found" >&2
    echo "Please install hal-simplicity tools" >&2
    exit 1
fi

echo "Using parameters: $SCRIPT_PUBKEY:$ASSET:$VALUE" >&2
echo "Command: hal-simplicity simplicity pset update-input \"<PSET>\" 0 -i \"$SCRIPT_PUBKEY:$ASSET:$VALUE\" -c \"$CMR\" -p \"$INTERNAL_KEY\"" >&2
echo >&2

UPDATE_RESULT=$(hal-simplicity simplicity pset update-input "$PSET" 0 -i "$SCRIPT_PUBKEY:$ASSET:$VALUE" -c "$CMR" -p "$INTERNAL_KEY")

# Save the result to a temp file
echo "$UPDATE_RESULT" > "$TMPDIR/updated.json"

# Display result
echo "$UPDATE_RESULT" | jq >&2
echo >&2

# Extract updated PSET
UPDATED_PSET=$(echo "$UPDATE_RESULT" | jq -r .pset)

if [ -z "$UPDATED_PSET" ] || [ "$UPDATED_PSET" = "null" ]; then
    echo "ERROR: Failed to update PSET" >&2
    echo "Result:" >&2
    echo "$UPDATE_RESULT" | jq >&2
    exit 1
fi

echo "✓ PSET input updated successfully" >&2
echo >&2

pause

# ===== STEP 2: DISPLAY RESULTS =====
echo "=== UPDATE COMPLETE ===" >&2
echo "PSET = $UPDATED_PSET"
echo >&2

# ===== STEP 3: SAVE TO FILE =====
if [ "$OUTPUT_FILE" != "/dev/null" ]; then
    echo "Saving updated PSET information to $OUTPUT_FILE..." >&2
    
    # Create directory if it doesn't exist
    mkdir -p "$(dirname "$OUTPUT_FILE")"
    
    # Create JSON output
    cat > "$OUTPUT_FILE" << EOF
{
  "pset": "$UPDATED_PSET",
  "scriptPubkey": "$SCRIPT_PUBKEY",
  "asset": "$ASSET",
  "value": "$VALUE",
  "cmr": "$CMR",
  "internalKey": "$INTERNAL_KEY",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    
    echo "✓ Updated PSET information saved to $OUTPUT_FILE" >&2
    echo >&2
fi

echo "=== SCRIPT COMPLETE ===" >&2
echo >&2
echo "Next step: Finalize PSET using 5-finalize-pset.sh" >&2
echo "  PSET=$UPDATED_PSET ./scripts/5-finalize-pset.sh" >&2
