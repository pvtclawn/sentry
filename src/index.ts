/**
 * Sentry Main Entry Point
 */

import { scanRegistrations, getAgentDetails } from "./services/registry";
import { probeAgent, calculateScore } from "./services/prober";
import { attestAgent, formatTxLink, formatAttestationLink } from "./services/attester";
import { loadState, saveState, isAttested, markAttested } from "./services/state";
import { SCHEMA_UID } from "./config";

const ATTESTATION_THRESHOLD = 50; // Minimum score to attest

async function main() {
  console.log("🦞🛡️ PrivateClawn Sentry");
  console.log("========================");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Schema: ${SCHEMA_UID}`);
  console.log("");
  
  const state = loadState();
  console.log(`📊 State: ${state.stats.totalAttested} attested, last block ${state.lastScannedBlock}`);
  console.log("");
  
  // Scan from last block or recent
  const fromBlock = state.lastScannedBlock > 0 
    ? BigInt(state.lastScannedBlock + 1)
    : 24370000n;
  
  console.log("📡 Step 1: Scanning registry...");
  const events = await scanRegistrations(fromBlock);
  console.log(`Found ${events.length} registrations\n`);
  
  if (events.length > 0) {
    state.lastScannedBlock = Math.max(...events.map(e => e.block));
    state.stats.totalScanned += events.length;
  }
  
  // Probe agents (limit to 20 per run)
  console.log("🔍 Step 2: Probing agents...");
  const probes = [];
  
  for (const event of events.slice(0, 20)) {
    // Skip already attested
    if (isAttested(state, event.agentId)) {
      console.log(`  #${event.agentId} - Already attested, skipping`);
      continue;
    }
    
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
    } catch (e) {
      console.log(`  #${event.agentId} - Error: ${(e as Error).message}`);
    }
  }
  
  // Attest worthy agents
  console.log("\n🏅 Step 3: Attesting worthy agents...");
  const worthy = probes.filter(p => calculateScore(p.signals) >= ATTESTATION_THRESHOLD);
  console.log(`${worthy.length} agents meet threshold (>= ${ATTESTATION_THRESHOLD})\n`);
  
  for (const probe of worthy) {
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
  
  saveState(state);
  console.log(`✅ Sentry run complete! ${state.stats.totalAttested} total attested.`);
}

main().catch(console.error);
