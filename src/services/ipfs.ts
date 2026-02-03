/**
 * IPFS Service - Upload probe data to IPFS via HTTP API
 * Supports multiple providers: Pinata, Filebase, or local IPFS node
 */

interface ProbeData {
  agentId: string;
  owner: string;
  score: number;
  signals: Record<string, unknown>;
  probedAt: string;
  schemaUid: string;
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
 * Upload JSON to IPFS via Filebase S3-compatible API
 */
export async function uploadToFilebase(data: ProbeData): Promise<string> {
  const accessKey = process.env.FILEBASE_ACCESS_KEY;
  const secretKey = process.env.FILEBASE_SECRET_KEY;
  const bucket = process.env.FILEBASE_BUCKET || "sentry-probes";
  
  if (!accessKey || !secretKey) {
    throw new Error("FILEBASE_ACCESS_KEY and FILEBASE_SECRET_KEY required");
  }
  
  // Filebase uses S3-compatible API
  const key = `probe-${data.agentId}-${Date.now()}.json`;
  const body = JSON.stringify(data, null, 2);
  
  // Using fetch with AWS Signature v4 is complex, use SDK instead
  const { S3 } = await import("@filebase/sdk");
  const s3 = new S3({ accessKeyId: accessKey, secretAccessKey: secretKey });
  
  const result = await s3.putObject({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: "application/json",
  });
  
  // CID is in the response metadata
  const cid = result.Metadata?.["x-amz-meta-cid"] || result.ETag?.replace(/"/g, "");
  return cid || "unknown";
}

/**
 * Generic upload function - tries available providers
 */
export async function uploadProbeToIPFS(data: ProbeData): Promise<string> {
  // Try Pinata first (simpler API)
  if (process.env.PINATA_API_KEY) {
    return uploadToPinata(data);
  }
  
  // Fall back to Filebase
  if (process.env.FILEBASE_ACCESS_KEY) {
    return uploadToFilebase(data);
  }
  
  throw new Error("No IPFS provider configured. Set PINATA_API_KEY or FILEBASE_ACCESS_KEY");
}

/**
 * Get IPFS gateway URL for a CID
 */
export function getIPFSUrl(cid: string): string {
  // Use multiple gateways for redundancy
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
}

/**
 * Alternative gateways
 */
export function getIPFSUrls(cid: string): string[] {
  return [
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://w3s.link/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://dweb.link/ipfs/${cid}`,
  ];
}
