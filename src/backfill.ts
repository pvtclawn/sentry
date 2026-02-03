/**
 * Backfill agent names from ERC-8004 registry
 * Run this to populate agents.json with names for all attested agents
 */

import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" as const;
const EAS_GRAPHQL = "https://base.easscan.org/graphql";
const ATTESTER = "0xeC6cd01f6fdeaEc192b88Eb7B62f5E72D65719Af";
const SCHEMA_UID = "0x8a333ad4136176b36dd826d3f8fa5ef796b1edc923f878676cabbac8d7c84f8d";

const DATA_DIR = join(import.meta.dir, "../data");
const AGENTS_FILE = join(DATA_DIR, "agents.json");
const WEB_PUBLIC = join(import.meta.dir, "../web/public");

const client = createPublicClient({
  chain: mainnet,
  transport: http("https://ethereum-rpc.publicnode.com"),
});

interface AgentData {
  tokenId: string;
  name: string | null;
  description: string | null;
  score: number;
  signals: string;
  attestationId: string;
  probedAt: string;
}

interface AgentsFile {
  updatedAt: string;
  agents: Record<string, AgentData>;
}

async function fetchAttestations(): Promise<Array<{ id: string; agentId: number; score: number; signals: string; time: number }>> {
  console.log("📡 Fetching attestations from EAS...");
  
  const query = `{
    attestations(
      where: { 
        attester: { equals: "${ATTESTER}" },
        schemaId: { equals: "${SCHEMA_UID}" }
      }
      orderBy: [{ time: desc }]
      take: 200
    ) {
      id
      time
      decodedDataJson
    }
  }`;

  const response = await fetch(EAS_GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();
  const attestations = data.data?.attestations || [];
  
  // Parse and deduplicate (keep first occurrence = most recent)
  const seen = new Set<number>();
  const results: Array<{ id: string; agentId: number; score: number; signals: string; time: number }> = [];
  
  for (const att of attestations) {
    try {
      const decoded = JSON.parse(att.decodedDataJson);
      const agentIdField = decoded.find((f: {name: string}) => f.name === "agentId");
      const scoreField = decoded.find((f: {name: string}) => f.name === "score");
      const signalsField = decoded.find((f: {name: string}) => f.name === "signals");
      
      const agentId = parseInt(agentIdField?.value?.value?.hex || "0", 16);
      
      if (!seen.has(agentId)) {
        seen.add(agentId);
        results.push({
          id: att.id,
          agentId,
          score: scoreField?.value?.value || 0,
          signals: signalsField?.value?.value || "0x0",
          time: att.time,
        });
      }
    } catch (e) {
      console.error("  Failed to parse:", e);
    }
  }
  
  console.log(`  Found ${results.length} unique agents`);
  return results;
}

async function fetchAgentMetadata(tokenId: number): Promise<{ name: string | null; description: string | null }> {
  try {
    // Call tokenURI(uint256)
    const data = await client.readContract({
      address: REGISTRY,
      abi: [{
        name: "tokenURI",
        type: "function",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view",
      }],
      functionName: "tokenURI",
      args: [BigInt(tokenId)],
    });

    const uri = data as string;
    
    if (uri.startsWith("data:application/json")) {
      // Inline JSON
      const jsonStr = uri.replace("data:application/json;base64,", "");
      const decoded = Buffer.from(jsonStr, "base64").toString("utf-8");
      const meta = JSON.parse(decoded);
      return { 
        name: meta.name || null, 
        description: meta.description?.slice(0, 200) || null 
      };
    } else if (uri.startsWith("http")) {
      // External URL
      const response = await fetch(uri, { signal: AbortSignal.timeout(5000) });
      const meta = await response.json();
      return { 
        name: meta.name || null, 
        description: meta.description?.slice(0, 200) || null 
      };
    }
  } catch (e) {
    // Silently fail - many tokens don't have metadata
  }
  
  return { name: null, description: null };
}

async function main() {
  console.log("🦞🛡️ Agent Backfill");
  console.log("===================\n");
  
  // Fetch all attestations
  const attestations = await fetchAttestations();
  
  // Load existing data
  let agentsData: AgentsFile = { updatedAt: "", agents: {} };
  if (existsSync(AGENTS_FILE)) {
    agentsData = JSON.parse(readFileSync(AGENTS_FILE, "utf-8"));
    console.log(`📚 Loaded ${Object.keys(agentsData.agents).length} existing agents\n`);
  }
  
  // Fetch metadata for each agent
  console.log("🔍 Fetching agent metadata from registry...");
  let newCount = 0;
  let updateCount = 0;
  
  for (const att of attestations) {
    const tokenId = att.agentId.toString();
    
    // Check if we already have this agent with a name
    if (agentsData.agents[tokenId]?.name) {
      continue;
    }
    
    // Fetch metadata
    const { name, description } = await fetchAgentMetadata(att.agentId);
    
    if (agentsData.agents[tokenId]) {
      // Update existing
      agentsData.agents[tokenId].name = name;
      agentsData.agents[tokenId].description = description;
      updateCount++;
    } else {
      // New agent
      agentsData.agents[tokenId] = {
        tokenId,
        name,
        description,
        score: att.score,
        signals: att.signals,
        attestationId: att.id,
        probedAt: new Date(att.time * 1000).toISOString(),
      };
      newCount++;
    }
    
    const displayName = name || `#${tokenId}`;
    console.log(`  ${displayName} (score: ${att.score})`);
    
    // Rate limit
    await new Promise(r => setTimeout(r, 100));
  }
  
  // Save
  mkdirSync(DATA_DIR, { recursive: true });
  agentsData.updatedAt = new Date().toISOString();
  writeFileSync(AGENTS_FILE, JSON.stringify(agentsData, null, 2));
  
  // Also copy to web public
  mkdirSync(WEB_PUBLIC, { recursive: true });
  writeFileSync(join(WEB_PUBLIC, "agents.json"), JSON.stringify(agentsData, null, 2));
  
  console.log(`\n✅ Done!`);
  console.log(`   New agents: ${newCount}`);
  console.log(`   Updated: ${updateCount}`);
  console.log(`   Total: ${Object.keys(agentsData.agents).length}`);
}

main().catch(console.error);
