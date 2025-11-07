## INSSats Core Stack

This README helps understand the structure of the `INSSats` project directory and how each part supports the hackathon prototype.

### Goals and status
- Build a demonstrable Bitcoin vault with programmable timelocks, veto rules and persona-specific tooling.
- Provide runnable examples (CLI, API, UI) even when the full contract integration is not finished.

### Directory tour
- `contracts/`
  - Simplicity source files and witnesses: `vault.simf`, `vault.wit`, `p2ms.simf`, `htlc.simf`.
  - `vault.simf` showcases the intended flexible multisig design (2-of-3 surface with internal M-of-N), while `p2ms.simf` is the contract actually executed by the server scripts today.
  - `vault-ide.simf` acts as a scratchpad for iterating on new vault logic.
- `scripts/`
  - Shell utilities (`1-create-contract.sh` → `7-broadcast-transaction.sh`) that walk through the full workflow: create vault, fund, prepare PSET, gather signatures from Saver/Broker/Vault Keeper and broadcast.
  - Additional helpers like `hash-time-lock.sh` illustrate emergency and veto paths.
- `infra/`
  - Docker Compose stack with `bitcoind` plus two Elements nodes, so the Liquid environment spins up locally without manual setup.
  - Includes convenience aliases that map each persona to a node/CLI profile.
- `server/`
  - Node.js/TypeScript API that orchestrates vault operations, exposes REST endpoints and contains documentation (`ARCHITECTURE.md`, `SUMMARY.md`).
  - Test scripts (`test-*.sh`) automate the different flows: planned withdrawal, urgent withdrawal, veto and workspace isolation.
  - Currently interacts with the `p2ms` contract; switching to `vault.simf` will require additional integration work.
- `ui/`
  - Vite/React front-end that mirrors the Saver journey: onboarding, vault overview, planned/urgent operations and veto controls.
- `docs/`
  - Reference materials (concept, PRD, technical notes) used during the hackathon to align product and engineering decisions.
- `infra/bitcoindir`, `infra/elementsdir*`
  - Predefined configuration files to bootstrap the regtest networks quickly.
- `scripts/*.sh`
  - Utility scripts for faucets, extracting transactions and testing HTLC flows.

### Quick start
1. **Run the backend**
   ```bash
   cd INSSats/server
   npm install
   npm run dev
   ```
2. **Run the web UI**
   ```bash
   cd ../ui
   npm install
   npm run dev
   ```

Looking to reproduce the full Elements workflow? Spin up the Liquid stack (`infra/`) and use the shell scripts (`scripts/`) in numerical order; they still rely on the `p2ms` contract for now.

### Current limitations & talking points
- The Simplicity vault contract is available in `contracts/vault.simf`, but we did not have time to replace the `p2ms` flow before the demo. It remains as a reference implementation and future upgrade path.
- CLI and server endpoints are fully functional; the only mocked pieces are wallet balance snapshots used by the clients.
