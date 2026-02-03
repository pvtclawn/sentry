/**
 * Registry Scanner - Monitors ERC-8004 for new agent registrations
 */

import { createPublicClient, http, parseAbiItem } from "viem";
import { mainnet } from "viem/chains";
import { RPC, REGISTRY_ADDRESS } from "../config";
import type { AgentRegistration } from "../types";

const REGISTRY_ABI = [
  parseAbiItem("function tokenURI(uint256 tokenId) view returns (string)"),
  parseAbiItem("function ownerOf(uint256 tokenId) view returns (address)"),
  parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"),
] as const;

export interface RegistryEvent {
  agentId: string;
  owner: string;
  block: number;
  txHash: string;
}

/**
 * Create Ethereum client with fallback RPC
 */
function createClient() {
  return createPublicClient({
    chain: mainnet,
    transport: http(RPC.ethereum[0]),
  });
}

/**
 * Fetch registration file from various URI schemes
 */
export async function fetchRegistration(uri: string): Promise<AgentRegistration | null> {
  try {
    let url = uri;
    
    if (uri.startsWith("ipfs://")) {
      const cid = uri.replace("ipfs://", "");
      url = `https://ipfs.io/ipfs/${cid}`;
    } else if (uri.startsWith("data:")) {
      const base64 = uri.split(",")[1];
      if (!base64) return null;
      return JSON.parse(Buffer.from(base64, "base64").toString());
    }
    
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return null;
    return await response.json() as AgentRegistration;
  } catch {
    return null;
  }
}

/**
 * Scan for new registrations in block range
 */
export async function scanRegistrations(
  fromBlock: bigint,
  toBlock?: bigint
): Promise<RegistryEvent[]> {
  const client = createClient();
  const latestBlock = toBlock ?? await client.getBlockNumber();
  
  console.log(`🔍 Scanning blocks ${fromBlock} to ${latestBlock}...`);
  
  const logs = await client.getLogs({
    address: REGISTRY_ADDRESS,
    event: parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"),
    args: { from: "0x0000000000000000000000000000000000000000" }, // Mints only
    fromBlock,
    toBlock: latestBlock,
  });
  
  return logs.map(log => ({
    agentId: log.args.tokenId!.toString(),
    owner: log.args.to!,
    block: Number(log.blockNumber),
    txHash: log.transactionHash,
  }));
}

/**
 * Get agent details from registry
 */
export async function getAgentDetails(agentId: string) {
  const client = createClient();
  
  const [uri, owner] = await Promise.all([
    client.readContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: "tokenURI",
      args: [BigInt(agentId)],
    }),
    client.readContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: "ownerOf",
      args: [BigInt(agentId)],
    }),
  ]);
  
  const registration = await fetchRegistration(uri);
  
  return { agentId, owner, uri, registration };
}
