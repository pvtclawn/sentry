/**
 * State management for sentry persistence
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const STATE_DIR = join(import.meta.dir, "../../data");
const STATE_FILE = join(STATE_DIR, "sentry-state.json");

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
  // Ensure data dir exists
  const { mkdirSync } = require("fs");
  mkdirSync(STATE_DIR, { recursive: true });
  
  state.lastRun = new Date().toISOString();
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
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
