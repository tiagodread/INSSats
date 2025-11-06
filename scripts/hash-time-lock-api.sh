#!/bin/bash
set -euo pipefail

pause() { 
  if [ -z "${NO_PAUSE:-}" ]; then
    read -p "Press Enter to continue..." 
    echo 
    echo 
  fi
}

# Use Esplora API instead of local elementsd
ESPLORA_API="${ESPLORA_API:-https://blockstream.info/liquidtestnet/api}"

# Set the infra directory for docker commands
INFRA_DIR="${INFRA_DIR:-$HOME/tiago/INSSats/infra}"

# Accept parameters from environment or use defaults
PROGRAM_SOURCE="${PROGRAM_SOURCE:-$HOME/tiago/INSSats/contracts/htlc.simf}"
WITNESS_FILE="${WITNESS_FILE:-$HOME/tiago/INSSats/contracts/htlc.complete.wit}"
# This is an unspendable public key address.
# It is semi-hardcoded in some Simplicity tools. You can change it in order
# to make existing contract source code have a different address on the
# blockchain (I think) but you must use a NUMS method to make sure that
# the key is unspendable. If someone else offers you a contract, you must
# make sure that the internal key used for that instance of the contract
# is an unspendable value (if it is changed from this default). Otherwise
# the contract creator may be able to unilaterally steal value from
# the contract.
# TODO: This might be a public key with no known private key and both parties agree on it. Research this.
INTERNAL_KEY="${INTERNAL_KEY:-50929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0}"
TMPDIR=$(mktemp -d)

# Private key corresponding to one of the three public keys
PRIVKEY_1="${PRIVKEY_1:-0000000000000000000000000000000000000000000000000000000000000001}"

# Hardcoded address of the Liquid testnet for returning tLBTC
# (so that they aren't wasted!)
# We could also send these to our own wallet, but here we are choosing
# to send them back.
# TODO: Change this address to customer address
RECIPIENT_ADDRESS="${RECIPIENT_ADDRESS:-tlq1qq2g07nju42l0nlx0erqa3wsel2l8prnq96rlnhml262mcj7pe8w6ndvvyg237japt83z24m8gu4v3yfhaqvrqxydadc9scsmw}"
CONTRACT_AMOUNT="${CONTRACT_AMOUNT:-0.00099900}"
CONTRACT_FEE="${CONTRACT_FEE:-0.00000100}"

# Get unconfidential address (will use elements-cli if available, otherwise use as-is)
if command -v docker &> /dev/null; then
    # Change to infra directory to run docker compose commands
    pushd "$INFRA_DIR" > /dev/null 2>&1
    
    if docker compose ps elementsd1 &> /dev/null 2>&1; then
        ELEMENTS_CLI="docker compose exec -T elementsd1 elements-cli"
        RECIPIENT_ADDRESS=$($ELEMENTS_CLI validateaddress "$RECIPIENT_ADDRESS" | jq -r .unconfidential)
    fi
    
    popd > /dev/null 2>&1
fi

for variable in PROGRAM_SOURCE WITNESS_FILE INTERNAL_KEY PRIVKEY_1 RECIPIENT_ADDRESS CONTRACT_AMOUNT CONTRACT_FEE
do
    echo -n "$variable = "
    eval echo \$$variable
done

pause

# ===== STEP 1: CREATE CONTRACT =====
echo "=== Creating Contract ==="
echo "Compiling Simplicity program..."
echo "simc $PROGRAM_SOURCE"
simc $PROGRAM_SOURCE

pause

# Extract the compiled program from the output of that command
COMPILED_PROGRAM=$(simc "$PROGRAM_SOURCE" | tail -1)

echo "Getting program info..."
echo "hal-simplicity simplicity info $COMPILED_PROGRAM"
hal-simplicity simplicity info $COMPILED_PROGRAM | jq
BYTECODE=$(hal-simplicity simplicity info "$COMPILED_PROGRAM" | jq -r .commit_decode)
CMR=$(hal-simplicity simplicity info "$COMPILED_PROGRAM" | jq -r .cmr)
CONTRACT_ADDRESS=$(hal-simplicity simplicity info "$COMPILED_PROGRAM" | jq -r .liquid_testnet_address_unconf)
echo

for variable in CMR CONTRACT_ADDRESS
do
    echo -n "$variable = "
    eval echo \$$variable
done

pause

# ===== STEP 2: FUND CONTRACT =====
echo "=== Funding Contract ==="
# TODO: The contract is now created and we have its address.

# Here we use a curl command to contact the Liquid Testnet faucet to
# ask it to fund our contract
echo "Requesting funds from faucet for address: $CONTRACT_ADDRESS"
echo "Running curl to connect to Liquid Testnet faucet..."
FAUCET_TRANSACTION=$(bash ~/faucet.sh "$CONTRACT_ADDRESS" | bash ~/extract-transaction.sh)

echo "FAUCET_TRANSACTION = $FAUCET_TRANSACTION"

# TODO: The contract is now created and funds have been sent to it.

pause

# ===== STEP 3: WAIT FOR CONFIRMATION =====
echo "=== Waiting for Transaction to be Available ==="
echo "Checking transaction via Esplora API..."

# Wait for transaction to appear in mempool or blockchain
MAX_ATTEMPTS=60
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    echo "Attempt $((ATTEMPT+1))/$MAX_ATTEMPTS: Checking if transaction is available..."
    
    TX_DATA=$(curl -s "$ESPLORA_API/tx/$FAUCET_TRANSACTION")
    
    if [ -n "$TX_DATA" ] && [ "$TX_DATA" != "Transaction not found" ]; then
        echo "Transaction found!"
        echo "$TX_DATA" | jq > "$TMPDIR/faucet-tx-full.json"
        break
    fi
    
    ATTEMPT=$((ATTEMPT+1))
    sleep 5
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "ERROR: Transaction not found after $MAX_ATTEMPTS attempts"
    exit 1
fi

pause

# ===== STEP 4: GET UTXO DETAILS =====
echo "=== Getting UTXO Details ==="

# Get the output details for vout 0
VOUT_0=$(cat "$TMPDIR/faucet-tx-full.json" | jq '.vout[0]')
echo "$VOUT_0" | jq

# Extract scriptPubKey (hex), asset, and value
SCRIPT_PUBKEY=$(echo "$VOUT_0" | jq -r '.scriptpubkey')
ASSET=$(echo "$VOUT_0" | jq -r '.asset')
VALUE_SATS=$(echo "$VOUT_0" | jq -r '.value')

# Convert value from satoshis to BTC
VALUE=$(echo "scale=8; $VALUE_SATS / 100000000" | bc)

echo "Extracted parameters:"
echo "  SCRIPT_PUBKEY = $SCRIPT_PUBKEY"
echo "  ASSET = $ASSET"
echo "  VALUE = $VALUE BTC ($VALUE_SATS satoshis)"

pause

# ===== STEP 5: CREATE PSET =====
echo "=== Creating PSET ==="

# We need to create PSET manually since we don't have elements-cli
# For now, we'll use a workaround with hal-simplicity if possible
# Or we need a local elements-cli just for PSET creation

# Check if we have access to elements-cli via docker
if command -v docker &> /dev/null; then
    # Change to infra directory to run docker compose commands
    pushd "$INFRA_DIR" > /dev/null 2>&1
    
    if docker compose ps elementsd1 &> /dev/null 2>&1; then
        echo "Using local elements-cli for PSET creation..."
        ELEMENTS_CLI="docker compose exec -T elementsd1 elements-cli"
        
        # Create PSET
        echo "$ELEMENTS_CLI createpsbt \"[ { \\\"txid\\\": \\\"$FAUCET_TRANSACTION\\\", \\\"vout\\\": 0 } ]\" \"[ { \\\"$RECIPIENT_ADDRESS\\\": $CONTRACT_AMOUNT }, { \\\"fee\\\": $CONTRACT_FEE } ]\""
        PSET=$($ELEMENTS_CLI createpsbt \
            "[{\"txid\":\"$FAUCET_TRANSACTION\",\"vout\":0}]" \
            "[{\"$RECIPIENT_ADDRESS\":$CONTRACT_AMOUNT},{\"fee\":$CONTRACT_FEE}]")
        
        echo "PSET created: $PSET"
        
        popd > /dev/null 2>&1
    else
        popd > /dev/null 2>&1
        echo "ERROR: Docker container elementsd1 is not running"
        echo "Please start it from the infra directory:"
        echo "  cd $INFRA_DIR && docker compose up -d elementsd1"
        exit 1
    fi
else
    echo "ERROR: Docker not available for PSET creation"
    echo "You need either:"
    echo "  1. Docker with elementsd1 running, OR"
    echo "  2. Local elements-cli installation"
    exit 1
fi

pause

# Now we will attach a lot of stuff to this PSET.

# First, we want to know more details related to the incoming transaction
# that funded the contract and that we are now attempting to spend.
#
# Note: We already have this information from the Esplora API in STEP 4
# So we can skip the waiting loop and use the data we already have

# ===== STEP 6: UPDATE PSET INPUT =====
echo "=== Updating PSET Input ==="

echo "Using extracted parameters: $SCRIPT_PUBKEY:$ASSET:$VALUE"

pause

echo "hal-simplicity simplicity pset update-input \"$PSET\" 0 -i \"$SCRIPT_PUBKEY:$ASSET:$VALUE\" -c \"$CMR\" -p \"$INTERNAL_KEY\""
hal-simplicity simplicity pset update-input "$PSET" 0 -i "$SCRIPT_PUBKEY:$ASSET:$VALUE" -c "$CMR" -p "$INTERNAL_KEY" | tee "$TMPDIR/updated.json" | jq

PSET=$(jq -r .pset < "$TMPDIR/updated.json")

pause

# Now we have to generate the sighash and then, for this case, make
# signatures on it corresponding to the signatures of 2 out of 3 authorized
# keys.

# ===== STEP 7: GENERATE SIGNATURES =====
echo "=== Generating Signatures ==="

# Signature 1
echo "hal-simplicity simplicity sighash \"$PSET\" 0 \"$CMR\" -x \"$PRIVKEY_1\""
hal-simplicity simplicity sighash "$PSET" 0 "$CMR" -x "$PRIVKEY_1" | jq
SIGNATURE_1=$(hal-simplicity simplicity sighash "$PSET" 0 "$CMR" -x "$PRIVKEY_1" | jq -r .signature)
echo "Signature 1 = $SIGNATURE_1"

pause

# Put the signatures into the appropriate place in the .wit file
# (these substitutions are extremely hard-coded for this specific
# .wit file)
# ===== STEP 8: UPDATE WITNESS FILE =====
echo "=== Updating Witness File with Signatures ==="

echo "Copying signatures into copy of witness file $WITNESS_FILE..."
cp $WITNESS_FILE "$TMPDIR/witness.wit"
sed -i '' "s/, 0x[^)]*)/, 0x$SIGNATURE_1)/" "$TMPDIR/witness.wit"

echo "Recompiling Simplicity program with attached populated witness file..."
echo "simc $PROGRAM_SOURCE \"$TMPDIR/witness.wit\""
simc $PROGRAM_SOURCE "$TMPDIR/witness.wit" | tee "$TMPDIR/compiled-with-witness"

PROGRAM=$(sed '1d;3,$d' "$TMPDIR/compiled-with-witness")
WITNESS=$(sed '1,3d;5,$d' "$TMPDIR/compiled-with-witness")

pause

# ===== STEP 9: FINALIZE PSET =====
echo "=== Finalizing PSET ==="

echo "hal-simplicity simplicity pset finalize \"$PSET\" 0 \"$PROGRAM\" \"$WITNESS\""
hal-simplicity simplicity pset finalize "$PSET" 0 "$PROGRAM" "$WITNESS" | jq
PSET=$(hal-simplicity simplicity pset finalize "$PSET" 0 "$PROGRAM" "$WITNESS" | jq -r .pset)

pause

# ===== STEP 10: FINALIZE PSBT =====
echo "=== Finalizing PSBT ==="

if [ -n "${ELEMENTS_CLI:-}" ]; then
    # Change to infra directory to run docker compose commands
    pushd "$INFRA_DIR" > /dev/null 2>&1
    
    echo "$ELEMENTS_CLI finalizepsbt \"$PSET\""
    $ELEMENTS_CLI finalizepsbt "$PSET" | jq
    RAW_TX=$($ELEMENTS_CLI finalizepsbt "$PSET" | jq -r .hex)
    
    popd > /dev/null 2>&1
else
    echo "ERROR: elements-cli not available for PSBT finalization"
    exit 1
fi

pause

# My copy of elementsd is too old for some reason to do the normal
# TXID=$($ELEMENTS_CLI sendrawtransaction "$RAW_TX")
# so I will submit this via the web API instead:
# ===== STEP 11: BROADCAST TRANSACTION =====
echo "=== Broadcasting Transaction ==="
echo "Submitting raw transaction via Liquid Testnet web API..."
echo -n "Resulting transaction ID is "
TXID=$(curl -s -X POST "$ESPLORA_API/tx" -d "$RAW_TX")
echo $TXID
echo "View online at https://blockstream.info/liquidtestnet/tx/$TXID?expand"

# Verify transaction
echo
echo "Verifying transaction..."
sleep 3
curl -s "$ESPLORA_API/tx/$TXID" | jq

echo
echo "=== Contract Lifecycle Complete ==="
echo "Contract Address: $CONTRACT_ADDRESS"
echo "Funding TX: $FAUCET_TRANSACTION"
echo "Claim TX: $TXID"
echo