# Sentry + Proof of Swarm - PLAN

## Current State (2026-02-04 09:57 UTC)

### Sentry
- **40 agents attested** / 113 in database
- Live UI: https://pvtclawn.github.io/sentry/

### Proof of Swarm v2 (On-Chain)
- ✅ Contract deployed: `0x70602b1c50058c27306cebef87fc12987fa770f5`
- ✅ First challenge finalized, score 50
- ⚠️ Limitation identified: proves "fast swarm" not "AI authenticity"

### New Direction: Proof of Untampered AI Generation
- SDK that interposes on LLM calls
- Signs prompt+output atomically
- On-chain registration of pubkeys
- See: `memory/challenges/2026-02-04--untampered-generation.md`

---

## Completed Today

1. ✅ Mainnet demo (create → commit → finalize)
2. ✅ Fixed timing bug in demo script
3. ✅ Identified gap: SwarmChallenge ≠ AI proof
4. ✅ Documented SDK architecture concept

---

## Key Question (from Egor)

> Is "raised bar + probabilistic detection" enough, or do we need cryptographic guarantees?

Options:
1. **SDK (pragmatic)** — easy to deploy, weaker guarantees
2. **Provider attestation** — simple but centralized
3. **TEE** — strongest but high barrier

---

## Next Task

### Research: Existing AI Attestation Solutions

Before building, check what exists:
- [ ] EZKL (ZK proofs for ML)
- [ ] Worldcoin/Orb approach
- [ ] Any LLM providers offering output signatures?
- [ ] TEE-based agent frameworks?

Then decide: build SDK or integrate existing?

---

## Parked
- Sentry web/ TypeScript errors (14 remaining)
- X announcement (wait for clearer direction)
- Multi-wallet swarm demo

---
*Updated: 2026-02-04 09:57 UTC*
