# 🛡️ INSSats - Decentralized Pension on Bitcoin

> **Your retirement, your rules, your Bitcoin.**

## 🎯 What is INSSats?

INSSats is a decentralized private pension platform built on Bitcoin, offering an alternative to state pension systems (like Brazil's INSS). Using Simplicity smart contracts, multisig custody, and human consultancy, we create a retirement system that is:

- ✅ **Secure:** Flexible multisig with intelligent timelock
- ✅ **Transparent:** Auditable public blockchain
- ✅ **Sovereign:** You control your funds, not the government
- ✅ **Sustainable:** Bitcoin as store of value (vs. inflationary fiat)
- ✅ **Supported:** Human broker for personalized advisory

---

## 🔥 State Pension Problems We Solve

| State Pension Problem | INSSats Solution |
|----------------------|------------------|
| 🏛️ Deficit-ridden state centralization | Decentralized Bitcoin |
| 📉 Monetary devaluation | L-BTC as reserve |
| 🚫 No exit option | Voluntary and flexible |
| 💸 Risk of fund misappropriation | Immutable smart contracts |
| ⚖️ Arbitrary rule changes | Permanently coded rules |
| 👻 Lack of advisory | Dedicated broker |

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
- 7-day timelock activated
- **Any party can veto** during period
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

## 📂 Complete Documentation

### 🚀 Start Here

**→ [GETTING-STARTED.md](GETTING-STARTED.md)** - Complete step-by-step guide for newcomers

### 📖 Essential Documents

1. **[INDEX.md](INDEX.md)** - Complete project index
2. **[CONCEPT.md](CONCEPT.md)** - Value proposition and detailed concept
3. **[TECHNICAL-IMPLEMENTATION.md](TECHNICAL-IMPLEMENTATION.md)** - Smart contract technical details
4. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Architecture and flow diagrams
5. **[PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md)** - Documentation structure guide

### 🛠️ Development Resources

6. **[SIMPLICITYHL-GUIDE.md](SIMPLICITYHL-GUIDE.md)** - SimplicityHL language reference
7. **[TEST-SCENARIOS.md](TEST-SCENARIOS.md)** - Complete test scenarios & security analysis
8. **[QUICK-CHECKLIST.md](QUICK-CHECKLIST.md)** - Hackathon task checklist
9. **[STRATEGIC-DECISIONS.md](STRATEGIC-DECISIONS.md)** - Decision-making guide
10. **[SATSHACK-2025-PLAN.md](SATSHACK-2025-PLAN.md)** - Complete hackathon plan
11. **[FILES-OVERVIEW.md](FILES-OVERVIEW.md)** - File structure guide
12. **[setup-satshack.sh](setup-satshack.sh)** - Environment setup script

---

## 🚀 Quick Start

### 1. Understand the Project (30 min)
```bash
# Read in this order:
1. This README.md
2. CONCEPT.md
3. TECHNICAL-IMPLEMENTATION.md
```

### 2. Setup Environment (30 min)
```bash
bash setup-satshack.sh
```

### 3. Study Simplicity (2h)
```bash
# Read:
- SIMPLICITYHL-GUIDE.md
- Official Simplicity documentation and examples
```

### 4. Start Implementing
```bash
# Follow the guide in TECHNICAL-IMPLEMENTATION.md
```

---

## 🎯 MVP for Satshack 2025

### Scope (40 hours)

**✅ Implement:**
1. Simplicity smart contract:
   - Multisig
   - 7-day timelock
   - 3/3 consensus for emergencies
   - Veto function

2. CLI interface:
   - Create vault
   - Deposit funds
   - Schedule withdrawal (timelock)
   - Urgent withdrawal (3 sigs)
   - Veto operation

3. Tests:
   - 5-6 unit tests covering main flows

4. Documentation:
   - Technical README
   - How to run
   - Pitch video (3 min)

**⚠️ Partial/Mock implementation:**
- Mobile/web app: Fork of Liquid-compatible wallet with UX mockups for Saver persona
- Basic UI showing how the user experience would work (may use mocked data)

**❌ Not implementing now:**
- Real Liquid mainnet integration
- Reputation system
- Full production-ready app

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

> *"State pension systems are broken and devalue your money. INSSat is the Bitcoin private pension you control, with human advisory and smart contract security. Your funds stay in multisig, out of reach of governments and banks. It's the future of retirement, available today."*

---

**🛡️ INSSat - Your Retirement, Your Rules, Your Bitcoin**

[![Satshack 2025](https://img.shields.io/badge/Satshack-2025-orange)](https://satshack3.devpost.com/)
[![Simplicity](https://img.shields.io/badge/Track-Simplicity-blue)](https://github.com/BlockstreamResearch/simplicity)
[![Bitcoin](https://img.shields.io/badge/Built%20on-Bitcoin-orange)](https://bitcoin.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

**Ready to start?**

→ **New to INSSat?** Start with [GETTING-STARTED.md](GETTING-STARTED.md)
→ **Understand the concept?** Read [CONCEPT.md](CONCEPT.md)
→ **Ready to code?** Dive into [TECHNICAL-IMPLEMENTATION.md](TECHNICAL-IMPLEMENTATION.md)

🚀 **Let's build the future of retirement on Bitcoin!**
