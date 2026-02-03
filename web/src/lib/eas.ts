import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

// EAS contract on Base
export const EAS_ADDRESS = '0x4200000000000000000000000000000000000021';
export const SCHEMA_UID = '0x8a333ad4136176b36dd826d3f8fa5ef796b1edc923f878676cabbac8d7c84f8d';
export const ATTESTER = '0xeC6cd01f6fdeaEc192b88Eb7B62f5E72D65719Af';

// ERC-8004 Registry on Ethereum Mainnet
export const REGISTRY_ADDRESS = '0x8004A169FB4a3325136EB29fA0ceB6d2e539a432';

export const baseClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

// GraphQL endpoint for EAS
export const EAS_GRAPHQL = 'https://base.easscan.org/graphql';

export interface Attestation {
  id: string;
  attester: string;
  recipient: string;
  time: number;
  decodedDataJson: string;
}

export interface AgentAttestation {
  tokenId: number;
  registry: string;
  timestamp: number;
  score: number;
  signals: string;
}

function parseValue(val: unknown): number | string {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    if (obj.hex) return parseInt(obj.hex as string, 16);
    if (obj.value !== undefined) return parseValue(obj.value);
  }
  return 0;
}

export async function fetchAttestations(): Promise<Attestation[]> {
  const query = `{
    attestations(
      where: { 
        attester: { equals: "${ATTESTER}" },
        schemaId: { equals: "${SCHEMA_UID}" }
      }
      orderBy: [{ time: desc }]
      take: 100
    ) {
      id
      attester
      recipient
      time
      decodedDataJson
    }
  }`;

  const response = await fetch(EAS_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();
  return data.data?.attestations || [];
}

export function decodeAttestation(attestation: Attestation): AgentAttestation | null {
  try {
    const decoded = JSON.parse(attestation.decodedDataJson);
    
    // Fields: agentId, registry, verifiedAt, score, signals
    const agentId = decoded.find((f: {name: string}) => f.name === 'agentId');
    const registry = decoded.find((f: {name: string}) => f.name === 'registry');
    const verifiedAt = decoded.find((f: {name: string}) => f.name === 'verifiedAt');
    const score = decoded.find((f: {name: string}) => f.name === 'score');
    const signals = decoded.find((f: {name: string}) => f.name === 'signals');

    return {
      tokenId: Number(parseValue(agentId?.value?.value)),
      registry: String(parseValue(registry?.value?.value) || REGISTRY_ADDRESS),
      timestamp: Number(parseValue(verifiedAt?.value?.value)),
      score: Number(parseValue(score?.value?.value)),
      signals: String(parseValue(signals?.value?.value) || '0x0'),
    };
  } catch (e) {
    console.error('Decode error:', e);
    return null;
  }
}

export async function getAttestationCount(): Promise<number> {
  const query = `{
    aggregateAttestation(
      where: { 
        attester: { equals: "${ATTESTER}" },
        schemaId: { equals: "${SCHEMA_UID}" }
      }
    ) {
      _count {
        id
      }
    }
  }`;

  const response = await fetch(EAS_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();
  return data.data?.aggregateAttestation?._count?.id || 0;
}
