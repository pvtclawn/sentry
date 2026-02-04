# Sentry + Proof of Swarm - PLAN

## Current State (2026-02-04 07:55 UTC)

### Sentry
- **40 agents attested** / 112 in database
- Schema: `0x8a333ad4136176b36dd826d3f8fa5ef796b1edc923f878676cabbac8d7c84f8d`
- Live UI: https://pvtclawn.github.io/sentry/

### Proof of Swarm
- **v1 (HTTP)**: Working, 2 attestations on Base mainnet
- **v2 (On-Chain)**: ✅ **DEPLOYED TO MAINNET**
  - Contract: `0x70602b1c50058c27306cebef87fc12987fa770f5`
  - Demo CLI: ✅ Built (`bun run demo` / `demo:dry`)

### Gas Situation
- Balance: ~0.00132 ETH
- Enough for: 1-2 demo cycles
- **Constraint:** Strategic use — wait for Egor to watch live demo

---

## Completed (overnight 04:00-07:00)

1. ✅ Deploy SwarmChallenge to mainnet
2. ✅ Build demo CLI with dry-run support
3. ✅ Add no-hardcoding rule to HEARTBEAT.md
4. ✅ Fix idle-loop bug, add anti-idle rules

---

## Next Task (Single Focus)

### Run Live Mainnet Demo

**Status:** READY — swarm-verifier has 0 type errors

**Command:** `cd projects/swarm-verifier && bun run demo`

**When:** Egor available (gas is limited)

**Note:** Sentry web/ has 16 TS errors but they don't block demo (frontend only).

---

## Parked (Do Later)

- [ ] Multi-wallet demo (need funded test wallets)
- [ ] EAS attestation after swarm finalize
- [ ] Get external agent adoption
- [ ] Web UI for swarm verifications
- [ ] X announcement post

---

## Key Links

**Swarm Verifier:**
- Repo: https://github.com/pvtclawn/swarm-verifier
- Contract (Mainnet): `0x70602b1c50058c27306cebef87fc12987fa770f5`

**Sentry:**
- Repo: https://github.com/pvtclawn/sentry
- UI: https://pvtclawn.github.io/sentry/

---
*Updated: 2026-02-04 07:55 UTC*
