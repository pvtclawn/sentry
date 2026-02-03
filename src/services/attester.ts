/**
 * EAS Attester - Issues on-chain attestations on Base
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { EAS_ADDRESS, SCHEMA_UID, REGISTRY_ADDRESS, EXPLORERS } from "../config";
import type { AgentProbe, AttestationResult } from "../types";
import { calculateScore, packSignals } from "./prober";
import { uploadProbeToIPFS, getIPFSUrl } from "./ipfs";
import { registerCID } from "./ipfs-registry";

const VAULT_PATH = join(import.meta.dir, "../../../../.vault");
const FOUNDRY_PATH = join(process.env.HOME!, ".foundry/bin");

/**
 * Get wallet password from vault
 */
function getWalletPassword(): string {
  const secretsPath = join(VAULT_PATH, "secrets.json");
  const secrets = JSON.parse(readFileSync(secretsPath, "utf8"));
  return secrets.WALLET_PASSWORD;
}

/**
 * Run cast command with wallet
 */
function runCast(args: string[]): string {
  const password = getWalletPassword();
  const pwFile = "/tmp/castpw";
  writeFileSync(pwFile, password);
  
  try {
    const cmd = `${FOUNDRY_PATH}/cast ${args.join(" ")} --account clawn --password-file ${pwFile}`;
    const result = execSync(cmd, { encoding: "utf8", timeout: 60000 });
    return result;
  } finally {
    if (existsSync(pwFile)) {
      execSync(`rm ${pwFile}`);
    }
  }
}

/**
 * Attest an agent on-chain via EAS
 */
export async function attestAgent(probe: AgentProbe): Promise<AttestationResult> {
  const score = calculateScore(probe.signals);
  const signals = packSignals(probe.signals);
  const verifiedAt = Math.floor(Date.now() / 1000);
  
  console.log(`🏅 Attesting agent #${probe.agentId} (score: ${score})...`);
  
  // Upload probe data to IPFS
  let ipfsCid: string | null = null;
  try {
    console.log(`  📤 Uploading to IPFS...`);
    ipfsCid = await uploadProbeToIPFS({
      agentId: probe.agentId,
      owner: probe.owner,
      score,
      signals: probe.signals as Record<string, unknown>,
      probedAt: probe.probedAt,
      schemaUid: SCHEMA_UID,
    });
    console.log(`  ✅ IPFS: ${getIPFSUrl(ipfsCid)}`);
  } catch (e) {
    console.log(`  ⚠️ IPFS upload failed: ${(e as Error).message}`);
  }
  
  // Encode attestation data using cast without extra flags
  const password = getWalletPassword();
  const pwFile = "/tmp/castpw";
  writeFileSync(pwFile, password);
  
  try {
    // Step 1: Encode the data
    const encodeCmd = `${FOUNDRY_PATH}/cast abi-encode "f(uint256,address,uint64,uint8,bytes32)" ${probe.agentId} ${REGISTRY_ADDRESS} ${verifiedAt} ${score} ${signals}`;
    const data = execSync(encodeCmd, { encoding: "utf8", timeout: 10000 }).trim();
    
    // Step 2: Build attestation struct
    const attestStruct = `(${SCHEMA_UID},(0x0000000000000000000000000000000000000000,0,true,0x0000000000000000000000000000000000000000000000000000000000000000,${data},0))`;
    
    // Step 3: Send attestation
    const sendCmd = `${FOUNDRY_PATH}/cast send ${EAS_ADDRESS} "attest((bytes32,(address,uint64,bool,bytes32,bytes,uint256)))(bytes32)" "${attestStruct}" --rpc-url https://mainnet.base.org --account clawn --password-file ${pwFile}`;
    const result = execSync(sendCmd, { encoding: "utf8", timeout: 60000 });
    
    // Parse tx hash from output
    const txMatch = result.match(/transactionHash\s+(\S+)/);
    const txHash = txMatch?.[1] ?? "unknown";
    
    // Parse attestation UID from logs
    const uidMatch = result.match(/"data":"(0x[a-f0-9]+)"/);
    const attestationUID = uidMatch?.[1] ?? "unknown";
    
    console.log(`✅ Attested! TX: ${EXPLORERS.basescan}/tx/${txHash}`);
    
    // Register IPFS CID if we have one
    if (ipfsCid && attestationUID !== "unknown") {
      registerCID(attestationUID, probe.agentId, ipfsCid);
      console.log(`  📝 Registered CID: ${ipfsCid}`);
    }
    
    return {
      agentId: probe.agentId,
      txHash,
      attestationUID,
      score,
      timestamp: verifiedAt,
      ipfsCid: ipfsCid ?? undefined,
    };
  } finally {
    if (existsSync(pwFile)) {
      execSync(`rm ${pwFile}`);
    }
  }
}

/**
 * Format attestation link for sharing
 */
export function formatAttestationLink(result: AttestationResult): string {
  return `${EXPLORERS.easscan}/attestation/view/${result.attestationUID}`;
}

/**
 * Format transaction link
 */
export function formatTxLink(txHash: string): string {
  return `${EXPLORERS.basescan}/tx/${txHash}`;
}
