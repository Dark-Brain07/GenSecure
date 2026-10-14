# GenSecure

**Autonomous Covenant & Public Web Assurance Protocol on GenLayer**

GenSecure is a decentralized assurance protocol that allows organizations and protocol teams to stake economic value behind critical public statements, warranties, and privacy policies hosted on canonical HTTPS endpoints. If the published terms silently change, deviate, or violate the frozen covenant, GenLayer validators independently inspect the live web, evaluate semantic drift, and settle breach bounties without centralized oracles.

---

## The Problem & The Solution

Deterministic smart contracts on Ethereum, Solana, or L2 rollups cannot connect to external HTTPS sources or parse natural-language legal terms. As a result, users, developers, and DAO contributors must blindly trust that published terms will never be quietly changed.

GenSecure leverages the native AI and Internet-connectivity capabilities of the GenVM to create a decentralized trust anchor:

1. **Stake a Public Promise**: An organization stakes test GEN behind an exact promise and one immutable canonical HTTPS URL.
2. **Autonomous Baseline Certification**: Before the covenant activates, GenLayer validators independently crawl the canonical URL and evaluate seven deterministic semantic flags to confirm the promise is genuinely supported and compliant.
3. **Drift Detection**: Any community participant can challenge an active covenant. The challenger does not supply evidence; GenSecure instructs validators to re-crawl that exact frozen URL.
4. **Decoupled Breach Adjudication**: A material change triggers independent breach adjudication against the immutable breach rules.
5. **Decentralized Settlement**: Confirmed breaches transfer finder rewards to the challenger and distribute the remaining stake to the designated beneficiary.

---

## Protocol Architecture

```text
       COMMUNITY CHALLENGER / COVENANT OWNER
                         │
                         ▼
             NEXT.JS 15 FRONTEND (EIP-1193)
                         │
                         ▼
             GENLAYER STUDIONET (CHAIN 61999)
                         │
    ┌────────────────────┼────────────────────┐
    ▼                    ▼                    ▼
GenSecureRegistry   GenSecureInspector   GenSecureJudge
 (State & Escrow)   (Live Web Crawler)  (Breach Adjudication)
```

### Component Responsibilities

1. **`GenSecureRegistry` (`contracts/gensecure_registry.py`)**
   - Holds all covenant configurations, escrow balances, and challenge queues.
   - Enforces strict mathematical conservation invariants: `Deposited = Escrow + Bonds + Claimable + Withdrawn`.
   - Manages pull-based reward balances, dispute timeouts, and lifecycle transitions.
   - Operates with zero administrative keys once initial components are bound.

2. **`GenSecureInspector` (`contracts/gensecure_inspector.py`)**
   - Evaluates the live web page at covenant creation (`BASELINE_VERIFIED`).
   - When challenged, re-crawls the exact same frozen HTTPS URL using GenVM web rendering (`gl.nondet.web.render`).
   - Determines whether current terms represent a `MATERIAL_CHANGE` or `NO_RELEVANT_CHANGE`.

3. **`GenSecureJudge` (`contracts/gensecure_judge.py`)**
   - Independent second-stage evaluator invoked only after a verified `MATERIAL_CHANGE`.
   - Re-fetches the live source independently to verify whether the shift violates the immutable breach rule or is permitted under routine exceptions.

---

## GenLayer Network Specifications

| Parameter | Configuration |
|---|---|
| **Network** | GenLayer StudioNet |
| **Chain ID** | `61999` |
| **RPC Endpoint** | `https://studio.genlayer.com/api` |
| **Block Explorer** | `https://explorer-studio.genlayer.com` |
| **Direct Mode GenVM Pin** | `v0.2.12` |
| **Pinned Runner Version** | `# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }` |

---

## Deployed Contract Addresses & StudioNet Verification

**Target Network:** GenLayer StudioNet (Chain ID: `61999`)  
**Deployer Address:** [`0x8EE4fd47FC30d17f33615FAeF8a69465bfa9B017`](https://explorer-studio.genlayer.com/address/0x8EE4fd47FC30d17f33615FAeF8a69465bfa9B017)  
**Manifest File:** [`deployments/studionet.json`](deployments/studionet.json)  
**Workflow Evidence:** [`deployments/workflow_evidence.json`](deployments/workflow_evidence.json)

| Intelligent Contract | Contract Address | Finalized Transaction Hash |
|---|---|---|
| **GenSecureRegistry** | [`0xFc8434166AEfA510D60363DA42ac20A874554758`](https://explorer-studio.genlayer.com/address/0xFc8434166AEfA510D60363DA42ac20A874554758) | [`0xb341832115d3b21b838e86377fecd59362f220e69709a7cf3d3d5ac7a418e1b4`](https://explorer-studio.genlayer.com/tx/0xb341832115d3b21b838e86377fecd59362f220e69709a7cf3d3d5ac7a418e1b4) |
| **GenSecureInspector** | [`0x5cC39618D17994B89d244d324a29C34EBecD8E80`](https://explorer-studio.genlayer.com/address/0x5cC39618D17994B89d244d324a29C34EBecD8E80) | [`0xa1ec50c7dbb2cc5d3437c48897e6c9f170a745098ab45538989397eaa848f6af`](https://explorer-studio.genlayer.com/tx/0xa1ec50c7dbb2cc5d3437c48897e6c9f170a745098ab45538989397eaa848f6af) |
| **GenSecureJudge** | [`0x83fC9A2B05e30a2E956727F826A925e6eAbedc55`](https://explorer-studio.genlayer.com/address/0x83fC9A2B05e30a2E956727F826A925e6eAbedc55) | [`0x18919e14c71b7a106f7b90658325a07c53ad25d866c1a6fc53bdb838af3cc524`](https://explorer-studio.genlayer.com/tx/0x18919e14c71b7a106f7b90658325a07c53ad25d866c1a6fc53bdb838af3cc524) |
| **Component Binding** | Bound on `GenSecureRegistry` | [`0xdbcc00872dc2a9b3b528ab22f9e404cd34f4a1d11f518d95a2d51d32a808c5d4`](https://explorer-studio.genlayer.com/tx/0xdbcc00872dc2a9b3b528ab22f9e404cd34f4a1d11f518d95a2d51d32a808c5d4) |
| **Live Covenant Staking** | `gsc-1` Created & Staked on StudioNet | [`0xc3fa9a585b64f45b21a8e160016472ec5152229ff4b475aab40c4493d1086dfc`](https://explorer-studio.genlayer.com/tx/0xc3fa9a585b64f45b21a8e160016472ec5152229ff4b475aab40c4493d1086dfc) |

---

## Verification & Testing

### 1. Direct Mode & Static Audit Test Suite
GenSecure features an automated 20-test test suite using `genlayer-test` direct mode:
```bash
python -m pytest tests/ -v
```
All 20 tests pass:
- **Registry Lifecycle:** Deployment, component binding, covenant creation, baseline certification, baseline refund on rejection, bond compensation, breach settlement, persistent source withdrawal forfeiture, late challenges past old 65m window, authorization checks.
- **Inspector Consensus:** Live stats, smart keyword-directed evidence extraction (>30,000 chars), material change detection, graceful source unavailability handling.
- **Judge Consensus:** Adjudication stats, confirmed breach verdict with quotes & SHA-256 fingerprinting, permitted change non-breach verdict.
- **AST & Closure Audit:** 100% adherence to Storage Pre-Extraction Rule, zero forbidden standard-library imports, pinned runner header `# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }`.

### 2. Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to interact with the GenSecure web dApp.

---

## Core Protocol Guarantees

- **Fail Closed**: Network outages, server timeouts, or semantic ambiguity refund the challenger rather than manufacturing a false breach.
- **Strict Conservation**: Pull-based escrow accounting ensures all deposited funds remain mathematically conserved across escrow, bonds, and withdrawals.
- **Zero Central Discretion**: Every outcome is adjudicated strictly by validator consensus using comparative equivalence principles.
