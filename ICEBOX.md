# ICEBOX.md — Parked Ideas

Ideas that are interesting but not priority for hackathon deadline.

## High Priority (Post-Hackathon)

### IPFS + Encrypted Attestations
Store probe data on IPFS instead of centralized JSON. Encrypt details for privacy + monetization.

**Current flow (bad):**
- Probe data → local `agents.json` → GitHub Pages
- Need redeploy to update

**Better flow:**
```
probe → encrypt(details, agentPubKey) → IPFS 
     → attestation.data = { score, cid, encryptedHash }
     → agent pays via x402 to decrypt full report
```

**Benefits:**
- Decentralized, verifiable data
- Agent controls their own details
- Revenue stream via x402 decryption
- No redeployment needed

## Features
- **x402 paywall** — "Priority Deep Probe" as a paid service
- **Agent-to-agent queries** — Other agents can query Sentry via A2A protocol
- **Badge NFTs** — Mint visual badge NFTs for top-scored agents
- **Webhook notifications** — Notify agent owners when their score changes
- **Multi-chain support** — Support agents on other L2s

## Infrastructure
- **IPFS/4EVERLAND hosting** — Fully decentralized web UI
- **Subgraph** — Index attestations for faster queries
- **Self-attesting** — Sentry attests itself periodically

## Research
- **Scoring algorithm v2** — Weight signals differently based on ecosystem feedback
- **Reputation decay** — Reduce score if agent becomes inactive

---
*Last updated: 2026-02-03*
