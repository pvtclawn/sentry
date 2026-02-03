/**
 * Backfill - Scan historical blocks to find and attest more agents
 */

import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { scanRegistrations, getAgentDetails } from "./services/registry";
import { probeAgent, calculateScore } from "./services/prober";
import { attestAgent, formatTxLink, formatAttestationLink } from "./services/attester";
import { loadState, saveState, isAttested, markAttested, loadAgentsData, saveAgentsData } from "./services/state";
import { RPC, SCHEMA_UID } from "./config";

const ATTESTATION_THRESHOLD = 50;
const PROBE_LIMIT = 20; // Smaller batches for backfill
const BLOCK_RANGE = 50000n; // 50k blocks at a time

async function main() {
  const args = process.argv.slice(2);
  const blocksBack = args[0] ? BigInt(args[0]) : 100000n;
  
  console.log("🦞🛡️ PrivateClawn Sentry - BACKFILL");
  console.log("===================================");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Looking back: ${blocksBack} blocks`);
  console.log("");
  
  const state = loadState();
  const agentsData = loadAgentsData();
  console.log(`📊 Previously attested: ${state.attestedAgents.length} agents`);
  
  const client = createPublicClient({
    chain: mainnet,
    transport: http(RPC.ethereum[0]),
  });
  
  const latestBlock = await client.getBlockNumber();
  const fromBlock = latestBlock - blocksBack;
  
  console.log(`\n📡 Scanning blocks ${fromBlock} to ${latestBlock}...`);
  
  // Scan in chunks
  let allEvents: { agentId: string; owner: string; block: number }[] = [];
  let currentFrom = fromBlock;
  
  while (currentFrom < latestBlock) {
    const currentTo = currentFrom + BLOCK_RANGE > latestBlock ? latestBlock : currentFrom + BLOCK_RANGE;
    console.log(`  Chunk: ${currentFrom} - ${currentTo}...`);
    
    try {
      const events = await scanRegistrations(currentFrom, currentTo);
      allEvents = allEvents.concat(events);
    } catch (e) {
      console.log(`  Error in chunk: ${(e as Error).message}`);
    }
    
    currentFrom = currentTo + 1n;
  }
  
  console.log(`\nFound ${allEvents.length} total registrations`);
  
  // Filter out already attested and reverse to process newest first
  const newEvents = allEvents
    .filter(e => !isAttested(state, e.agentId))
    .reverse();
  console.log(`New (not yet attested): ${newEvents.length}`);
  
  if (newEvents.length === 0) {
    console.log("\n✅ Nothing to backfill!");
    return;
  }
  
  // Probe and attest (limited batch)
  console.log(`\n🔍 Probing up to ${PROBE_LIMIT} agents...`);
  
  let attested = 0;
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
      
      // Save to database
      agentsData.agents[probe.agentId] = {
        tokenId: probe.agentId,
        name: probe.signals.name,
        description: probe.signals.description,
        owner: probe.owner,
        score,
        signals: probe.signals,
        probedAt: probe.probedAt,
        attestationId: null,
      };
      
      if (score >= ATTESTATION_THRESHOLD && !isAttested(state, probe.agentId)) {
        try {
          const result = await attestAgent(probe);
          console.log(`    ✅ TX: ${formatTxLink(result.txHash)}`);
          
          agentsData.agents[probe.agentId].attestationId = result.uid;
          markAttested(state, probe.agentId);
          attested++;
          
          // Wait between attestations
          await new Promise(r => setTimeout(r, 2000));
        } catch (e) {
          console.log(`    ❌ Attest error: ${(e as Error).message.slice(0, 50)}`);
        }
      }
      
      state.stats.totalScanned++;
    } catch (e) {
      console.log(`  #${event.agentId} - Error: ${(e as Error).message.slice(0, 50)}`);
    }
  }
  
  // Save state
  state.lastScannedBlock = Number(latestBlock);
  saveState(state);
  saveAgentsData(agentsData);
  
  console.log(`\n✅ Backfill complete!`);
  console.log(`📊 Attested this run: ${attested}`);
  console.log(`📊 Total attested: ${state.attestedAgents.length}`);
}

main().catch(console.error);
