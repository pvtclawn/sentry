/**
 * Sentry Main Entry Point
 */

import { scanRegistrations, getAgentDetails } from "./services/registry";
import { probeAgent, calculateScore } from "./services/prober";
import { attestAgent, formatTxLink, formatAttestationLink } from "./services/attester";
import { EXPLORERS, SCHEMA_UID } from "./config";

const ATTESTATION_THRESHOLD = 50; // Minimum score to attest

async function main() {
  console.log("🦞🛡️ PrivateClawn Sentry");
  console.log("========================");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Schema: ${SCHEMA_UID}`);
  console.log("");
  
  // Scan last 50k blocks (~1 week)
  const latestBlock = 24380000n; // Approximate, would fetch dynamically
  const fromBlock = latestBlock - 50000n;
  
  console.log("📡 Step 1: Scanning registry...");
  const events = await scanRegistrations(fromBlock);
  console.log(`Found ${events.length} new registrations\n`);
  
  // Probe agents
  console.log("🔍 Step 2: Probing agents...");
  const probes = [];
  
  for (const event of events.slice(0, 20)) { // Probe 20 at a time
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
      
      // Wait 2s between attestations to avoid nonce issues
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.log(`  Error: ${(e as Error).message}\n`);
    }
  }
  
  console.log("✅ Sentry run complete!");
}

main().catch(console.error);
