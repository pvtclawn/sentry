/**
 * Agent Prober - Deep analysis of agent endpoints and signals
 */

import type { AgentProbe, AgentSignals, AgentRegistration } from "../types";
import { SIGNAL_FLAGS } from "../types";

/**
 * Probe a web endpoint for reachability
 */
async function probeEndpoint(endpoint: string): Promise<boolean> {
  try {
    const response = await fetch(endpoint, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Calculate reliability score (0-100)
 */
export function calculateScore(signals: AgentSignals): number {
  let score = 0;
  
  if (signals.hasValidRegistration) score += 20;
  if (signals.isActive) score += 20;
  if (signals.serviceCount > 0) score += 15;
  if (signals.hasA2A) score += 10;
  if (signals.hasMCP) score += 10;
  if (signals.hasENS) score += 10;
  if (signals.webEndpointReachable) score += 15;
  
  return Math.min(100, score);
}

/**
 * Pack signals into bytes32 for on-chain storage
 */
export function packSignals(signals: AgentSignals): `0x${string}` {
  let flags = 0n;
  
  if (signals.hasValidRegistration) flags |= 1n << BigInt(SIGNAL_FLAGS.VALID_REGISTRATION);
  if (signals.isActive) flags |= 1n << BigInt(SIGNAL_FLAGS.IS_ACTIVE);
  if (signals.hasA2A) flags |= 1n << BigInt(SIGNAL_FLAGS.HAS_A2A);
  if (signals.hasMCP) flags |= 1n << BigInt(SIGNAL_FLAGS.HAS_MCP);
  if (signals.hasENS) flags |= 1n << BigInt(SIGNAL_FLAGS.HAS_ENS);
  if (signals.hasX402) flags |= 1n << BigInt(SIGNAL_FLAGS.HAS_X402);
  if (signals.webEndpointReachable) flags |= 1n << BigInt(SIGNAL_FLAGS.WEB_REACHABLE);
  
  return `0x${flags.toString(16).padStart(64, "0")}`;
}

/**
 * Probe an agent for signals
 */
export async function probeAgent(
  agentId: string,
  owner: string,
  uri: string,
  registration: AgentRegistration | null
): Promise<AgentProbe> {
  const signals: AgentSignals = {
    hasValidRegistration: registration !== null,
    name: registration?.name ?? null,
    description: registration?.description?.slice(0, 200) ?? null,
    isActive: registration?.active ?? false,
    serviceCount: registration?.services?.length ?? 0,
    hasA2A: false,
    hasMCP: false,
    hasENS: false,
    hasX402: registration?.x402Support ?? false,
    hasWeb: false,
    webEndpointReachable: false,
  };
  
  if (registration?.services) {
    for (const svc of registration.services) {
      if (svc.name === "A2A") signals.hasA2A = true;
      if (svc.name === "MCP") signals.hasMCP = true;
      if (svc.name === "ENS") signals.hasENS = true;
      if (svc.name === "web") {
        signals.hasWeb = true;
        signals.webEndpointReachable = await probeEndpoint(svc.endpoint);
      }
    }
  }
  
  return {
    agentId,
    owner,
    uri,
    registration,
    signals,
    probedAt: new Date().toISOString(),
  };
}
