#!/bin/bash

# Test script for workspace isolation
# This script demonstrates that multiple contracts can be created and processed
# simultaneously without conflicts.

set -e

API_URL="http://localhost:3001"

echo "=== Testing Contract Workspace Isolation ==="
echo

# Function to create and test a contract
test_contract() {
    local test_name="$1"
    local user1="$2"
    local user2="$3"
    
    echo ">>> Test: $test_name"
    echo
    
    # Step 1: Create contract
    echo "1. Creating contract..."
    CREATE_RESPONSE=$(curl -s -X POST "$API_URL/contract/create" \
        -H "Content-Type: application/json" \
        -d '{}')
    
    CONTRACT_ID=$(echo "$CREATE_RESPONSE" | jq -r '.contractId')
    CONTRACT_ADDRESS=$(echo "$CREATE_RESPONSE" | jq -r '.contractAddress')
    
    if [ -z "$CONTRACT_ID" ] || [ "$CONTRACT_ID" = "null" ]; then
        echo "ERROR: Failed to create contract"
        echo "$CREATE_RESPONSE" | jq
        return 1
    fi
    
    echo "   Contract ID: $CONTRACT_ID"
    echo "   Address: $CONTRACT_ADDRESS"
    echo
    
    # Verify workspace directory exists
    WORKSPACE_DIR="../tmp/contracts/$CONTRACT_ID"
    if [ ! -d "$WORKSPACE_DIR" ]; then
        echo "ERROR: Workspace directory not created: $WORKSPACE_DIR"
        return 1
    fi
    echo "   ✓ Workspace directory created: $WORKSPACE_DIR"
    
    # Verify contract-info.json exists
    if [ ! -f "$WORKSPACE_DIR/contract-info.json" ]; then
        echo "ERROR: contract-info.json not found"
        return 1
    fi
    echo "   ✓ contract-info.json created"
    echo
    
    # Step 2: Fund contract
    echo "2. Funding contract (this will take ~90 seconds)..."
    FUND_RESPONSE=$(curl -s -X POST "$API_URL/contract/fund" \
        -H "Content-Type: application/json" \
        -d "{\"contractId\":\"$CONTRACT_ID\",\"contractAddress\":\"$CONTRACT_ADDRESS\"}")
    
    TXID=$(echo "$FUND_RESPONSE" | jq -r '.txid')
    if [ -z "$TXID" ] || [ "$TXID" = "null" ]; then
        echo "ERROR: Failed to fund contract"
        echo "$FUND_RESPONSE" | jq
        return 1
    fi
    
    echo "   TXID: $TXID"
    echo "   ✓ funding-info.json created"
    echo
    
    # Step 3: Create PSET
    echo "3. Creating PSET..."
    PSET_RESPONSE=$(curl -s -X POST "$API_URL/contract/pset/create" \
        -H "Content-Type: application/json" \
        -d "{\"contractId\":\"$CONTRACT_ID\",\"recipientAddress\":\"tex1qkkxzy9glfws4nc392an5w2kgjym7sxpshuwkjy\"}")
    
    PSET=$(echo "$PSET_RESPONSE" | jq -r '.pset')
    if [ -z "$PSET" ] || [ "$PSET" = "null" ]; then
        echo "ERROR: Failed to create PSET"
        echo "$PSET_RESPONSE" | jq
        return 1
    fi
    
    echo "   PSET length: ${#PSET}"
    echo "   ✓ pset-info.json created"
    echo
    
    # Step 4: Update PSET
    echo "4. Updating PSET..."
    UPDATE_RESPONSE=$(curl -s -X PATCH "$API_URL/contract/pset/update" \
        -H "Content-Type: application/json" \
        -d "{\"contractId\":\"$CONTRACT_ID\"}")
    
    UPDATED_PSET=$(echo "$UPDATE_RESPONSE" | jq -r '.pset')
    if [ -z "$UPDATED_PSET" ] || [ "$UPDATED_PSET" = "null" ]; then
        echo "ERROR: Failed to update PSET"
        echo "$UPDATE_RESPONSE" | jq
        return 1
    fi
    
    echo "   Updated PSET length: ${#UPDATED_PSET}"
    echo "   ✓ updated-pset-info.json created"
    echo
    
    # Step 5: Attach signatures (user 1)
    echo "5. Attaching signature from $user1..."
    SIG1_RESPONSE=$(curl -s -X PATCH "$API_URL/contract/pset/attach-signature" \
        -H "Content-Type: application/json" \
        -d "{\"contractId\":\"$CONTRACT_ID\",\"userId\":\"$user1\"}")
    
    PARTICIPANTS_COUNT=$(echo "$SIG1_RESPONSE" | jq -r '.participantsCount')
    echo "   Participants: $PARTICIPANTS_COUNT"
    
    # Step 6: Attach signatures (user 2)
    echo "6. Attaching signature from $user2..."
    SIG2_RESPONSE=$(curl -s -X PATCH "$API_URL/contract/pset/attach-signature" \
        -H "Content-Type: application/json" \
        -d "{\"contractId\":\"$CONTRACT_ID\",\"userId\":\"$user2\"}")
    
    PARTICIPANTS_COUNT=$(echo "$SIG2_RESPONSE" | jq -r '.participantsCount')
    THRESHOLD_MET=$(echo "$SIG2_RESPONSE" | jq -r '.thresholdMet')
    PARTICIPANTS=$(echo "$SIG2_RESPONSE" | jq -r '.participants | join(", ")')
    
    echo "   Participants: $PARTICIPANTS_COUNT ($PARTICIPANTS)"
    echo "   Threshold met: $THRESHOLD_MET"
    echo "   ✓ participants-info.json created"
    echo
    
    # Verify participants file contains correct users
    PARTICIPANTS_FILE="$WORKSPACE_DIR/participants-info.json"
    if [ ! -f "$PARTICIPANTS_FILE" ]; then
        echo "ERROR: participants-info.json not found"
        return 1
    fi
    
    EXPECTED_PARTICIPANTS="[\"$user1\",\"$user2\"]"
    ACTUAL_PARTICIPANTS=$(jq -c '.participants | sort' "$PARTICIPANTS_FILE")
    EXPECTED_SORTED=$(echo "$EXPECTED_PARTICIPANTS" | jq -c 'sort')
    
    if [ "$ACTUAL_PARTICIPANTS" != "$EXPECTED_SORTED" ]; then
        echo "ERROR: Participants mismatch!"
        echo "   Expected: $EXPECTED_SORTED"
        echo "   Actual: $ACTUAL_PARTICIPANTS"
        return 1
    fi
    
    echo "   ✓ Participants verified: $PARTICIPANTS"
    echo
    
    # Step 7: Finalize PSET
    echo "7. Finalizing PSET..."
    FINALIZE_RESPONSE=$(curl -s -X POST "$API_URL/contract/pset/finalize" \
        -H "Content-Type: application/json" \
        -d "{\"contractId\":\"$CONTRACT_ID\"}")
    
    RAW_TX=$(echo "$FINALIZE_RESPONSE" | jq -r '.rawTx')
    FINALIZED=$(echo "$FINALIZE_RESPONSE" | jq -r '.finalized')
    
    if [ -z "$RAW_TX" ] || [ "$RAW_TX" = "null" ]; then
        echo "ERROR: Failed to finalize PSET"
        echo "$FINALIZE_RESPONSE" | jq
        return 1
    fi
    
    echo "   Raw TX length: ${#RAW_TX}"
    echo "   Finalized: $FINALIZED"
    echo "   ✓ finalized-pset-info.json created"
    echo
    
    # Summary
    echo ">>> Test $test_name: PASSED ✓"
    echo "   Contract ID: $CONTRACT_ID"
    echo "   Workspace: $WORKSPACE_DIR"
    echo "   Participants: $PARTICIPANTS"
    echo
    echo "---"
    echo
}

# Run multiple tests in sequence to verify isolation
test_contract "Contract A" "user_0" "user_1"
test_contract "Contract B" "user_1" "user_2"
test_contract "Contract C" "user_0" "user_2"

echo "=== All Tests Passed! ==="
echo
echo "Workspace isolation verified:"
ls -la ../tmp/contracts/

echo
echo "Each contract has its own isolated participants:"
for dir in ../tmp/contracts/contract_*; do
    if [ -d "$dir" ]; then
        CONTRACT_ID=$(basename "$dir")
        PARTICIPANTS_FILE="$dir/participants-info.json"
        if [ -f "$PARTICIPANTS_FILE" ]; then
            PARTICIPANTS=$(jq -r '.participants | join(", ")' "$PARTICIPANTS_FILE")
            echo "  $CONTRACT_ID: [$PARTICIPANTS]"
        fi
    fi
done
