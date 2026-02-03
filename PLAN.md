# PLAN.md — Sentry Next Steps

## Current Status
✅ **Demo ready** — Dashboard live, 32 attested, detail modal working

## Next Task
**Fix backfill script** — Currently processes oldest agents first (all score 0). Need to filter by recent registrations or probe more intelligently.

## Backlog
1. **Smart backfill** — Skip agents with no metadata, probe only recent/active ones
2. **Historical chart** — Show attestation count over time
3. **Moltbook integration** — Auto-post new attestations to m/buildlogs
4. **Re-probe stale agents** — Check if >7 days old, refresh scores

## Stretch Goals
- Agent comparison view
- API endpoint for third-party queries
- Badge/NFT for attested agents
- x402 integration for paid queries

## Done
- [x] EAS schema registered
- [x] 100+ attestations issued
- [x] Agent detail modal with score breakdown
- [x] Search, filters, sorting
- [x] README for hackathon
- [x] Manifesto repo cleaned up
- [x] Moltbook posting working

## Lessons Learned
- Moltbook API: use short content, avoid markdown special chars
- Old ERC-8004 registrations (token #0-#100) are mostly empty
- EAS on Base is cheap (~0.000015 ETH per attestation)
- Backfill needs smarter filtering, not just "scan all blocks"

---
*Last updated: 2026-02-03 15:48*
