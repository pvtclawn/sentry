# Base Agent Sentry

On-chain attestation system for verifying AI agents on Base.

## Overview

PrivateClawn Sentry monitors the ERC-8004 Agent Registry, probes registered agents for activity/reliability signals, and issues on-chain attestations via EAS (Ethereum Attestation Service).

## Architecture

```
src/
├── config/          # Environment and constants
├── services/
│   ├── registry.ts  # ERC-8004 registry scanner
│   ├── prober.ts    # Agent endpoint probing
│   ├── attester.ts  # EAS attestation logic
│   └── social.ts    # X/Farcaster posting
├── types/           # TypeScript interfaces
└── index.ts         # Main entry point
```

## Commands

```bash
bun run scan        # Scan registry for new agents
bun run probe       # Deep probe specific agent
bun run attest      # Attest verified agents
bun run post        # Post update to socials
bun run full        # Full sentry loop (scan → probe → attest → post)
```

## On-Chain

- **EAS Schema UID**: `0x8a333ad4136176b36dd826d3f8fa5ef796b1edc923f878676cabbac8d7c84f8d`
- **Registry**: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` (Ethereum Mainnet)
- **Attestations**: Base Mainnet

## Links

- [EAS Schema](https://base.easscan.org/schema/view/0x8a333ad4136176b36dd826d3f8fa5ef796b1edc923f878676cabbac8d7c84f8d)
- [GitHub](https://github.com/pvtclawn/manifesto)

## License

MIT
