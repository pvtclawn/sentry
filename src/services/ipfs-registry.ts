/**
 * IPFS Registry - Maps attestation UIDs to IPFS CIDs
 * 
 * Temporary solution until schema is updated to include CID on-chain.
 * This file is deployed with the web UI.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const REGISTRY_PATH = join(import.meta.dir, "../../data/ipfs-registry.json");

interface IPFSRegistry {
  updatedAt: string;
  entries: Record<string, {
    cid: string;
    agentId: string;
    uploadedAt: string;
  }>;
}

export function loadIPFSRegistry(): IPFSRegistry {
  if (!existsSync(REGISTRY_PATH)) {
    return { updatedAt: new Date().toISOString(), entries: {} };
  }
  return JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
}

export function saveIPFSRegistry(registry: IPFSRegistry): void {
  registry.updatedAt = new Date().toISOString();
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

export function registerCID(
  attestationUID: string,
  agentId: string,
  cid: string
): void {
  const registry = loadIPFSRegistry();
  registry.entries[attestationUID] = {
    cid,
    agentId,
    uploadedAt: new Date().toISOString(),
  };
  saveIPFSRegistry(registry);
}

export function getCID(attestationUID: string): string | null {
  const registry = loadIPFSRegistry();
  return registry.entries[attestationUID]?.cid ?? null;
}
