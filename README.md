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
**Deployer Address:** [`0x7b0E62ED36C4F24060772Aa57d4f1d7F10B68624`](https://explorer-studio.genlayer.com/address/0x7b0E62ED36C4F24060772Aa57d4f1d7F10B68624)  
**Manifest File:** [`deployments/studionet.json`](deployments/studionet.json)

| Intelligent Contract | Contract Address | Finalized Transaction Hash |
|---|---|---|
| **GenSecureRegistry** | [`0x9be17766e035636393B5e1cb39051be749880f57`](https://explorer-studio.genlayer.com/address/0x9be17766e035636393B5e1cb39051be749880f57) | [`0x5ddc5c30180c43dbd6a03c01bd8e4b3e52a2b7643186805e5d4be914aeba4272`](https://explorer-studio.genlayer.com/tx/0x5ddc5c30180c43dbd6a03c01bd8e4b3e52a2b7643186805e5d4be914aeba4272) |
| **GenSecureInspector** | [`0x6bd66F93708CCD2ee38a7E14d50A946aEF3E8467`](https://explorer-studio.genlayer.com/address/0x6bd66F93708CCD2ee38a7E14d50A946aEF3E8467) | [`0xa0253b9f9a6f7d88bd04187f3564963e8891fca5902f1db33d01af91abd33087`](https://explorer-studio.genlayer.com/tx/0xa0253b9f9a6f7d88bd04187f3564963e8891fca5902f1db33d01af91abd33087) |
| **GenSecureJudge** | [`0xc60cf424B5D6C59C1ACF939a122304d8c6D69959`](https://explorer-studio.genlayer.com/address/0xc60cf424B5D6C59C1ACF939a122304d8c6D69959) | [`0xf11199c2377b8b122322dc138cf7c45875a809e09033e652384df4d3bfa66ba0`](https://explorer-studio.genlayer.com/tx/0xf11199c2377b8b122322dc138cf7c45875a809e09033e652384df4d3bfa66ba0) |
| **Component Binding** | Bound on `GenSecureRegistry` | [`0x77726fbde54d4d04c0a0bf91866baf53ac1c341afa1c716f00a73594ec6b44eb`](https://explorer-studio.genlayer.com/tx/0x77726fbde54d4d04c0a0bf91866baf53ac1c341afa1c716f00a73594ec6b44eb) |

---

## Verification & Testing

### 1. Contract Static & Audit Tests
Run the comprehensive AST, dependency, and closure audit suite:
```bash
python -m pytest tests/test_gensecure_contracts.py -v
```
All tests verify:
- Zero syntax or compilation errors.
- Strict AST import validation (no forbidden imports like `os`, `sys`, `random`, or `subprocess`).
- Pinned runner dependency header on line 1.
- Storage Pre-Extraction Rule adherence across non-deterministic validator closures.

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
