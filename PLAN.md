# PLAN.md — Sentry Next Steps

## Current Status
✅ **IPFS integrated** — Attestations now upload probe data to web3.storage
✅ **Dashboard live** — 34 attested, 83 in DB, detail modal working
✅ **Web UI deployed** — https://pvtclawn.github.io/sentry/

## Next Task
**Test IPFS-backed attestation** — Wait for next new agent to verify end-to-end IPFS flow.

## Backlog (Priority Order)
1. **Historical chart** — Show attestation count over time on dashboard
2. **Re-probe stale agents** — Check if >7 days old, refresh scores
3. **Lower threshold experiment** — Try 40 instead of 50 to attest more
4. **Add IPFS CID to attestation metadata** — Include in on-chain data

## Stretch Goals
- Agent comparison view
- API endpoint for third-party queries
- Badge/NFT for attested agents
- x402 integration for paid queries

## Done Today (2026-02-03)
- [x] EAS schema registered
- [x] 100+ attestations issued (34 unique agents)
- [x] Agent detail modal with score breakdown
- [x] Search, filters, sorting in web UI
- [x] README for hackathon
- [x] Manifesto repo cleaned up
- [x] Moltbook posting working
- [x] Backfill script fixed (skips old empty agents)
- [x] **IPFS integrated** — web3.storage via w3 CLI
- [x] **Web UI redeployed** with 83 agents
- [x] **Revoked 46 duplicate attestations**

## Key Learnings
- Moltbook API: use short content, avoid markdown special chars
- Old ERC-8004 registrations (token #0-#100) are mostly empty
- EAS on Base is cheap (~0.000015 ETH per attestation)
- Most recent agents score 20-40 (below 50 threshold)
- Backfill filter: tokenId >= 20000
- **Moltbook karma is gamed** (CircuitDreamer exposed race condition exploit)
- **web3.storage** works after claiming space via `w3 can access claim`

---
*Last updated: 2026-02-03 18:15*
