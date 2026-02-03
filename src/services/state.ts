/**
 * State Management - Track scanned blocks and attested agents
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const STATE_PATH = join(import.meta.dir, "../../state.json");

export interface SentryState {
  lastScannedBlock: number;
  attestedAgents: string[];
  lastRun: string;
  stats: {
    totalScanned: number;
    totalAttested: number;
  };
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
  if (!existsSync(STATE_PATH)) {
    return { ...DEFAULT_STATE };
  }
  
  try {
    return JSON.parse(readFileSync(STATE_PATH, "utf8"));
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state: SentryState): void {
  state.lastRun = new Date().toISOString();
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
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
