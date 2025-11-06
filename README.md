# 🛡️ INSSats - Decentralized Pension on Bitcoin

> **Your retirement, your rules, your Bitcoin.**

**INSSats** is a decentralized private pension platform built on Bitcoin, offering an alternative to state pension systems (like Brazil's INSS). Using Simplicity smart contracts, multisig custody, and human consultancy, we create a retirement system that is:

- ✅ **Secure:** Flexible multisig with intelligent timelock
- ✅ **Transparent:** Auditable public blockchain
- ✅ **Sovereign:** You control your funds, not the government
- ✅ **Sustainable:** Bitcoin as store of value (vs. inflationary fiat)
- ✅ **Supported:** Human broker for personalized advisory

---

## 📖 Table of Contents

- [Problems We Solve](#-state-pension-problems-we-solve)
- [Architecture](#-architecture-3-personas)
- [Security Model](#-intelligent-multisig-security)
- [Quick Start](#-quick-start)
- [Setup Environment](#-setup-environment)
- [MVP Scope](#-mvp-for-satshack-2025)
- [Development Workflow](#-development-workflow)
- [Testing Strategy](#-testing-strategy)
- [Key Concepts](#-key-concepts-to-understand)
- [Documentation Index](#-documentation-index)
- [Why Simplicity](#-why-use-simplicity)
- [Troubleshooting](#-troubleshooting)
- [Learning Resources](#-learning-resources)

---

## 🔥 State Pension Problems We Solve

| State Pension Problem | INSSats Solution |
|----------------------|------------------|
| 🏛️ Deficit-ridden state centralization | Decentralized Bitcoin |
| 📉 Monetary devaluation | L-BTC as reserve |
| 🚫 No exit option | Voluntary and flexible |
| 💸 Risk of fund misappropriation | Immutable smart contracts |
| ⚖️ Arbitrary rule changes | Permanently coded rules |
| 👻 Lack of advisory | Dedicated human broker |

---

## 🏗️ Architecture: 3 Personas

### 👤 **1. SAVER**
- Complete management app
- Dashboard with balance and projections
- Retirement simulator
- Full control of resources

### 🤝 **2. BROKER (Consultant)**
- Human financial advisory
- P2P exchange (Fiat → L-BTC)
- Onboarding and support
- Identity validation

### 🔐 **3. VAULT KEEPER (Custodian)**
- Can be a single person or a group of people, each with their own key
- Technical custody of funds
- Security validation
- Proof of reserves
- Alarm system

---

## 🔐 Intelligent Multisig Security

```
┌─────────────────────────────────────┐
│   SIMPLICITY SMART CONTRACT         │
│   Flexible Multisig (M-of-N)        │
│                                     │
│   Key 1: Saver                      │
│   Key 2: Broker                     │
│   Key 3+: Vault Keeper(s)           │
└─────────────────────────────────────┘
```

The multisig configuration can be:
- **1-of-3**: Single signature for planned operations
- **2-of-3**: Two signatures for standard withdrawals
- **3-of-3**: Full consensus for urgent/emergency operations

### Planned Operations (with Timelock)
- Saver schedules operation
- Configurable timelock activated (default: 10080 blocks ≈ 7 days on Liquid)
- **Any party can veto** during timelock period
- If no veto → automatic execution
- ✅ **Signature requirement varies by contract configuration**

### Urgent Operations (Full Consensus)
- Saver requests urgent withdrawal
- Broker validates identity
- Vault Keeper validates security
- ✅ **Requires all signatures (N-of-N)**
- Immediate execution

### Emergency Veto
- **Any party** detects suspicious activity
- Issues veto → operation frozen
- Resolution requires full consensus

---

## 🎯 MVP for Satshack 2025

**Goal:** Build a functional proof-of-concept in **40 hours**

### What to Implement

**✅ Smart Contract (20h):**
- Multisig N-of-M structure
- Timelock for planned operations
- 3/3 consensus for urgent operations
- Veto function
- 5-6 unit tests

**✅ CLI Interface (10h):**
```bash
# Create vault with configurable parameters
inssat create-vault \
  --saver <key> \
  --broker <key> \
  --keeper <key> \
  --broker-fee <percentage> \
  --planned-timelock <blocks> \
  --urgent-timelock <blocks> \
  --urgent-fee <sats> \
  --key-recovery-timelock <blocks> \
  --params-change-timelock <blocks>

# Operations
inssat deposit --vault <id> --amount <sats>
inssat withdraw-planned --vault <id> --amount <sats> --to <addr>
inssat withdraw-urgent --vault <id> --amount <sats> --to <addr>
inssat veto --operation <id>
inssat update-params --vault <id> --param <name> --value <new-value>
```

**✅ Documentation (5h):**
- Technical README
- How to run guide
- Architecture diagram

**✅ Pitch Video (5h):**
- Problem (30s)
- Solution (60s)
- Demo (60s)
- Tech + Vision (30s)

### What NOT to Implement

- ❌ Full mobile/web app
- ❌ Real Liquid mainnet integration (use testnet)
- ❌ Broker reputation system
- ❌ Graphical dashboard

---

## 💻 Development Workflow

### Day 1: Foundation (10h)

```bash
# 1. Setup & planning (2h)
- Configure environment
- Review architecture
- Define data structures

# 2. Core implementation (8h)
- Create VaultConfig struct
- Implement create_vault()
- Implement deposit()
- Basic tests
```

### Day 2: Features (18h)

```bash
# 3. Timelock logic (6h)
- Implement initiate_planned_withdrawal()
- Implement execute_planned_withdrawal()
- Timelock tests

# 4. Consensus & veto (6h)
- Implement veto_operation()
- Implement initiate_urgent_withdrawal()
- Multi-signature validation

# 5. CLI interface (6h)
- Command parsing
- Integration with contract
- User feedback
```

### Day 3: Polish (12h)

```bash
# 6. Testing & debugging (4h)
- Integration tests
- Edge case coverage
- Bug fixes

# 7. Documentation (3h)
- README with examples
- Code comments
- Architecture docs

# 8. Video pitch (5h)
- Script
- Recording
- Editing
```

---

## 🧪 Testing Strategy

### Unit Tests (Target: 80% coverage)

```rust
#[test]
fn test_create_vault()
fn test_deposit()
fn test_planned_withdrawal_with_timelock()
fn test_veto_blocks_execution()
fn test_urgent_withdrawal_requires_all_sigs()
fn test_veto_prevents_execution()
```

### Integration Tests

```rust
#[test]
fn test_full_deposit_withdraw_flow()
fn test_emergency_veto_scenario()
fn test_multisig_validation()
```

### Manual Testing Flow

```bash
# 1. Create vault with default parameters
inssat create-vault \
  --saver $SAVER \
  --broker $BROKER \
  --keeper $KEEPER \
  --broker-fee 2.5 \
  --planned-timelock 10080 \
  --urgent-timelock 1440 \
  --urgent-fee 5000 \
  --key-recovery-timelock 43200 \
  --params-change-timelock 20160

# 2. Deposit funds
inssat deposit --vault $VAULT_ID --amount 100000

# 3. Schedule planned withdrawal (should activate 10080-block timelock ≈ 7 days)
inssat withdraw-planned --vault $VAULT_ID --amount 50000 --to $DEST

# 4. Try to execute immediately (should fail - timelock active)
inssat execute --operation $OP_ID

# 5. Mine 10080 blocks on Liquid (in regtest)
# elements-cli -regtest generatetoaddress 10080 <address>

# 6. Execute (should succeed - timelock expired)
inssat execute --operation $OP_ID

# 7. Test urgent withdrawal (requires all 3 signatures)
inssat withdraw-urgent --vault $VAULT_ID --amount 10000 --to $DEST

# 8. Test veto mechanism
inssat withdraw-planned --vault $VAULT_ID --amount 20000 --to $DEST2
inssat veto --operation $OP_ID2 --by $BROKER

# 9. Test parameter update (20160 blocks ≈ 14 days)
inssat update-params --vault $VAULT_ID --param planned-timelock --value 20160
```

---

## 🔍 Key Concepts to Understand

### 1. Multisig
- **Standard multisig:** Requires 2 out of 3 keys to move funds
- **INSSats twist:** Different rules for different operations
  - Planned (timelock): 1 signature + time delay + no veto
  - Urgent: 3 signatures immediately
  - Intermediate: Requires 2 out of 3 keys to move funds with lower time delay

### 2. Timelock
- **What:** Delay period (in blocks) before operation executes
- **Why:** Gives time to detect and veto suspicious activity
- **INSSats default:** 10080 blocks (~7 days) for planned withdrawals
- **Liquid Network:** Uses block height (1 block = 1 minute), not timestamps

### 3. Veto Mechanism
- **Who:** Any of the 3 parties can veto
- **When:** During timelock period
- **Effect:** Freezes operation, requires 3/3 to resolve

### 4. Configurable Contract Parameters
INSSats vaults are flexible and allow customization at creation time:

| Parameter | Description | Default | Approx. Time |
|-----------|-------------|---------|--------------|
| `broker-fee` | Percentage charged by broker on deposits | 2.5% | - |
| `planned-timelock` | Delay for planned withdrawals (allows veto window) | 10080 blocks | ~7 days |
| `urgent-timelock` | Minimum delay for urgent withdrawals | 1440 blocks | ~1 day |
| `urgent-fee` | Fixed fee for urgent withdrawals | 5000 sats | - |
| `key-recovery-timelock` | Time to recover lost saver key | 43200 blocks | ~30 days |
| `params-change-timelock` | Delay to apply contract parameter changes | 20160 blocks | ~14 days |

**Why blocks instead of time?**
- Deterministic and verifiable on-chain
- Follows Bitcoin standards (CSV/CLTV)
- Cannot be manipulated like timestamps
- **Liquid Network:** 1 block = 1 minute (10x faster than Bitcoin)

**Why configurable?**
- Different users have different risk profiles
- Brokers can offer premium services with different fee structures
- Market competition ensures fair pricing
- Flexibility for institutional vs. individual users

**Important:** Parameter changes require approval from all parties and are subject to `params-change-timelock` to prevent unexpected modifications.

### 5. Simplicity Language
- **Type:** Functional, Bitcoin-native smart contract language
- **Key features:**
  - Static analysis (know cost before execution)
  - Formal verification (mathematical proofs)
  - Bounded execution (no infinite loops)
  - No mutable state

---

## 📚 Documentation Index

### 🎯 By Priority

**🔴 CRITICAL - Read before coding:**
1. [README.md](README.md) - This file (complete overview)
2. [CONCEPT.md](CONCEPT.md) - Why INSSats exists
3. [TECHNICAL-IMPLEMENTATION.md](TECHNICAL-IMPLEMENTATION.md) - Smart contract code

**🟡 IMPORTANT - Reference during development:**
4. [SIMPLICITYHL-GUIDE.md](SIMPLICITYHL-GUIDE.md) - Language reference
5. [TEST-SCENARIOS.md](TEST-SCENARIOS.md) - Security analysis

**🟢 OPTIONAL - Use as needed:**
6. [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md) - Documentation guide
7. [QUICK-CHECKLIST.md](QUICK-CHECKLIST.md) - Hackathon checklist
8. [STRATEGIC-DECISIONS.md](STRATEGIC-DECISIONS.md) - Decision-making guide
9. [SATSHACK-2025-PLAN.md](SATSHACK-2025-PLAN.md) - Hackathon plan
10. [FILES-OVERVIEW.md](FILES-OVERVIEW.md) - File structure

### 📖 By Use Case

**"I need to understand the concept"**
→ [CONCEPT.md](CONCEPT.md)

**"How do I code in Simplicity?"**
→ [SIMPLICITYHL-GUIDE.md](SIMPLICITYHL-GUIDE.md)

**"What should I do today during the hackathon?"**
→ [QUICK-CHECKLIST.md](QUICK-CHECKLIST.md)

**"How do I implement the smart contract?"**
→ [TECHNICAL-IMPLEMENTATION.md](TECHNICAL-IMPLEMENTATION.md)

**"What's the architecture?"**
→ [TECHNICAL-IMPLEMENTATION.md](TECHNICAL-IMPLEMENTATION.md) - See "System Architecture" section

**"How do I setup the environment?"**
→ [setup-satshack.sh](setup-satshack.sh)

---

## 💡 Why Use Simplicity?

### Advantages for Pension

✅ **Static Analysis:** Execution cost known beforehand
✅ **Formal Verification:** Mathematical proofs of correctness
✅ **Bounded Execution:** No infinite loops or hangs
✅ **Maximum Security:** Ideal for long-term fund storage
✅ **Liquid Network:** Deploy today, mainnet available

### Compared to Alternatives

| Feature | Simplicity | Solidity | Miniscript |
|---------|-----------|----------|------------|
| Static analysis | ✅ Complete | ❌ Limited | ✅ Good |
| Formal verification | ✅ Yes | ❌ No | ⚠️ Partial |
| Bounded execution | ✅ Guaranteed | ❌ No | ✅ Guaranteed |
| Bitcoin native | ✅ Yes | ❌ No | ✅ Yes |

---

## 📖 Learning Resources

### Simplicity
- [Simplicity Paper](https://blockstream.com/simplicity.pdf) - Original whitepaper
- [SimplicityHL Docs](https://github.com/BlockstreamResearch/SimplicityHL) - Language repository
- [Blockstream Blog](https://blog.blockstream.com/) - Latest updates

### Bitcoin Covenants & Vaults
- [Bitcoin Vaults Paper](https://arxiv.org/abs/2006.16714) - Academic research
- [Covenants Overview](https://fc17.ifca.ai/bitcoin/papers/bitcoin17-final28.pdf) - Technical deep dive

### Multisig
- [Bitcoin Multisig Wiki](https://en.bitcoin.it/wiki/Multisignature) - Basics
- Examples in `SimplicityHL/examples/multisig.simhl` - Code samples

---

## 📊 Business Model

### For Savers
Costs are divided into two parts:

1. **Deposit & Exchange (BRL → L-BTC)**
   - Negotiated with Broker
   - Estimated: 2-5% of deposited amount (one-time fee)

2. **Vault Custody & Maintenance**
   - Free market pricing, varies by Vault Keeper
   - Estimated: 0.5-1% per year (in Bitcoin)

3. **Optional: Monthly Advisory**
   - Varies by Broker's plans and services
   - Personalized financial guidance

**Total estimated cost:** 2-5% initial + 0.5-1%/year ongoing
**Benefit:** Bitcoin retirement, outside the failing system, with full control

### For Brokers
- **Revenue:** 2-5% on deposits (exchange fee) + optional monthly advisory subscription
- **Model:** Long-term relationship, recurring income from advisory

### For Vault Keepers
- **Revenue:** 0.5-1% per year on AUM (in Bitcoin) + fee per urgent transaction
- **Model:** Security infrastructure as a service

---

## 🛣️ Roadmap

### Phase 1: MVP Satshack (40h)
- ✅ Core smart contract
- ✅ Functional CLI
- ✅ Basic tests
- ✅ Documentation + video

### Phase 2: Testnet (1-2 months)
- Liquid testnet deploy
- Closed beta
- Pilot broker certification

### Phase 3: Mainnet Alpha (3-4 months)
- Liquid mainnet
- Capital limit (e.g., 1 BTC/user)
- 5-10 Brokers
- 1-2 Vault Keepers

### Phase 4: Scale (6-12 months)
- Remove limits
- Network expansion
- Advanced features
- Native mobile app

---

## 🤝 Team

**For Satshack 2025:**
- Rodrigo Vilar
- Tiago Goes
- [Member 3]...

**We're looking for:**
- Rust/Simplicity developers
- Certified brokers (Bitcoin/finance)
- Institutional custodians
- Vision-aligned investors

---

## 📞 Contact

- **GitHub:** github.com/[your-user]/inssat
- **Email:** [your-email]
- **Twitter:** [@your-twitter]

---

## 📄 License

MIT License - See [LICENSE](LICENSE)

---

## 🙏 Acknowledgments

- **Vinteum** - Satshack 2025 organization
- **Blockstream** - Simplicity creation
- **Bitcoin Brazil Community** - Inspiration and support

---

## 🎤 Elevator Pitch

> *"State pension systems are broken and devalue your money. INSSats is the Bitcoin private pension you control, with human advisory and smart contract security. Your funds stay in multisig, out of reach of governments and banks. It's the future of retirement, available today."*

---

## ✅ Next Steps

**Right now (30 min):**
- [ ] Read this README completely
- [ ] Run `bash setup-satshack.sh`
- [ ] Verify environment works

**Today (3 hours):**
- [ ] Read [CONCEPT.md](CONCEPT.md)
- [ ] Study [TECHNICAL-IMPLEMENTATION.md](TECHNICAL-IMPLEMENTATION.md)
- [ ] Review [SIMPLICITYHL-GUIDE.md](SIMPLICITYHL-GUIDE.md)
- [ ] Check examples in `SimplicityHL/examples/`

**Tomorrow:**
- [ ] Start coding smart contract
- [ ] Write tests as you go
- [ ] Ask for help when stuck
- [ ] Follow [QUICK-CHECKLIST.md](QUICK-CHECKLIST.md)

---

**🛡️ INSSats - Your Retirement, Your Rules, Your Bitcoin**

[![Satshack 2025](https://img.shields.io/badge/Satshack-2025-orange)](https://satshack3.devpost.com/)
[![Simplicity](https://img.shields.io/badge/Track-Simplicity-blue)](https://github.com/BlockstreamResearch/simplicity)
[![Bitcoin](https://img.shields.io/badge/Built%20on-Bitcoin-orange)](https://bitcoin.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

**Ready to build the future of retirement on Bitcoin? Let's go! 🚀**
