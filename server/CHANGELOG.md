# Changelog - INSSats API Server

## 2024-01-XX - API Modularization & Security Fixes

### 🔒 Security Enhancements

**Critical: Removed Client Control Over Contract Logic**

- **Issue**: Previously, clients could control `programSource` and `internalKey` via API requests, allowing potential injection of malicious contract code
- **Fix**: These parameters are now **server-side only constants** that cannot be modified by clients
- **Affected Endpoints**:
  - `POST /contract/create` - No longer accepts any input parameters
  - `POST /contract/pset/finalize` - Removed `programSource` and `internalKey` from request body
  
**What Changed**:
```typescript
// BEFORE (Vulnerable)
interface ContractCreateRequest {
  programSource?: string;  // Client could inject malicious contract!
  internalKey?: string;    // Client could use unauthorized keys!
}

// AFTER (Secure)
interface ContractCreateRequest {
  // Empty - contract logic defined server-side only
}
```

```typescript
// BEFORE (Vulnerable)
interface PsetFinalizeRequest {
  pset: string;
  cmr: string;
  internalKey: string;      // Client controlled!
  programSource: string;    // Client controlled!
  scriptPubkey: string;
  asset: string;
  value: string;
}

// AFTER (Secure)
interface PsetFinalizeRequest {
  pset: string;
  scriptPubkey: string;
  asset: string;
  value: string;
  cmr?: string;  // Optional - server uses default if not provided
}
```

### 🔧 Script Improvements

**Made Scripts API-Compatible via Environment Variable Overrides**

All bash scripts now support being called via API without requiring intermediate files:

1. **`2-fund-contract.sh`**
   - Added: `CONTRACT_ADDRESS_OVERRIDE` support
   - Falls back to file if override not provided

2. **`3-create-pset.sh`**
   - Added: `FUNDING_TXID_OVERRIDE` support
   - Can accept transaction ID via environment variable

3. **`4-finalize-pset.sh`**
   - Added multiple override variables:
     - `PSET_OVERRIDE` - PSET data
     - `CMR_OVERRIDE` - Contract Merkle Root
     - `SCRIPT_PUBKEY_OVERRIDE` - Script public key
     - `ASSET_OVERRIDE` - Asset ID
     - `VALUE_OVERRIDE` - Value amount
   - Removed requirement for `internalKey` and `programSource` from external sources
   - Uses server defaults for these security-critical parameters

4. **`5-broadcast-transaction.sh`**
   - Added: `RAW_TX_OVERRIDE` support
   - Can broadcast transactions passed via environment variable

### 📝 API Endpoint Updates

#### `POST /contract/create`
- **Security**: No longer accepts client input
- **Response**: Returns server-controlled contract details for reference

#### `POST /contract/fund`
- **Fixed**: Now works without requiring contract-info.json file
- **Uses**: `CONTRACT_ADDRESS_OVERRIDE` environment variable

#### `POST /contract/pset/create`
- **Fixed**: Now works without requiring funding-info.json file
- **Uses**: `FUNDING_TXID_OVERRIDE` environment variable

#### `POST /contract/pset/finalize`
- **Security**: Removed `programSource` and `internalKey` from request
- **Required**: `pset`, `scriptPubkey`, `asset`, `value`
- **Optional**: `cmr`, `privateKey`, `witnessFile`
- **Uses**: Multiple override variables to avoid file dependencies

#### `POST /contract/broadcast`
- **Fixed**: Now works without requiring pset-finalized.json file
- **Uses**: `RAW_TX_OVERRIDE` environment variable

#### `GET /contract/transaction/:txid`
- **Unchanged**: Still queries transaction status via Esplora API

### 🧪 Testing

**New Test Script**: `test-complete-workflow.sh`

- Tests all 6 endpoints in sequence
- Validates entire contract lifecycle
- Provides colored output with clear success/failure indicators
- Usage: `./test-complete-workflow.sh`

### 📚 Documentation

**Updated**: `API_EXAMPLES.md`
- Removed client-controlled security parameters from examples
- Added security warnings explaining server-side contract logic
- Updated complete workflow example
- Simplified PSET finalization requests

### 🔄 Migration Guide

If you were previously using the API with custom `programSource` or `internalKey`:

**Before**:
```bash
curl -X POST http://localhost:3001/contract/create \
  -d '{"programSource": "/custom/contract.simf", "internalKey": "abc123..."}'
```

**After**:
```bash
# Contract logic is now server-controlled
curl -X POST http://localhost:3001/contract/create \
  -d '{}'
```

**Before**:
```bash
curl -X POST http://localhost:3001/contract/pset/finalize \
  -d '{
    "pset": "...",
    "programSource": "/custom/contract.simf",
    "internalKey": "abc123...",
    ...
  }'
```

**After**:
```bash
# Server uses its own contract logic - client only provides PSET details
curl -X POST http://localhost:3001/contract/pset/finalize \
  -d '{
    "pset": "...",
    "scriptPubkey": "...",
    "asset": "...",
    "value": "..."
  }'
```

### 🎯 Benefits

1. **Security**: Prevents malicious contract injection attacks
2. **Simplicity**: Clients no longer need to manage contract source files
3. **Reliability**: Scripts work independently without file dependencies
4. **Stateless**: API can be called without maintaining state files between requests
5. **Testability**: Complete workflow can be tested end-to-end via single script

### ⚠️ Breaking Changes

- `POST /contract/create` no longer accepts any request body parameters
- `POST /contract/pset/finalize` no longer accepts `programSource` or `internalKey`
- Applications using these parameters must be updated to work with server-controlled contract logic

### 🚀 What's Next

- [ ] Add authentication/authorization
- [ ] Implement rate limiting
- [ ] Add webhook support for transaction confirmations
- [ ] Support multiple contract types
- [ ] Add contract state persistence
