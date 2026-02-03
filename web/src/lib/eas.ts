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
  features: number;
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
    return {
      tokenId: Number(decoded[0]?.value?.value || 0),
      registry: decoded[1]?.value?.value || '',
      timestamp: Number(decoded[2]?.value?.value || 0),
      score: Number(decoded[3]?.value?.value || 0),
      features: Number(decoded[4]?.value?.value || 0),
    };
  } catch {
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
