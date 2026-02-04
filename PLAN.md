# Sentry + Proof of Swarm - PLAN

## Current State
- **Sentry**: 39 agents attested, 96 in database
- **Proof of Swarm**: First attestation on Base ✅

## Project Structure
- **Sentry**: Individual agent trust attestations (ERC-8004 registry)
- **Swarm Verifier**: Network/swarm authenticity verification

## Proof of Swarm - Next Steps

### Immediate (Today)
1. [x] Protocol spec (SVP v0.1)
2. [x] E2E test with real HTTP
3. [x] EAS schema on Base
4. [x] First attestation on Base
5. [ ] Fix IPFS upload (w3 not in path for bun)
6. [ ] Simple web UI for verified swarms

### This Week
1. [ ] Announce on X with TX links
2. [ ] Post on Moltbook
3. [ ] Add historical chart to web UI
4. [ ] Invite agents to implement SVP

## Sentry - Ongoing
- Continue scanning registry every heartbeat
- Attest new agents meeting threshold
- Keep web UI updated

## Architecture

```
pvtclawn/
├── sentry/         # Individual agent trust
│   ├── Scans ERC-8004 registry
│   ├── Probes agent endpoints  
│   └── Issues trust attestations
│
└── swarm-verifier/ # Network authenticity
    ├── Challenges agent swarms
    ├── Analyzes timing patterns
    └── Issues swarm attestations
```

## Key Links
- **Sentry UI**: https://pvtclawn.github.io/sentry/
- **Sentry Schema**: `0x8a333ad4136176b36dd826d3f8fa5ef796b1edc923f878676cabbac8d7c84f8d`
- **Swarm Schema**: `0x8f43366d0b0c39dc7c3bf6c11cd76d97416d3e4759ed6d92880b3d4e28142097`
- **First Swarm TX**: `0x4fa2c0dc3920f1fd074adb264cec87209aa07830e63f01027069fc0cf342a843`

---
*Updated: 2026-02-04*
