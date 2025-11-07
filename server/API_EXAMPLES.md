# API Examples

Collection of example requests for the INSSats Contract API.

## Base URL
```
http://localhost:3001
```

---

## 1. Create Contract

### Request (No Parameters Needed)

> ⚠️ **Security Note**: The contract logic (`programSource` and `internalKey`) is defined on the server and **cannot** be controlled by the client. This prevents malicious contract injection.

```bash
curl -X POST http://localhost:3001/contract/create \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Response
```json
{
  "cmr": "1234abcd...",
  "contractAddress": "lq1qxyz...",
  "bytecode": "0xabcd1234...",
  "internalKey": "50929b74...",      // Server's INTERNAL_KEY (read-only)
  "programSource": "/path/to/contract.simf",  // Server's PROGRAM_SOURCE (read-only)
  "compiledProgram": "0x..."
}
```

---

## 2. Fund Contract

### Automatic Funding (via Faucet)
```bash
curl -X POST http://localhost:3001/contract/fund \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "lq1qxyz..."
  }'
```

> ⚠️ **Note**: The faucet may fail due to rate limiting or availability issues. See manual funding option below.

### Manual Funding Alternative

If the faucet fails, you can:

1. **Fund the address manually** using a Liquid Testnet wallet or another faucet
2. **Get the funding TXID**
3. **Skip to step 3** (Create PSET) with the funding TXID

Example:
```bash
# Visit https://liquidtestnet.com/faucet manually
# Send funds to: lq1qxyz...
# Get the TXID from the transaction

# Then proceed to Create PSET with the TXID
curl -X POST http://localhost:3001/contract/pset/create \
  -H "Content-Type: application/json" \
  -d '{
    "txid": "your_manual_funding_txid_here"
  }'
```

### Response (Success)
```json
{
  "txid": "abc123def456...",
  "vout": 0,
  "scriptPubkey": "0x5120...",
  "asset": "6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d",
  "value": "0.001",
  "valueSats": 100000
}
```

### Response (Faucet Error)
```json
{
  "error": "Failed to fund contract",
  "details": "Faucet request failed: rate limit exceeded"
}
```

---

## 3. Create PSET

### Minimal Request
```bash
curl -X POST http://localhost:3001/contract/pset/create \
  -H "Content-Type: application/json" \
  -d '{
    "txid": "abc123def456..."
  }'
```

### Custom Recipient and Amounts
```bash
curl -X POST http://localhost:3001/contract/pset/create \
  -H "Content-Type: application/json" \
  -d '{
    "txid": "abc123def456...",
    "recipientAddress": "tlq1qq2g07nju42l0nlx0erqa3wsel2l8prnq96rlnh...",
    "amount": "0.00099900",
    "fee": "0.00000100"
  }'
```

### Response
```json
{
  "pset": "cHNldP8BAF4CAAAAAQFx9YvI...",
  "recipientAddress": "tlq1qq2g07nju...",
  "amount": "0.00099900",
  "fee": "0.00000100"
}
```

---

## 4. Finalize PSET

### Minimal Request
```bash
curl -X POST http://localhost:3001/contract/pset/finalize \
  -H "Content-Type: application/json" \
  -d '{
    "pset": "cHNldP8BAF4CAAAAAQFx9YvI...",
    "scriptPubkey": "0x5120...",
    "asset": "6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d",
    "value": "0.001"
  }'
```

### With Optional Parameters
```bash
curl -X POST http://localhost:3001/contract/pset/finalize \
  -H "Content-Type: application/json" \
  -d '{
    "pset": "cHNldP8BAF4CAAAAAQFx9YvI...",
    "scriptPubkey": "0x5120...",
    "asset": "6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d",
    "value": "0.001",
    "cmr": "1234abcd...",
    "privateKey": "0000000000000000000000000000000000000000000000000000000000000001"
  }'
```

> ⚠️ **Security Note**: The `internalKey` and `programSource` are server-side constants and cannot be controlled by the client. This prevents malicious contract injection during PSET finalization.

### Response
```json
{
  "pset": "cHNldP8BAF4CAAAAAQFx9YvI...",
  "rawTx": "02000000000101...",
  "signature": "abc123def456..."
}
```

---

## 5. Broadcast Transaction

### Request
```bash
curl -X POST http://localhost:3001/contract/broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "rawTx": "02000000000101..."
  }'
```

### Response (Pending)
```json
{
  "txid": "333d18e4da09e5aee9437eb577970f1af382742033f9120cbe50ff532d8b6240",
  "status": "pending",
  "explorerUrl": "https://blockstream.info/liquidtestnet/tx/333d18e4da09e5aee9437eb577970f1af382742033f9120cbe50ff532d8b6240?expand"
}
```

### Response (Confirmed)
```json
{
  "txid": "333d18e4da09e5aee9437eb577970f1af382742033f9120cbe50ff532d8b6240",
  "status": "confirmed",
  "explorerUrl": "https://blockstream.info/liquidtestnet/tx/333d18e4da09e5aee9437eb577970f1af382742033f9120cbe50ff532d8b6240?expand",
  "transaction": {
    "txid": "333d18e4...",
    "vin": [...],
    "vout": [...]
  }
}
```

---

## 6. Query Transaction

### Request
```bash
curl http://localhost:3001/contract/transaction/333d18e4da09e5aee9437eb577970f1af382742033f9120cbe50ff532d8b6240
```

### Response
```json
{
  "txid": "333d18e4da09e5aee9437eb577970f1af382742033f9120cbe50ff532d8b6240",
  "transaction": {
    "txid": "333d18e4...",
    "version": 2,
    "locktime": 0,
    "vin": [...],
    "vout": [...],
    "size": 256,
    "weight": 1024,
    "fee": 100
  },
  "status": {
    "confirmed": true,
    "block_height": 123456,
    "block_hash": "abc123...",
    "block_time": 1234567890
  },
  "confirmed": true,
  "blockHeight": 123456,
  "blockTime": 1234567890,
  "explorerUrl": "https://blockstream.info/liquidtestnet/tx/333d18e4...?expand"
}
```

---

## Complete Workflow Example

```bash
#!/bin/bash
API_URL="http://localhost:3001"

# 1. Create contract
echo "Creating contract..."
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/contract/create" \
  -H "Content-Type: application/json" \
  -d '{}')

CONTRACT_ADDRESS=$(echo "$CREATE_RESPONSE" | jq -r '.contractAddress')
CMR=$(echo "$CREATE_RESPONSE" | jq -r '.cmr')
INTERNAL_KEY=$(echo "$CREATE_RESPONSE" | jq -r '.internalKey')
PROGRAM_SOURCE=$(echo "$CREATE_RESPONSE" | jq -r '.programSource')

echo "Contract: $CONTRACT_ADDRESS"
echo "CMR: $CMR"
echo

# 2. Fund contract
echo "Funding contract..."
FUND_RESPONSE=$(curl -s -X POST "$API_URL/contract/fund" \
  -H "Content-Type: application/json" \
  -d "{\"contractAddress\": \"$CONTRACT_ADDRESS\"}")

TXID=$(echo "$FUND_RESPONSE" | jq -r '.txid')
SCRIPT_PUBKEY=$(echo "$FUND_RESPONSE" | jq -r '.scriptPubkey')
ASSET=$(echo "$FUND_RESPONSE" | jq -r '.asset')
VALUE=$(echo "$FUND_RESPONSE" | jq -r '.value')

echo "Funding TXID: $TXID"
echo

# 3. Create PSET
echo "Creating PSET..."
PSET_RESPONSE=$(curl -s -X POST "$API_URL/contract/pset/create" \
  -H "Content-Type: application/json" \
  -d "{\"txid\": \"$TXID\"}")

PSET=$(echo "$PSET_RESPONSE" | jq -r '.pset')
echo "PSET created"
echo

# 4. Finalize PSET
echo "Finalizing PSET..."
FINALIZE_RESPONSE=$(curl -s -X POST "$API_URL/contract/pset/finalize" \
  -H "Content-Type: application/json" \
  -d "{
    \"pset\": \"$PSET\",
    \"scriptPubkey\": \"$SCRIPT_PUBKEY\",
    \"asset\": \"$ASSET\",
    \"value\": \"$VALUE\"
  }")

RAW_TX=$(echo "$FINALIZE_RESPONSE" | jq -r '.rawTx')
echo "PSET finalized"
echo

# 5. Broadcast transaction
echo "Broadcasting transaction..."
BROADCAST_RESPONSE=$(curl -s -X POST "$API_URL/contract/broadcast" \
  -H "Content-Type: application/json" \
  -d "{\"rawTx\": \"$RAW_TX\"}")

CLAIM_TXID=$(echo "$BROADCAST_RESPONSE" | jq -r '.txid')
echo "Transaction broadcast: $CLAIM_TXID"
echo

# 6. Query transaction
echo "Querying transaction..."
sleep 5
curl -s "$API_URL/contract/transaction/$CLAIM_TXID" | jq

echo
echo "✅ Complete workflow finished!"
echo "Explorer: https://blockstream.info/liquidtestnet/tx/$CLAIM_TXID?expand"
```

---

## Error Responses

### Missing Required Field
```json
{
  "error": "contractAddress is required"
}
```

### Script Execution Failed
```json
{
  "error": "Failed to create contract",
  "details": "Script execution failed: simc: command not found"
}
```

### Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "..."
}
```
