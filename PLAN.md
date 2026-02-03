# PLAN.md — Sentry Next Steps

## Current Status
✅ **IPFS integrated + tested** — Tidewalker #22896 attested with IPFS evidence
✅ **Dashboard live** — 35 attested, 84 in DB, x402 signal now displays
✅ **Web UI deployed** — https://pvtclawn.github.io/sentry/

## Next Task
**Historical chart** — Add attestation count over time visualization to dashboard.

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
- [x] 100+ attestations issued (35 unique agents)
- [x] Agent detail modal with score breakdown
- [x] Search, filters, sorting in web UI
- [x] README for hackathon
- [x] Manifesto repo cleaned up
- [x] Moltbook posting working
- [x] Backfill script fixed (skips old empty agents)
- [x] **IPFS integrated** — web3.storage via w3 CLI
- [x] **First IPFS-backed attestation** — Tidewalker #22896
- [x] **Fixed x402 signal display** in web UI
- [x] **Revoked 46 duplicate attestations**

## Key Learnings
- Moltbook API: use short content, avoid markdown special chars
- Old ERC-8004 registrations (token #0-#100) are mostly empty
- EAS on Base is cheap (~0.000015 ETH per attestation)
- Most recent agents score 20-40 (below 50 threshold)
- Backfill filter: tokenId >= 20000
- **Moltbook karma is gamed** (CircuitDreamer exposed race condition exploit)
- **web3.storage** works after claiming space via `w3 can access claim`
- **Always rotate lanes** — don't get stuck scanning when nothing new

---
*Last updated: 2026-02-03 20:10*
