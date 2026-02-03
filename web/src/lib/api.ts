import { createPublicClient, http, parseAbiItem } from 'viem';
import { base, mainnet } from 'viem/chains';

// EAS on Base
export const EAS_ADDRESS = '0x4200000000000000000000000000000000000021';
export const SCHEMA_UID = '0x8a333ad4136176b36dd826d3f8fa5ef796b1edc923f878676cabbac8d7c84f8d';
export const ATTESTER_ADDRESS = '0xeC6cd01f6fdeaEc192b88Eb7B62f5E72D65719Af';

// ERC-8004 Registry on Mainnet
export const REGISTRY_ADDRESS = '0x8004A169FB4a3325136EB29fA0ceB6d2e539a432';

// Clients
export const baseClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

export const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.llamarpc.com'),
});

// Types
export interface Attestation {
  uid: string;
  agentId: bigint;
  registryAddress: string;
  registrationTime: bigint;
  score: number;
  flags: number;
  time: bigint;
  txHash?: string;
}

export interface AgentInfo {
  tokenId: bigint;
  name: string;
  metadataUri: string;
}

// Fetch attestations from EAS GraphQL
export async function fetchAttestations(): Promise<Attestation[]> {
  const query = `{
    attestations(
      where: { 
        attester: { equals: "${ATTESTER_ADDRESS}" },
        schemaId: { equals: "${SCHEMA_UID}" }
      }
      orderBy: { time: desc }
      take: 100
    ) {
      id
      time
      decodedDataJson
      txid
    }
  }`;

  try {
    const res = await fetch('https://base.easscan.org/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const data = await res.json();
    const attestations = data.data?.attestations || [];

    return attestations.map((a: any) => {
      const decoded = JSON.parse(a.decodedDataJson);
      const getValue = (name: string) => decoded.find((d: any) => d.name === name)?.value?.value;
      
      return {
        uid: a.id,
        agentId: BigInt(getValue('agentId') || '0'),
        registryAddress: getValue('registryAddress') || '',
        registrationTime: BigInt(getValue('registrationTime') || '0'),
        score: Number(getValue('score') || 0),
        flags: Number(getValue('flags') || 0),
        time: BigInt(a.time),
        txHash: a.txid,
      };
    });
  } catch (error) {
    console.error('Failed to fetch attestations:', error);
    return [];
  }
}

// Fetch total attestation count
export async function fetchAttestationCount(): Promise<number> {
  const query = `{
    aggregateAttestation(
      where: { 
        attester: { equals: "${ATTESTER_ADDRESS}" },
        schemaId: { equals: "${SCHEMA_UID}" }
      }
    ) {
      _count { id }
    }
  }`;

  try {
    const res = await fetch('https://base.easscan.org/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const data = await res.json();
    return data.data?.aggregateAttestation?._count?.id || 0;
  } catch (error) {
    console.error('Failed to fetch count:', error);
    return 0;
  }
}

// Fetch agent name from registry
export async function fetchAgentName(tokenId: bigint): Promise<string> {
  try {
    const uri = await mainnetClient.readContract({
      address: REGISTRY_ADDRESS,
      abi: [parseAbiItem('function tokenURI(uint256 tokenId) view returns (string)')],
      functionName: 'tokenURI',
      args: [tokenId],
    });

    // Parse data URI or fetch
    if (uri.startsWith('data:application/json')) {
      const json = JSON.parse(atob(uri.split(',')[1]));
      return json.name || `Agent #${tokenId}`;
    }
    
    return `Agent #${tokenId}`;
  } catch {
    return `Agent #${tokenId}`;
  }
}

// Format timestamp
export function formatTime(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString();
}

// Format relative time
export function formatRelativeTime(timestamp: bigint): string {
  const now = Date.now();
  const time = Number(timestamp) * 1000;
  const diff = now - time;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// Score color
export function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e'; // green
  if (score >= 60) return '#3b82f6'; // blue
  if (score >= 40) return '#eab308'; // yellow
  return '#ef4444'; // red
}
