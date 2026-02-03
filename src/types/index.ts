/**
 * Type definitions for Sentry
 */

export interface AgentRegistration {
  type?: string;
  name: string;
  description?: string;
  active: boolean;
  services?: AgentService[];
  x402Support?: boolean;
}

export interface AgentService {
  name: string;
  endpoint: string;
  version?: string;
}

export interface AgentProbe {
  agentId: string;
  owner: string;
  uri: string;
  registration: AgentRegistration | null;
  signals: AgentSignals;
  probedAt: string;
}

export interface AgentSignals {
  hasValidRegistration: boolean;
  name: string | null;
  description: string | null;
  isActive: boolean;
  serviceCount: number;
  hasA2A: boolean;
  hasMCP: boolean;
  hasENS: boolean;
  hasX402: boolean;
  hasWeb: boolean;
  webEndpointReachable: boolean;
}

export interface AttestationResult {
  agentId: string;
  txHash: string;
  attestationUID: string;
  score: number;
  timestamp: number;
  ipfsCid?: string;
}

// Signal flags for bit-packing
export const SIGNAL_FLAGS = {
  VALID_REGISTRATION: 0,
  IS_ACTIVE: 1,
  HAS_A2A: 2,
  HAS_MCP: 3,
  HAS_ENS: 4,
  HAS_X402: 5,
  WEB_REACHABLE: 6,
  VERIFIED_ENDPOINT: 7,
} as const;
