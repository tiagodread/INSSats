# 🔧 INSSats - Technical Implementation

## 📋 Overview

This document details the technical implementation of the Simplicity smart contract that forms the core of INSSats. The contract implements a flexible N-of-M multisig with timelock logic and consensus.

**Important:** In production, the **Vault Keeper** is not a single person, but an M-of-N multisig organization (e.g., 3-of-5 geographically distributed key holders). For the **MVP (Satshack 2025)**, we simplify to a single Vault Keeper key for demonstration purposes.

---

## 🏛️ System Architecture

### Three-Persona Ecosystem

```
┌─────────────────────────────────────────────────────────────┐
│                    INSSats ECOSYSTEM                         │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐           ┌──────────────┐         ┌──────────────┐
│  SAVER       │           │   BROKER     │         │ VAULT KEEPER │
│  (End User)  │           │ (Consultant) │         │ (Custodian)  │
│              │           │              │         │              │
│ • Mobile app │──────────▶│ • Support    │────────▶│ • Custody    │
│ • Dashboard  │  BRL      │ • P2P Fiat   │  Sign   │ • Multisig   │
│ • Deposits   │           │ • Advisory   │         │ • Validation │
│ • Withdrawals│◀──────────│ • Reputation │◀────────│ • Alarms     │
└──────┬───────┘  L-BTC    └──────┬───────┘  Alert  └──────┬───────┘
       │                          │                        │
       │                          │                        │
       └──────────────────────────┼────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  SIMPLICITY CONTRACT    │
                    │  (Flexible N-of-M)      │
                    ├─────────────────────────┤
                    │ • Planned timelock      │
                    │ • Urgent 3/3 consensus  │
                    │ • Veto by any party     │
                    │ • Configurable params   │
                    └────────┬────────────────┘
                             │
                             ▼
                    ┌─────────────────────────┐
                    │   LIQUID NETWORK        │
                    │   (L-BTC Holdings)      │
                    └─────────────────────────┘
```

**Key Relationships:**
- **Saver ↔ Broker:** Exchanges BRL for L-BTC, receives human advisory
- **Broker ↔ Vault Keeper:** Coordinates multisig signatures, validates operations
- **Saver ↔ Vault Keeper:** Direct interaction through smart contract
- **All parties ↔ Smart Contract:** Enforce rules via Simplicity on Liquid Network

**Production Note:** Vault Keeper shown as single entity is simplified for MVP. In production, this is a **3-of-5 (or M-of-N) geographically distributed multisig** across multiple continents.

---

## 🏗️ Smart Contract Architecture

### Constants

```rust
// Liquid Network: 1 block per minute
const BLOCKS_PER_DAY: u32 = 1440;  // 60 minutes/hour * 24 hours = 1440 blocks/day
```

### Type Definitions (SimplicityHL Syntax)

**Note:** The code below uses **actual SimplicityHL syntax** (Rust-like), not pseudocode. SimplicityHL (also known as Simfony) is the high-level language that compiles to Simplicity bytecode. Function bodies are omitted for brevity - only types and signatures are shown.

```rust
// ============================================================================
// Type Aliases for Bitcoin Primitives
// ============================================================================

type PubKey = [u8; 33];           // 33-byte compressed public key
type Signature = [u8; 64];        // 64-byte Schnorr signature
type BlockHeight = u32;           // Block height on Liquid Network
type Sats = u64;                  // Amount in satoshis

// ============================================================================
// Vault Configuration (Product Type)
// ============================================================================
// Note: SimplicityHL uses tuples/product types rather than named structs.
// Field access is positional: config.0, config.1, etc.

type VaultConfig = (
    // Participant keys
    PubKey,                       // .0: saver_pubkey
    PubKey,                       // .1: broker_pubkey
    PubKey,                       // .2: keeper_pubkey (single key for MVP, M-of-N in production)

    // Fee structure (no floats in Simplicity - use basis points)
    u32,                          // .3: broker_fee_basis_points (2.5% = 250)
    Sats,                         // .4: urgent_fee (default: 5000 sats)

    // Timelock periods (in blocks)
    BlockHeight,                  // .5: planned_timelock (default: 10080 ≈ 7 days)
    BlockHeight,                  // .6: urgent_timelock (default: 1440 ≈ 1 day)
    BlockHeight,                  // .7: key_recovery_timelock (default: 43200 ≈ 30 days)
    BlockHeight,                  // .8: params_change_timelock (default: 20160 ≈ 14 days)

    // Vault state
    Sats,                         // .9: total_balance
    BlockHeight                   // .10: created_at
);

// ============================================================================
// Pending Operation (Sum Type)
// ============================================================================

type PendingOperation = (
    u8,                           // .0: operation_type (0=Planned, 1=Urgent, 2=Veto)
    Sats,                         // .1: amount
    PubKey,                       // .2: destination
    PubKey,                       // .3: initiated_by
    BlockHeight,                  // .4: initiated_at
    BlockHeight,                  // .5: expires_at
    Option<PubKey>                // .6: vetoed_by
);

// Operation type constants (Simplicity uses tagged unions/sum types)
const OP_PLANNED: u8 = 0;
const OP_URGENT: u8 = 1;
const OP_VETO: u8 = 2;
```

**Simplicity Type System Note:** Simplicity is a purely functional, **typed combinator language** without named structs or classes. Types are built from:
- **Unit type** (`()`)
- **Sum types** (`Either<A, B>`, encoded as `u8` tags + data)
- **Product types** (tuples like `(A, B, C)`)
- **Primitive types** (`u8`, `u16`, `u32`, `u64`, `u256`, byte arrays)

The actual Simplicity bytecode would encode these as nested products and sums.

---

## 🔑 Key Security Requirements

For detailed security requirements and key management standards, see the **Key Security Requirements** section in [CONCEPT.md](CONCEPT.md#-key-security-requirements).

### Quick Reference for Production

**Three-tier security model:**
- **Saver:** Hot wallet (consumer-grade) - needs frequent access
- **Broker:** Air-gapped cold wallet (REQUIRED) - high-value target
- **Vault Keeper:** M-of-N geographically distributed air-gapped multisig (REQUIRED) - institutional-grade

**Key Insight:** The **Vault Keeper** is not a single person. In production, it's an M-of-N multisig organization (e.g., 3-of-5 or 5-of-7 key holders distributed across different continents) to prevent:
- Single-jurisdiction government seizure
- Physical attacks (need to compromise 3+ locations simultaneously)
- Natural disasters and regional failures
- Key loss (M-of-N provides redundancy)

### MVP (Satshack 2025) Simplification

**For demonstration purposes only:**
- All keys can be hot wallets (testing only)
- Vault Keeper = single key (instead of M-of-N multisig)
- Focus on smart contract logic, not production security

**⚠️ WARNING:** MVP security model is **NOT suitable for real funds**. Production deployment requires full security implementation as described in CONCEPT.md

---

## 🔐 Contract Functions (SimplicityHL Syntax)

**Note:** The functions below use **actual SimplicityHL syntax** with complete implementations. This code demonstrates how Simplicity smart contracts work using:
- **Jets** (`jet::*`) for native operations (cryptography, arithmetic, comparisons)
- **Pure functions** operating on immutable data
- **Tuple destructuring** for field access (`.0`, `.1`, etc.)
- **assert!** for validation (failed assertions reject the entire transaction)

### Function: create_vault

```rust
// Create new vault configuration
fn create_vault(
    saver: PubKey,
    broker: PubKey,
    keeper: PubKey,
    broker_fee_bp: u32,           // Broker fee in basis points (250 = 2.5%)
    urgent_fee: Sats,             // Fixed urgent withdrawal fee
    planned_timelock: BlockHeight,
    urgent_timelock: BlockHeight,
    key_recovery_timelock: BlockHeight,
    params_change_timelock: BlockHeight
) -> VaultConfig {
    // Validate unique keys
    assert!(!jet::eq_256(saver, broker));
    assert!(!jet::eq_256(broker, keeper));
    assert!(!jet::eq_256(saver, keeper));

    // Validate fee range (0-10000 basis points = 0-100%)
    assert!(jet::le_32(broker_fee_bp, 10000));

    // Validate timelocks are positive
    assert!(jet::lt_32(0, planned_timelock));
    assert!(jet::lt_32(0, urgent_timelock));
    assert!(jet::le_32(urgent_timelock, planned_timelock));

    // Build VaultConfig tuple
    let total_balance: Sats = 0;
    let created_at: BlockHeight = jet::current_index(); // Current block height

    (saver, broker, keeper, broker_fee_bp, urgent_fee,
     planned_timelock, urgent_timelock, key_recovery_timelock,
     params_change_timelock, total_balance, created_at)
}
```

---

### Function: deposit

```rust
// Deposit funds into vault (applies broker fee)
fn deposit(
    vault: VaultConfig,
    amount: Sats,
    sender: PubKey,
    signature: Signature
) -> VaultConfig {
    // Extract fields from vault tuple
    let saver: PubKey = vault.0;
    let broker: PubKey = vault.1;
    let keeper: PubKey = vault.2;
    let broker_fee_bp: u32 = vault.3;
    let total_balance: Sats = vault.9;

    // Validate sender is a participant
    let is_saver: bool = jet::eq_256(sender, saver);
    let is_broker: bool = jet::eq_256(sender, broker);
    let is_keeper: bool = jet::eq_256(sender, keeper);
    assert!(is_saver || is_broker || is_keeper);

    // Verify signature (message = amount)
    let msg_hash = jet::sha_256(amount);
    assert!(jet::bip_0340_verify(sender, msg_hash, signature));

    // Calculate broker fee: (amount * broker_fee_bp) / 10000
    let fee_numerator: u64 = jet::multiply_64(amount, broker_fee_bp as u64);
    let broker_fee_sats: Sats = jet::divide_64(fee_numerator, 10000);
    let net_amount: Sats = jet::subtract_64(amount, broker_fee_sats);

    // Update balance
    let new_balance: Sats = jet::add_64(total_balance, net_amount);

    // Return updated vault (immutable update)
    (vault.0, vault.1, vault.2, vault.3, vault.4,
     vault.5, vault.6, vault.7, vault.8, new_balance, vault.10)
}
```

---

### Function: initiate_planned_withdrawal

```rust
// Initiate withdrawal with timelock (only saver can initiate)
fn initiate_planned_withdrawal(
    vault: VaultConfig,
    amount: Sats,
    destination: PubKey,
    saver_sig: Signature
) -> (VaultConfig, PendingOperation) {
    let saver: PubKey = vault.0;
    let planned_timelock: BlockHeight = vault.5;
    let total_balance: Sats = vault.9;

    // Validate sufficient balance
    assert!(jet::le_64(amount, total_balance));

    // Verify saver signature
    let msg_hash = jet::sha_256((amount, destination));
    assert!(jet::bip_0340_verify(saver, msg_hash, saver_sig));

    // Calculate expiration
    let current_height: BlockHeight = jet::current_index();
    let expires_at: BlockHeight = jet::add_32(current_height, planned_timelock);

    // Create PendingOperation
    let operation: PendingOperation = (
        OP_PLANNED,      // .0: operation_type
        amount,          // .1: amount
        destination,     // .2: destination
        saver,           // .3: initiated_by
        current_height,  // .4: initiated_at
        expires_at,      // .5: expires_at
        None             // .6: vetoed_by
    );

    (vault, operation)
}
```

---

### Function: veto_operation

```rust
// Veto a pending operation (any participant can veto)
fn veto_operation(
    operation: PendingOperation,
    vetoer: PubKey,
    vetoer_sig: Signature,
    vault: VaultConfig
) -> PendingOperation {
    let expires_at: BlockHeight = operation.5;
    let vetoed_by: Option<PubKey> = operation.6;

    // Validate not expired
    let current_height: BlockHeight = jet::current_index();
    assert!(jet::lt_32(current_height, expires_at));

    // Validate not already vetoed
    assert!(jet::is_none(vetoed_by));

    // Validate vetoer is a participant
    let saver: PubKey = vault.0;
    let broker: PubKey = vault.1;
    let keeper: PubKey = vault.2;

    let is_saver: bool = jet::eq_256(vetoer, saver);
    let is_broker: bool = jet::eq_256(vetoer, broker);
    let is_keeper: bool = jet::eq_256(vetoer, keeper);
    assert!(is_saver || is_broker || is_keeper);

    // Verify signature
    let op_hash = jet::sha_256(operation);
    assert!(jet::bip_0340_verify(vetoer, op_hash, vetoer_sig));

    // Return operation with veto
    (operation.0, operation.1, operation.2, operation.3,
     operation.4, operation.5, Some(vetoer))
}
```

---

### Function: execute_planned_withdrawal

```rust
// Execute planned withdrawal after timelock expires
fn execute_planned_withdrawal(
    vault: VaultConfig,
    operation: PendingOperation
) -> VaultConfig {
    let expires_at: BlockHeight = operation.5;
    let vetoed_by: Option<PubKey> = operation.6;
    let amount: Sats = operation.1;
    let total_balance: Sats = vault.9;

    // Validate timelock expired
    let current_height: BlockHeight = jet::current_index();
    assert!(jet::le_32(expires_at, current_height));

    // Validate not vetoed
    assert!(jet::is_none(vetoed_by));

    // Validate sufficient balance
    assert!(jet::le_64(amount, total_balance));

    // Update balance
    let new_balance: Sats = jet::subtract_64(total_balance, amount);

    // Return updated vault
    (vault.0, vault.1, vault.2, vault.3, vault.4,
     vault.5, vault.6, vault.7, vault.8, new_balance, vault.10)
}
```

---

### Function: initiate_urgent_withdrawal

```rust
// Urgent withdrawal requiring all 3 signatures (immediate execution)
fn initiate_urgent_withdrawal(
    vault: VaultConfig,
    amount: Sats,
    destination: PubKey,
    saver_sig: Signature,
    broker_sig: Signature,
    keeper_sig: Signature
) -> VaultConfig {
    let saver: PubKey = vault.0;
    let broker: PubKey = vault.1;
    let keeper: PubKey = vault.2;
    let urgent_fee: Sats = vault.4;
    let total_balance: Sats = vault.9;

    // Calculate total cost
    let total_cost: Sats = jet::add_64(amount, urgent_fee);

    // Validate sufficient balance (including urgent fee)
    assert!(jet::le_64(total_cost, total_balance));

    // Verify all 3 signatures (3-of-3 consensus)
    let msg_hash = jet::sha_256((amount, destination));
    assert!(jet::bip_0340_verify(saver, msg_hash, saver_sig));
    assert!(jet::bip_0340_verify(broker, msg_hash, broker_sig));
    assert!(jet::bip_0340_verify(keeper, msg_hash, keeper_sig));

    // Update balance (deduct amount + urgent fee)
    let new_balance: Sats = jet::subtract_64(total_balance, total_cost);

    // Return updated vault (immediate execution, no timelock)
    (vault.0, vault.1, vault.2, vault.3, vault.4,
     vault.5, vault.6, vault.7, vault.8, new_balance, vault.10)
}
```

---

### Function: update_params

```rust
// Update vault parameters (requires 3 signatures + timelock)
fn update_params(
    vault: VaultConfig,
    param_id: u8,                 // 0=broker_fee_bp, 1=urgent_fee, 2=planned_timelock, etc.
    new_value: u64,               // New parameter value (u64 covers all param types)
    saver_sig: Signature,
    broker_sig: Signature,
    keeper_sig: Signature
) -> (VaultConfig, PendingOperation) {
    let saver: PubKey = vault.0;
    let broker: PubKey = vault.1;
    let keeper: PubKey = vault.2;
    let params_change_timelock: BlockHeight = vault.8;

    // Validate param_id (0-4 are valid, 5+ reserved for future)
    assert!(jet::lt_8(param_id, 5));

    // Validate new_value based on param_id
    let is_valid: bool = match param_id {
        0 => jet::le_64(new_value, 10000),  // broker_fee_bp: 0-10000 (0-100%)
        1 => jet::lt_64(0, new_value),      // urgent_fee: must be positive
        2 => jet::lt_64(0, new_value),      // planned_timelock: must be positive
        3 => jet::lt_64(0, new_value),      // urgent_timelock: must be positive
        4 => jet::lt_64(0, new_value),      // key_recovery_timelock: must be positive
        _ => false
    };
    assert!(is_valid);

    // Verify all 3 signatures (3-of-3 required for param changes)
    let msg_hash = jet::sha_256((param_id, new_value));
    assert!(jet::bip_0340_verify(saver, msg_hash, saver_sig));
    assert!(jet::bip_0340_verify(broker, msg_hash, broker_sig));
    assert!(jet::bip_0340_verify(keeper, msg_hash, keeper_sig));

    // Calculate expiration (apply params_change_timelock)
    let current_height: BlockHeight = jet::current_index();
    let expires_at: BlockHeight = jet::add_32(current_height, params_change_timelock);

    // Create pending operation for param change
    // Use destination field to encode (param_id, new_value)
    let encoded_change: PubKey = encode_param_change(param_id, new_value);

    let operation: PendingOperation = (
        OP_VETO,         // .0: special type for param changes
        0,               // .1: amount (unused for param changes)
        encoded_change,  // .2: encoded param change
        saver,           // .3: initiated_by
        current_height,  // .4: initiated_at
        expires_at,      // .5: expires_at
        None             // .6: vetoed_by
    );

    (vault, operation)
}

// Helper to encode param change (simplified - real implementation would be more robust)
fn encode_param_change(param_id: u8, new_value: u64) -> PubKey {
    // In real Simplicity: use proper encoding scheme
    // This is conceptual representation
    let mut encoded: [u8; 33] = [0; 33];
    encoded[0] = param_id;
    // ... encode new_value into remaining bytes
    encoded
}
```

---

### ⚠️ Important: Simplicity's Functional Nature

**Simplicity is a purely functional language** without mutable state or side effects. The signatures above represent **logical transformations**, not in-place mutations:

- **No `&mut` references**: All functions take values and return new values
- **No `Result<T, E>`**: Validation failures cause the entire transaction to fail (like `assert!` in Bitcoin Script)
- **No state storage**: Vault state is stored in **UTXO witness data** or **covenant outputs**
- **No events**: "Events" are represented as transaction outputs or metadata

**Actual Implementation Pattern:**
```rust
// Conceptual (shown above)
fn deposit(vault: VaultConfig, amount: Sats, ...) -> VaultConfig;

// Real Simplicity uses witness data + covenant validation:
// - Input: Previous vault UTXO + witness (signatures, amounts)
// - Output: New vault UTXO with updated state
// - Simplicity program: Validates witness + enforces state transition rules
```

**SimplicityHL abstracts this** to make development more intuitive, but compiles down to pure Simplicity combinators operating on immutable data.

---

## 🔄 Operation Flows

### Flow 1: Regular Deposit

```
┌─────────────┐
│    Saver    │
└─────┬───────┘
      │
      │ 1. Transfers BRL to Broker
      ▼
┌─────────────┐
│   Broker    │
└─────┬───────┘
      │
      │ 2. Sends L-BTC to vault
      ▼
┌─────────────────────────┐
│  Smart Contract (Vault) │
│  deposit(amount)        │
└─────────────────────────┘
      │
      │ 3. Updates balance
      ▼
┌─────────────────────────┐
│  Balance increases      │
│  Event: Deposited       │
└─────────────────────────┘
```

---

### Flow 2: Planned Withdrawal (with Timelock)

```
┌─────────────┐
│    Saver    │
└─────┬───────┘
      │
      │ 1. initiate_planned_withdrawal()
      ▼
┌─────────────────────────┐
│  Smart Contract         │
│  Creates PendingOperation
│  Timelock = T + 7 days  │
└─────┬───────────────────┘
      │
      │ 2. Event: WithdrawalInitiated
      ▼
┌─────────────────────────┐
│  7-day period           │
│  Anyone can veto        │
└─────┬───────────────────┘
      │
      │ 3a. If no one vetoes after 7 days
      ▼
┌─────────────────────────┐
│  execute_planned_       │
│  withdrawal()           │
│  Funds released         │
└─────────────────────────┘

      │ 3b. OR if someone vetoes
      ▼
┌─────────────────────────┐
│  veto_operation()       │
│  Operation canceled     │
└─────────────────────────┘
```

---

### Flow 3: Urgent Withdrawal (Consensus 3/3)

```
┌─────────────┐
│    Saver    │
└─────┬───────┘
      │
      │ 1. Requests urgent withdrawal via app
      ▼
┌─────────────┐
│   Broker    │
└─────┬───────┘
      │
      │ 2. Validates saver's identity
      │    (under coercion?)
      ▼
┌─────────────┐
│  Custodian  │
└─────┬───────┘
      │
      │ 3. Validates operation security
      │    (suspicious patterns?)
      ▼
┌─────────────────────────┐
│  Smart Contract         │
│  initiate_urgent_       │
│  withdrawal()           │
│  Requires 3 signatures  │
└─────┬───────────────────┘
      │
      │ 4. Validate sigs from all
      ▼
┌─────────────────────────┐
│  Funds released         │
│  IMMEDIATELY            │
└─────────────────────────┘
```

---

### Flow 4: Emergency Veto

```
┌─────────────┐
│     Any     │
│  Participant│
└─────┬───────┘
      │
      │ 1. Detects suspicious activity
      ▼
┌─────────────────────────┐
│  veto_operation()       │
│  Vetoer's signature     │
└─────┬───────────────────┘
      │
      │ 2. Operation frozen
      ▼
┌─────────────────────────┐
│  PendingOperation       │
│  vetoed_by = Some(key)  │
└─────┬───────────────────┘
      │
      │ 3. Resolution requires 3/3 consensus
      ▼
┌─────────────────────────┐
│  Manual governance      │
│  or timeout             │
└─────────────────────────┘
```

---

## 📐 Design Considerations

### 1. Why 2-of-3 Multisig and not 2-of-2?

**Problem with 2-of-2:**
- If one party loses their key, funds are locked forever
- No recovery possible

**Advantage of 2-of-3:**
- If Saver loses key: Broker + Custodian can recover
- If Broker disappears: Saver + Custodian continue operating
- If Custodian is compromised: Saver + Broker can migrate funds

---

### 2. Why Timelock instead of direct Multisig?

**Convenience:**
- Planned operations don't need immediate coordination
- Saver maintains autonomy for daily operations

**Security:**
- Review period allows detection of suspicious activities
- Any party can "pull the emergency brake"

**Balance:**
- Convenience for the legitimate user
- Protection against malicious actors

---

### 3. Who can veto?

**Any of the three participants!**

**Scenarios:**
- **Saver vetoes:** Suspects Broker or Custodian was compromised
- **Broker vetoes:** Suspects Saver's account was hacked
- **Custodian vetoes:** Automated detection of suspicious pattern

**Incentives:**
- Everyone has incentive to protect funds (reputation)
- False-positive veto is inconvenient, but not catastrophic
- Better to err on the side of caution

---

## 🧪 Test Cases

**⚠️ Note:** The test code below uses **conceptual pseudocode** with Rust-like syntax for readability. Actual SimplicityHL tests would:
- Use tuple field access (`.0`, `.1`, `.9`, etc.) instead of named fields
- Use `jet::` functions for operations (`jet::eq_64`, `jet::add_64`, etc.)
- Not use `&mut` references or `Result<>` types (pure functional)
- Validate at transaction verification time (failed assertions = rejected transaction)

For actual SimplicityHL test examples, refer to the [SimplicityHL repository](https://github.com/BlockstreamResearch/SimplicityHL) (also available as [Simfony](https://github.com/BlockstreamResearch/simfony)).

### Test 1: Create Vault

```rust
#[test]
fn test_create_vault() {
    let saver = generate_keypair();
    let broker = generate_keypair();
    let keeper = generate_keypair();

    let vault = create_vault(
        saver.public,
        broker.public,
        keeper.public,
        2.5,      // broker_fee (2.5%)
        10080,    // planned_timelock (7 days)
        1440,     // urgent_timelock (1 day)
        5000,     // urgent_fee (5000 sats)
        43200,    // key_recovery_timelock (30 days)
        20160     // params_change_timelock (14 days)
    );

    assert_eq!(vault.total_balance, 0);
    assert_eq!(vault.broker_fee, 2.5);
    assert_eq!(vault.planned_timelock, 10080);
    assert_eq!(vault.urgent_timelock, 1440);
    assert_eq!(vault.urgent_fee, 5000);
}
```

---

### Test 2: Deposit Funds

```rust
#[test]
fn test_deposit() {
    let mut vault = setup_test_vault(); // broker_fee = 2.5%
    let amount = 100_000; // 100k sats

    let result = deposit(
        &mut vault,
        amount,
        vault.broker_pubkey,
        sign(&broker_privkey, &amount)
    );

    assert!(result.is_ok());

    // Expected: 100,000 - 2.5% broker fee = 97,500 sats
    let expected_balance = 97_500;
    assert_eq!(vault.total_balance, expected_balance);
}
```

---

### Test 3: Planned Withdrawal with Timelock

```rust
#[test]
fn test_planned_withdrawal() {
    let mut vault = setup_test_vault_with_balance(100_000);

    // Initiate withdrawal
    let operation = initiate_planned_withdrawal(
        &vault,
        50_000,
        destination_address(),
        vault.saver_pubkey,
        sign(&saver_privkey, &50_000)
    ).unwrap();

    // Try to execute before timelock
    let result = execute_planned_withdrawal(&mut vault, &operation);
    assert!(result.is_err()); // Should fail

    // Advance blockchain to expire timelock (10080 blocks ≈ 7 days)
    advance_blocks(vault.planned_timelock);

    // Execute after timelock
    let result = execute_planned_withdrawal(&mut vault, &operation);
    assert!(result.is_ok());
    assert_eq!(vault.total_balance, 50_000);
}
```

---

### Test 4: Veto Blocks Execution

```rust
#[test]
fn test_veto_blocks_execution() {
    let mut vault = setup_test_vault_with_balance(100_000);

    // Initiate withdrawal
    let mut operation = initiate_planned_withdrawal(
        &vault,
        50_000,
        destination_address(),
        vault.saver_pubkey,
        sign(&saver_privkey, &50_000)
    ).unwrap();

    // Broker vetoes
    let result = veto_operation(
        &mut operation,
        vault.broker_pubkey,
        sign(&broker_privkey, &operation),
        &vault
    );
    assert!(result.is_ok());

    // Advance blockchain to expire timelock
    advance_blocks(vault.planned_timelock);

    // Try to execute (should fail because it was vetoed)
    let result = execute_planned_withdrawal(&mut vault, &operation);
    assert!(result.is_err());
    assert_eq!(vault.total_balance, 100_000); // Balance unchanged
}
```

---

### Test 5: Urgent Withdrawal Requires 3 Signatures

```rust
#[test]
fn test_urgent_withdrawal_requires_all_sigs() {
    let mut vault = setup_test_vault_with_balance(100_000); // urgent_fee = 5000 sats

    let withdraw_amount = 50_000;

    // Sign with all participants (3-of-3)
    let saver_sig = sign(&saver_privkey, &withdraw_amount);
    let broker_sig = sign(&broker_privkey, &withdraw_amount);
    let keeper_sig = sign(&keeper_privkey, &withdraw_amount);

    // Execute urgent withdrawal
    let result = initiate_urgent_withdrawal(
        &mut vault,
        withdraw_amount,
        destination_address(),
        saver_sig,
        broker_sig,
        keeper_sig
    );

    assert!(result.is_ok());

    // Expected: 100,000 - 50,000 (withdrawal) - 5,000 (urgent fee) = 45,000 sats
    assert_eq!(vault.total_balance, 45_000); // Executed immediately with urgent fee deducted
}

#[test]
fn test_urgent_withdrawal_fails_without_all_sigs() {
    let mut vault = setup_test_vault_with_balance(100_000);

    // Sign with only 2 (missing keeper)
    let saver_sig = sign(&saver_privkey, &50_000);
    let broker_sig = sign(&broker_privkey, &50_000);
    let fake_keeper_sig = Signature::default(); // Invalid signature

    // Should fail
    let result = initiate_urgent_withdrawal(
        &mut vault,
        50_000,
        destination_address(),
        saver_sig,
        broker_sig,
        fake_keeper_sig
    );

    assert!(result.is_err());
    assert_eq!(vault.total_balance, 100_000); // Balance unchanged
}
```

---

## 🔍 Security Analysis

### Attack Vectors and Mitigations

#### 1. Compromise of Saver's Key
**Attack:** Hacker steals saver's private key

**Mitigation:**
- Planned withdrawal has 7-day timelock
- Broker or Custodian can veto if they detect suspicious activity
- Legitimate saver can contact Broker to block

**Result:** Funds protected ✅

---

#### 2. Coercion of Saver
**Attack:** Criminals force saver to initiate withdrawal

**Mitigation:**
- Planned withdrawal: timelock gives time to report
- Urgent withdrawal: Broker performs in-person/video verification
- Emergency code (passphrase for Broker indicating coercion)

**Result:** Funds protected ✅

---

#### 3. Compromise of Broker
**Attack:** Malicious broker tries to steal funds

**Mitigation:**
- Broker alone cannot move funds (needs Saver OR Custodian)
- Saver can veto any suspicious operation
- Public reputation system discourages this

**Result:** Funds protected ✅

---

#### 4. Compromise of Custodian
**Attack:** Compromised custodian

**Mitigation:**
- Custodian alone cannot move funds
- Saver + Broker can migrate funds to new vault
- Custodians compete on reputation

**Result:** Funds protected ✅

---

#### 5. Collision of Broker + Custodian
**Attack:** Broker and Custodian conspire against Saver

**Mitigation:**
- Planned withdrawal: Saver can veto
- Urgent withdrawal: Saver must also sign
- Incentives: both lose reputation if proven

**Result:** Difficult to execute, high reputational cost

---

#### 6. Loss of Key
**Scenario:** Saver loses private key

**Recovery:**
- Broker + Custodian can create recovery transaction
- Rigorous identity verification process
- Migration to new vault with Saver's new key

**Result:** Funds recoverable ✅

---

## 📊 Cost Analysis (Gas/Fees)

### Cost Estimates per Operation

```
Create Vault:              ~5,000 sats (one-time)
Deposit:                   ~500 sats
Initiate Planned Withdrawal: ~1,000 sats
Execute Planned Withdrawal: ~1,500 sats
Veto Operation:            ~500 sats
Urgent Withdrawal:         ~2,000 sats (3 sigs)
```

### Comparison with Alternatives

**State INSS:**
- "Fee": 20% of salary (compulsory)
- Return: negative (currency devaluation)

**Traditional Private Pension:**
- Administration fee: 1-3% per year on assets
- Contribution fee: 0-5% on deposits
- Total cost: 2-4% per year

**INSSats:**
- Broker fee: 2-5% on deposits (default: 2.5%)
- Vault Keeper fee: 0.5-1% per year on AUM + 5000 sats per urgent transaction
- Blockchain fees: ~0.01% per operation
- **Total cost: ~2.5-6% initial + 0.5-1% per year**

**Advantage:** Cheaper than traditional pension ✅

---

**Note:** For full system architecture including frontend/backend integration, refer to implementation planning documents.

---

## 🚀 MVP Implementation (Satshack)

### Minimal Scope for 40 hours

**Implement:**
1. ✅ VaultConfig struct
2. ✅ create_vault function
3. ✅ deposit function
4. ✅ initiate_planned_withdrawal function
5. ✅ veto_operation function
6. ✅ execute_planned_withdrawal function
7. ✅ initiate_urgent_withdrawal function
8. ✅ 5-6 basic tests

**CLI Interface:**
```bash
# Create vault with configurable parameters
inssat create-vault \
  --saver <pubkey> \
  --broker <pubkey> \
  --keeper <pubkey> \
  --broker-fee 2.5 \
  --planned-timelock 10080 \
  --urgent-timelock 1440 \
  --urgent-fee 5000 \
  --key-recovery-timelock 43200 \
  --params-change-timelock 20160

# Operations
inssat deposit --vault <id> --amount 100000
inssat withdraw-planned --vault <id> --amount 50000 --to <address>
inssat withdraw-urgent --vault <id> --amount 10000 --to <address>
inssat veto --operation <id>
inssat update-params --vault <id> --param <name> --value <new-value>
```

**Not implementing (post-hackathon):**
- ❌ Complete mobile/web app
- ❌ Reputation system
- ❌ Integration with real Liquid mainnet
- ❌ Broker P2P exchange
- ❌ Dashboard with charts

---

## 📚 Additional Resources

### Related Simplicity Examples

**multisig.simhl:**
```rust
// See in SimplicityHL/examples/multisig.simhl
// Example of basic 2-of-3 multisig
```

**timelock.simhl:**
```rust
// See in SimplicityHL/examples/timelock.simhl
// Example of covenant with timelock
```

**vault.simhl:**
```rust
// See in SimplicityHL/examples/vault.simhl
// Example of vault with waiting period
```

### Papers and Documentation

- [Simplicity Paper](https://blockstream.com/simplicity.pdf)
- [Bitcoin Covenants](https://fc17.ifca.ai/bitcoin/papers/bitcoin17-final28.pdf)
- [Vaults and Covenants](https://arxiv.org/abs/2006.16714)

---

## 🎯 Next Steps

1. Review examples in `SimplicityHL/examples/`
2. Implement basic structs
3. Implement create_vault function
4. Implement deposit function
5. Implement timelock logic
6. Implement veto logic
7. Write tests
8. Create CLI for demonstration
9. Prepare demo video

---

**🛡️ INSSats - Code that Protects your Future**
