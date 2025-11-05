# INSSats - Concept and Value Proposition

## Overview

**INSSats** is a decentralized private pension platform built on Bitcoin, offering an alternative to the state pension system (INSS). The project combines smart contracts in Simplicity, multisig custody, and human consulting to create a secure, transparent, and sovereign retirement system.

---

## Problems with State INSS

### 1. Centralization and Government Deficit
- **Problem:** System controlled by a deficit-ridden government that prints money
- **Impact:** Your pension assets constantly depreciate in value
- **INSSats Solution:** Funds in Bitcoin (L-BTC), beyond state reach

### 2. Demographic Crisis
- **Problem:** Inverted age pyramid - fewer contributors, more retirees
- **Impact:** System is unsustainable in the long term
- **INSSats Solution:** Individual capitalization, not a pay-as-you-go system

### 3. Lack of Exit Option
- **Problem:** Mandatory contribution through taxes, no alternative
- **Impact:** You are forced to participate in a failing system
- **INSSats Solution:** Voluntary membership, exit whenever you want

### 4. Risk of Fund Misappropriation
- **Problem:** Resources can be diverted for other political purposes
- **Impact:** Pension fund became government's "cash box"
- **INSSats Solution:** Immutable smart contracts, impossible to divert

### 5. Unethical Use of Resources
- **Problem:** Your money finances projects contrary to your values
- **Impact:** You finance causes you reject
- **INSSats Solution:** You control 100% of your resources

### 6. Changing Rules "Mid-Game"
- **Problem:** Retirement age changes constantly
- **Impact:** Moving target - you never know when you'll retire
- **INSSats Solution:** Rules coded in smart contract, immutable

### 7. Lack of Personalized Consulting
- **Problem:** No one helps you understand how much to contribute and when to retire
- **Impact:** Poor financial decisions, inadequate retirement
- **INSSats Solution:** Dedicated broker offers human consulting

---

## The INSSats Solution

### Three-Persona Architecture

#### 1. **SAVER**
**Who is:** The worker building their retirement

**Tools:**
- **Mobile App** for complete management
- **Automated Dashboard** with balance, projections, and history
- **Retirement Simulator** calculating targets and forecasts (e.g., calc.bitcoineracademy.com)
- **Investment Comparisons** with traditional options
- **Impact Analysis** of contributions and withdrawals
- **Broker-Supported** contribution scheduling
- Withdrawal request (planned or urgent)

**Automated vs. Human Advisory:**
- Most features provided automatically through the app
- Retirement forecasts, comparisons, impact analysis = automated
- **Broker involvement optional** for:
  - Personalized consulting
  - Fiat ↔ L-BTC exchange (P2P)
  - Custom advice not yet in app
  - Emotional support and encouragement

**Benefits:**
- Full control over your resources
- Complete transparency (public blockchain)
- Human consulting included
- No inflation eroding your wealth

---

#### 2. **BROKER (Consultant)**
**Who is:** Certified professional offering in-person support to the saver

**Functions:**
- **Consulting:** Helps the saver plan for retirement
- **P2P Exchange:** Receives BRL and sends L-BTC to the saver
- **Onboarding:** Teaches the saver how to use the platform
- **Support:** Answers questions and resolves problems
- **KYC/Compliance:** Validates identity for urgent operations

**Business Model:**
- **Fee on contributions:** 2-5% of each deposit to the vault (default: 2.5%)
- **Hourly consulting fee:** For personalized advisory sessions
- **Long-term relationship:** Unlike salespeople who disappear, Brokers care for retirement throughout client's lifetime
- **Value-add services:** Ongoing support, encouragement, strategic decisions
- Public reputation system

**Benefits:**
- New business model based on Bitcoin
- **Recurring revenue** from deposits + consulting hours
- **Relationship-based income:** The better the service, the more clients contribute
- Long-term client relationships (decades, not transactions)

---

#### 3. **VAULT KEEPER (Custodian)**
**Who is:** Technical entity responsible for actual fund custody

**Internal Structure:**
- **Not a single person:** Vault Keeper is itself a multisig organization
- **M-of-N internal multisig:** E.g., 3-of-5 or 5-of-7 among multiple key holders
- **Geographically distributed:** Keys held in different locations for resilience
- **When "Vault Keeper signs":** Means M internal members have approved

**Functions:**
- **Multisig Custody:** Collectively maintains one "seat" in the 2-of-3 INSSats multisig
- **Security Validation:** Internal M-of-N approval for urgent transactions
- **Audit:** Publishes proof of reserves regularly
- **Alarm System:** Detects and blocks suspicious activities
- **Backup:** Ensures recovery in case of key loss

**Requirements:**
- Robust security infrastructure (HSM, cold storage, geographic distribution)
- Specialized technical team (N members with M threshold)
- Insurance against losses
- Regular external audit

**Business Model:**
- **Custody fee:** 0.5-1% per year on AUM (Assets Under Management)
- **Fee per urgent transaction:** Fixed fee for immediate operations (e.g., 5000 sats)
- **Revenue model:** Based on secure storage time, not transaction volume
- **Incentive alignment:** The longer and more secure the custody, the higher the revenue

---

## Multisig Security Scheme

### Flexible N-of-M Multisig with Smart Logic

```
┌─────────────────────────────────────────────────────────┐
│           SIMPLICITY SMART CONTRACT                     │
│          (Flexible Multisig N-of-M)                     │
└─────────────────────────────────────────────────────────┘
           │
           ├─── Key 1: Saver (individual)
           │
           ├─── Key 2: Broker (individual or small multisig)
           │
           └─── Key 3: Vault Keeper
                       │
                       └─── Internal M-of-N Multisig
                            ├─── Keeper A (São Paulo)
                            ├─── Keeper B (New York)
                            ├─── Keeper C (Singapore)
                            ├─── Keeper D (London)
                            └─── Keeper E (Dubai)

                            3-of-5 required for "Vault Keeper" signature
```

**Key Insight:**
- External view: 2-of-3 (Saver, Broker, Vault Keeper)
- Internal reality: Vault Keeper = M-of-N distributed multisig
- **Example:** To move funds, need Saver + Broker OR Saver + (3 of 5 Vault Keeper members) OR Broker + (3 of 5 Vault Keeper members)

### Movement Rules

#### Planned Operation (Timelock)
**Scenario:** Monthly contribution, scheduled withdrawal for retirement

**Process:**
1. Saver schedules operation in app
2. Smart contract activates timelock (default: 10080 blocks ≈ 7 days on Liquid)
3. **Any party** can veto during the period
4. If no veto → transaction executes automatically
5. Requires only **1 signature** (from Saver)

**Advantage:**
- Convenient operations for everyday use
- Security via "emergency brake"
- Saver maintains autonomy

---

#### Urgent Operation (Full Consensus)
**Scenario:** Emergency withdrawal, unplanned movement

**Process:**
1. Saver requests urgent operation in app
2. **Broker validates** (confirms identity, verifies no coercion)
3. **Vault Keeper validates** (checks security, suspicious patterns)
4. If all approve → transaction executes immediately
5. Requires **3 signatures** (Saver + Broker + Vault Keeper)

**Advantage:**
- Protection against theft, coercion, or compromise
- Each party adds a validation layer
- Still possible to make quick operations when legitimate

---

#### Emergency Veto
**Scenario:** Any party detects suspicious activity

**Process:**
1. Any party (Saver, Broker, or Vault Keeper) detects anomaly
2. Issues veto through smart contract
3. Operation is **immediately frozen**
4. Resolution requires 3-of-3 consensus via governance process
5. If no consensus, resources remain locked (security > convenience)

**Examples of Scenarios:**
- Saver vetoes: suspects Broker or Vault Keeper was compromised
- Broker vetoes: suspects Saver's account was hacked
- Vault Keeper vetoes: detects unusual transaction pattern

**Advantage:**
- Any party can "pull the emergency brake"
- Protection against insider attacks
- Incentive for all to maintain security

---

## 🔐 Key Security Requirements

### Asymmetric Security Model

INSSats implements different security levels for each participant based on their risk profile:

#### Saver: Consumer-Grade Security (Hot Wallet)
**Key Type:** Mobile/desktop app (hot wallet)

**Security:**
- Standard mobile wallet (biometric, PIN)
- Optional: Hardware wallet
- Internet-connected for convenience

**Why this is safe:**
- Can't move funds alone (needs 2nd signature)
- Timelock gives ~7 days (10080 blocks on Liquid) to detect compromise
- Any party can veto suspicious activity
- Trade-off: Convenience vs. Security ✅

---

#### Broker: High Security (Air-Gapped Cold Wallet)
**Key Type:** Air-gapped cold storage (REQUIRED)

**Security:**
- **MANDATORY:** Private key never touches internet
- Air-gapped hardware wallet (Jade, Krux, Coldcard, Passport, offline laptop)
- Transaction flow:
  ```
  Online device (watch-only) → QR/USB → Air-gapped device → Sign → QR/USB → Broadcast
  ```

**Why this is required:**
- Brokers manage multiple clients (high-value target)
- Semi-trusted third party
- Compromised broker + social engineering = risk
- Air-gap eliminates remote attack vectors

**Implementation:**
```
1. Generate key on offline device (never connected to internet)
2. Store device in physical safe
3. Use watch-only wallet on online computer
4. To sign: Transfer unsigned tx via QR, sign offline, return via QR
```

---

#### Vault Keeper: Maximum Security (M-of-N Air-Gapped, Geographically Distributed)
**Key Type:** M-of-N multisig of air-gapped wallets, globally distributed (REQUIRED)

**Structure:**
```
Vault Keeper = 3-of-5 internal multisig

Key Holder 1 (São Paulo, Brazil)   → Air-gapped cold wallet in vault
Key Holder 2 (New York, USA)       → Air-gapped cold wallet in vault
Key Holder 3 (Singapore)           → Air-gapped cold wallet in vault
Key Holder 4 (London, UK)          → Air-gapped cold wallet in vault
Key Holder 5 (Dubai, UAE)          → Air-gapped cold wallet in vault

3 signatures required for "Vault Keeper" to approve
```

**Requirements:**
- **MANDATORY:** All keys air-gapped
- **MANDATORY:** Geographic distribution (minimum 3 cities)
- Physical security (safes, vaults, HSMs)
- Multi-signature coordinator (online server with watch-only keys)

**Why this level of security:**
- Custodian for many clients (highest-value target)
- Geographic distribution prevents:
  - Single-jurisdiction government seizure
  - Natural disaster risk
  - Physical attack (need to attack 3+ cities simultaneously)
- Air-gap prevents remote attacks
- M-of-N provides redundancy

**Attack Resistance:**
| Attack Type | Result |
|-------------|--------|
| Remote hacker | ❌ Impossible (all keys offline) |
| Single location attack | ❌ Useless (need 3-of-5) |
| Government seizure (1 country) | ❌ Insufficient (globally distributed) |
| Multi-continent coordinated attack | ⚠️ Extremely difficult + expensive |

---

### Security Comparison

| Role | Key Storage | Internet | Compromise Risk | Why Safe |
|------|-------------|----------|-----------------|----------|
| **Saver** | Hot (mobile) | Yes | Medium | Timelock + veto protects funds |
| **Broker** | Cold (air-gapped) | No | Low | Remote attack impossible |
| **Vault Keeper** | Cold (M-of-N distributed air-gapped) | No | Very Low | Need multi-continent attack |

**Key Insight:** Higher custody responsibility = higher security requirements

---

### Implementation Timeline

**MVP (Satshack 2025):**
- All keys can be hot wallets (testing only)

**Testnet (1-2 months):**
- Broker: Air-gapped hardware wallet (Coldcard, etc.)
- Vault Keeper: 3-of-5 hardware wallets (simulated distribution)

**Mainnet (Production):**
- Broker: **MANDATORY** air-gapped cold storage
- Vault Keeper: **MANDATORY** M-of-N geographically distributed air-gapped setup
- Security audit before launch

---

## Competitive Advantages

### vs. State INSS
| Criteria | INSS | INSSats |
|----------|------|--------|
| **Control** | Government | You |
| **Reserve** | Reais (inflation) | Bitcoin (deflation) |
| **Rules** | Always changing | Immutable |
| **Transparency** | None | Total (blockchain) |
| **Exit option** | No | Yes |
| **Consulting** | No | Yes (Broker) |
| **Confiscation risk** | High | Very low |

### vs. Traditional Private Pension
| Criteria | Traditional Funds | INSSats |
|----------|---------------------|--------|
| **Custody** | Bank (can fail) | Multisig (trustless) |
| **Assets** | Bonds/stocks | Bitcoin |
| **Fees** | 2-4% per year | ~1.5% per year |
| **Transparency** | Quarterly reports | Real-time (blockchain) |
| **Liquidity** | Low (waiting periods) | High (urgent withdrawal possible) |
| **Regulatory risk** | High (can be confiscated) | Low (non-custodial) |

---

## Use Cases

### 1. Young Professional (28 years old)
**Profile:** Developer, monthly income, wants to retire at 55

**How they use INSSats:**
- Contributes 10% of monthly salary via Broker
- Uses simulator to calculate target
- Monitors growth on dashboard
- In 27 years, has enough assets to retire

**Benefit:** Built retirement in Bitcoin, outside the state system

---

### 2. Freelancer (45 years old)
**Profile:** Entrepreneur, irregular income, no formal INSS

**How they use INSSats:**
- Contributes variable amounts based on billing
- Broker adjusts strategy based on goals
- Can make urgent withdrawals in emergencies (with consensus)
- At 65, has guaranteed passive income

**Benefit:** Total flexibility, no state bureaucracy

---

### 3. Retiree (70 years old)
**Profile:** Already retired, wants to preserve assets

**How they use INSSats:**
- Migrated part of traditional retirement to INSSats
- Makes monthly scheduled withdrawals (via timelock)
- Broker helps manage cash flow
- Assets protected from inflation

**Benefit:** Hedge against Real depreciation

---

## Technology Stack

### Layer 1: Blockchain
- **Liquid Network:** Bitcoin sidechain, supports Simplicity
- **L-BTC:** "Wrapped" Bitcoin with greater privacy

### Layer 2: Smart Contracts
- **Simplicity:** Formal language with mathematical verification
- **SimplicityHL:** High-level language for rapid development
- **Contracts:**
  - Flexible N-of-M Multisig
  - Configurable timelock (block-based)
  - Veto logic
  - Configurable parameters (fees, timelocks)

### Layer 3: Backend
- **Rust:** API for contract interaction
- **PostgreSQL:** Off-chain data (profiles, history)
- **WebSockets:** Real-time notifications

### Layer 4: Frontend
- **React/Flutter:** Mobile and web apps
- **Design System:** Simple UX for non-technical users

---

## MVP for Satshack 2025

For detailed MVP scope and implementation plan, see the **MVP Scope** section in [README.md](README.md).

**Core focus:** Simplicity smart contract with flexible N-of-M multisig, configurable timelocks, and CLI interface for vault operations.

---

## Legal and Regulatory Considerations

### Positioning
INSSats **is not**:
- Regulated investment fund
- Financial institution
- Payment service provider

INSSats **is**:
- Open-source software
- Decentralized protocol
- Self-custody tool

### Regulatory Strategy
1. **Maximum decentralization:** No single entity controls the protocol
2. **Open-source:** Code auditable by anyone
3. **Non-custodial:** User always maintains control (via multisig)
4. **Education:** Brokers are consultants, not fund managers
5. **Optional compliance:** Brokers can implement KYC if necessary

### Risks and Mitigations
- **Risk:** Future regulation of cryptocurrencies in Brazil
- **Mitigation:** Architecture allows international operation
- **Risk:** Taxation of Bitcoin gains
- **Mitigation:** Automated tax reporting tool

---

## Next Steps

### For Developers
1. Read this complete document
2. Review `ARCHITECTURE.md` for technical architecture
3. Study Simplicity examples (multisig + timelock)
4. Plan MVP for Satshack

### For the Team
1. Decide exact MVP scope
2. Divide tasks (smart contracts / backend / frontend / video)
3. Define 40-hour schedule
4. Let's go!

---

**INSSats - Your Retirement, Your Rules, Your Bitcoin**
