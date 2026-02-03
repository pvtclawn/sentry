/**
 * IPFS Service - Upload probe data to IPFS
 * Primary: web3.storage (Storacha) via w3 CLI
 * Fallback: Pinata or Filebase HTTP APIs
 */

import { execSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

interface ProbeData {
  agentId: string;
  owner: string;
  score: number;
  signals: Record<string, unknown>;
  probedAt: string;
  schemaUid: string;
}

/**
 * Upload JSON to IPFS via web3.storage (w3 CLI)
 * Uses the pre-configured space from `w3 space use`
 */
export async function uploadToW3Storage(data: ProbeData): Promise<string> {
  const tmpFile = join(tmpdir(), `sentry-probe-${data.agentId}-${Date.now()}.json`);
  
  try {
    // Write data to temp file
    writeFileSync(tmpFile, JSON.stringify(data, null, 2));
    
    // Upload via w3 CLI
    const result = execSync(`npx w3 up "${tmpFile}" --json 2>/dev/null`, {
      encoding: "utf-8",
      timeout: 60000,
    });
    
    // Parse the JSON output to get the CID
    const output = JSON.parse(result.trim());
    const cid = output.root?.["/"] || output.root;
    
    if (!cid) {
      // Fallback: extract CID from text output
      const match = result.match(/bafy[a-zA-Z0-9]+/);
      if (match) return match[0];
      throw new Error("Could not parse CID from w3 output");
    }
    
    return cid;
  } finally {
    // Cleanup temp file
    try { unlinkSync(tmpFile); } catch {}
  }
}

/**
 * Upload JSON to IPFS via Pinata HTTP API
 */
export async function uploadToPinata(data: ProbeData): Promise<string> {
  const apiKey = process.env.PINATA_API_KEY;
  const secretKey = process.env.PINATA_SECRET_KEY;
  
  if (!apiKey || !secretKey) {
    throw new Error("PINATA_API_KEY and PINATA_SECRET_KEY required");
  }
  
  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "pinata_api_key": apiKey,
      "pinata_secret_api_key": secretKey,
    },
    body: JSON.stringify({
      pinataContent: data,
      pinataMetadata: {
        name: `sentry-probe-${data.agentId}`,
      },
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Pinata error: ${response.status} ${await response.text()}`);
  }
  
  const result = await response.json() as { IpfsHash: string };
  return result.IpfsHash;
}

/**
 * Generic upload function - tries available providers
 */
export async function uploadProbeToIPFS(data: ProbeData): Promise<string> {
  // Try web3.storage first (free, no API key needed if logged in)
  try {
    return await uploadToW3Storage(data);
  } catch (e) {
    console.log("  ⚠️ w3 upload failed, trying fallback:", (e as Error).message);
  }
  
  // Fall back to Pinata
  if (process.env.PINATA_API_KEY) {
    return uploadToPinata(data);
  }
  
  throw new Error("IPFS upload failed: no provider available");
}

/**
 * Get IPFS gateway URL for a CID
 */
export function getIPFSUrl(cid: string): string {
  return `https://w3s.link/ipfs/${cid}`;
}

/**
 * Alternative gateways
 */
export function getIPFSUrls(cid: string): string[] {
  return [
    `https://w3s.link/ipfs/${cid}`,
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://dweb.link/ipfs/${cid}`,
  ];
}
