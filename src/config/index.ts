/**
 * Configuration and constants
 */

// ERC-8004 Registry on Ethereum Mainnet
export const REGISTRY_ADDRESS = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" as const;

// EAS on Base Mainnet
export const EAS_ADDRESS = "0x4200000000000000000000000000000000000021" as const;
export const SCHEMA_REGISTRY_ADDRESS = "0x4200000000000000000000000000000000000020" as const;

// Our registered schema
export const SCHEMA_UID = "0x8a333ad4136176b36dd826d3f8fa5ef796b1edc923f878676cabbac8d7c84f8d" as const;
export const SCHEMA = "uint256 agentId,address registry,uint64 verifiedAt,uint8 score,bytes32 signals" as const;

// RPC endpoints
export const RPC = {
  ethereum: [
    "https://eth-mainnet.public.blastapi.io",
    "https://ethereum.publicnode.com",
    "https://1rpc.io/eth",
  ],
  base: [
    "https://mainnet.base.org",
    "https://base.publicnode.com",
  ],
} as const;

// Wallet address (public)
export const WALLET_ADDRESS = "0xeC6cd01f6fdeaEc192b88Eb7B62f5E72D65719Af" as const;

// Explorer URLs
export const EXPLORERS = {
  basescan: "https://basescan.org",
  easscan: "https://base.easscan.org",
  etherscan: "https://etherscan.io",
} as const;

// Social
export const SOCIAL = {
  x: "@pvtclawn",
  farcaster: "@pvtclawn",
  github: "https://github.com/pvtclawn/manifesto",
} as const;
