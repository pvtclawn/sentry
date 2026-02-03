/**
 * State management for sentry persistence
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import type { AgentProbe } from "../types";

const STATE_DIR = join(import.meta.dir, "../../data");
const STATE_FILE = join(STATE_DIR, "sentry-state.json");
const PROBES_FILE = join(STATE_DIR, "probe-results.json");
const WEB_PUBLIC = join(import.meta.dir, "../../web/public");

export interface SentryState {
  lastScannedBlock: number;
  attestedAgents: string[];
  lastRun: string;
  stats: {
    totalScanned: number;
    totalAttested: number;
  };
}

export interface ProbeResults {
  updatedAt: string;
  agents: Record<string, {
    name: string | null;
    description: string | null;
    score: number;
    signals: {
      hasA2A: boolean;
      hasMCP: boolean;
      hasENS: boolean;
      hasWeb: boolean;
      serviceCount: number;
    };
    probedAt: string;
    attestationId?: string;
  }>;
}

const DEFAULT_STATE: SentryState = {
  lastScannedBlock: 0,
  attestedAgents: [],
  lastRun: "",
  stats: {
    totalScanned: 0,
    totalAttested: 0,
  },
};

export function loadState(): SentryState {
  try {
    if (!existsSync(STATE_FILE)) {
      return { ...DEFAULT_STATE };
    }
    return JSON.parse(readFileSync(STATE_FILE, "utf8"));
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state: SentryState): void {
  mkdirSync(STATE_DIR, { recursive: true });
  state.lastRun = new Date().toISOString();
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function loadProbeResults(): ProbeResults {
  try {
    if (!existsSync(PROBES_FILE)) {
      return { updatedAt: "", agents: {} };
    }
    return JSON.parse(readFileSync(PROBES_FILE, "utf8"));
  } catch {
    return { updatedAt: "", agents: {} };
  }
}

export function saveProbeResult(probe: AgentProbe, score: number, attestationId?: string): void {
  mkdirSync(STATE_DIR, { recursive: true });
  
  const results = loadProbeResults();
  results.updatedAt = new Date().toISOString();
  results.agents[probe.agentId] = {
    name: probe.signals.name,
    description: probe.signals.description,
    score,
    signals: {
      hasA2A: probe.signals.hasA2A,
      hasMCP: probe.signals.hasMCP,
      hasENS: probe.signals.hasENS,
      hasWeb: probe.signals.hasWeb,
      serviceCount: probe.signals.serviceCount,
    },
    probedAt: probe.probedAt,
    attestationId,
  };
  
  writeFileSync(PROBES_FILE, JSON.stringify(results, null, 2));
  
  // Also copy to web public folder for static hosting
  mkdirSync(WEB_PUBLIC, { recursive: true });
  writeFileSync(join(WEB_PUBLIC, "agents.json"), JSON.stringify(results, null, 2));
}

export function isAttested(state: SentryState, agentId: string): boolean {
  return state.attestedAgents.includes(agentId);
}

export function markAttested(state: SentryState, agentId: string): void {
  if (!state.attestedAgents.includes(agentId)) {
    state.attestedAgents.push(agentId);
    state.stats.totalAttested++;
  }
}

// Full agents database with all details
export interface AgentsData {
  updatedAt: string;
  agents: Record<string, {
    tokenId: string;
    name: string | null;
    description: string | null;
    owner: string;
    score: number;
    signals: {
      hasA2A: boolean;
      hasMCP: boolean;
      hasENS: boolean;
      hasWeb: boolean;
      hasX402: boolean;
      serviceCount: number;
    };
    probedAt: string;
    attestationId: string | null;
  }>;
}

const AGENTS_FILE = join(STATE_DIR, "agents.json");

export function loadAgentsData(): AgentsData {
  try {
    if (!existsSync(AGENTS_FILE)) {
      return { updatedAt: "", agents: {} };
    }
    return JSON.parse(readFileSync(AGENTS_FILE, "utf8"));
  } catch {
    return { updatedAt: "", agents: {} };
  }
}

export function saveAgentsData(data: AgentsData): void {
  mkdirSync(STATE_DIR, { recursive: true });
  data.updatedAt = new Date().toISOString();
  writeFileSync(AGENTS_FILE, JSON.stringify(data, null, 2));
  
  // Also copy to web public folder for static hosting
  mkdirSync(WEB_PUBLIC, { recursive: true });
  writeFileSync(join(WEB_PUBLIC, "agents.json"), JSON.stringify(data, null, 2));
  console.log(`  📝 Saved agents.json (${Object.keys(data.agents).length} agents)`);
}
