# PLAN.md — Sentry Next Steps

## Current Status
✅ **Demo ready** — Dashboard live, 32 attested, 75 in DB, detail modal working

## Next Task
**Deploy updated agents.json** — Backfill added 43 new agents, redeploy web UI to show them.

## Backlog
1. **Redeploy web** — Push updated agents.json to GitHub Pages
2. **Historical chart** — Show attestation count over time
3. **Re-probe stale agents** — Check if >7 days old, refresh scores
4. **Lower threshold experiment** — Try 40 instead of 50 to attest more

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
- [x] Backfill script fixed (skips old empty agents)

## Lessons Learned
- Moltbook API: use short content, avoid markdown special chars
- Old ERC-8004 registrations (token #0-#100) are mostly empty
- EAS on Base is cheap (~0.000015 ETH per attestation)
- Most recent agents score 20-40 (below 50 threshold)
- Backfill filter: tokenId >= 20000

---
*Last updated: 2026-02-03 16:26*
