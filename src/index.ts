/**
 * Sentry Main Entry Point
 */

import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { scanRegistrations, getAgentDetails } from "./services/registry";
import { probeAgent, calculateScore } from "./services/prober";
import { attestAgent, formatTxLink, formatAttestationLink } from "./services/attester";
import { loadState, saveState, isAttested, markAttested } from "./services/state";
import { EXPLORERS, SCHEMA_UID, RPC } from "./config";

const ATTESTATION_THRESHOLD = 50; // Minimum score to attest
const PROBE_LIMIT = 50; // Max agents to probe per run

async function main() {
  console.log("🦞🛡️ PrivateClawn Sentry");
  console.log("========================");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Schema: ${SCHEMA_UID}`);
  console.log("");
  
  // Load state
  const state = loadState();
  console.log(`📊 Previously attested: ${state.attestedAgents.length} agents`);
  
  // Get current block - start from recent if no state
  const client = createPublicClient({
    chain: mainnet,
    transport: http(RPC.ethereum[0]),
  });
  const latestBlock = await client.getBlockNumber();
  // Start from ~1 week ago if no state, or from last scanned
  const fromBlock = state.lastScannedBlock > 0 
    ? BigInt(state.lastScannedBlock) 
    : latestBlock - 50000n;
  
  console.log(`\n📡 Step 1: Scanning registry...`);
  const events = await scanRegistrations(fromBlock, latestBlock);
  console.log(`Found ${events.length} registrations in range\n`);
  
  // Filter out already attested and reverse to get newest first
  const newEvents = events
    .filter(e => !isAttested(state, e.agentId))
    .reverse();
  console.log(`New (not yet attested): ${newEvents.length}\n`);
  
  // Probe agents
  console.log("🔍 Step 2: Probing agents...");
  const probes = [];
  
  for (const event of newEvents.slice(0, PROBE_LIMIT)) {
    try {
      const details = await getAgentDetails(event.agentId);
      const probe = await probeAgent(
        details.agentId,
        details.owner,
        details.uri,
        details.registration
      );
      
      const score = calculateScore(probe.signals);
      console.log(`  #${probe.agentId} ${probe.signals.name ?? "Unknown"} - Score: ${score}`);
      
      probes.push(probe);
      state.stats.totalScanned++;
    } catch (e) {
      console.log(`  #${event.agentId} - Error: ${(e as Error).message}`);
    }
  }
  
  // Attest worthy agents
  console.log("\n🏅 Step 3: Attesting worthy agents...");
  const worthy = probes.filter(p => calculateScore(p.signals) >= ATTESTATION_THRESHOLD);
  console.log(`${worthy.length} agents meet threshold (>= ${ATTESTATION_THRESHOLD})\n`);
  
  for (const probe of worthy) {
    if (isAttested(state, probe.agentId)) {
      console.log(`  #${probe.agentId} already attested, skipping\n`);
      continue;
    }
    
    try {
      const result = await attestAgent(probe);
      console.log(`  TX: ${formatTxLink(result.txHash)}`);
      console.log(`  Attestation: ${formatAttestationLink(result)}\n`);
      
      markAttested(state, probe.agentId);
      
      // Wait 2s between attestations to avoid nonce issues
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.log(`  Error: ${(e as Error).message}\n`);
    }
  }
  
  // Save state
  state.lastScannedBlock = Number(latestBlock);
  saveState(state);
  
  console.log("✅ Sentry run complete!");
  console.log(`📊 Total attested: ${state.attestedAgents.length}`);
}

main().catch(console.error);
