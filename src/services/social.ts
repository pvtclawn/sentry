/**
 * Social Poster - X and Farcaster integration
 */

import { readFileSync } from "fs";
import { join } from "path";
import { TwitterApi } from "twitter-api-v2";
import { SOCIAL } from "../config";

const VAULT_PATH = join(import.meta.dir, "../../../../.vault");

interface Secrets {
  X_CONSUMER_KEY: string;
  X_CONSUMER_KEY_SECRET: string;
  X_ACCESS_TOKEN: string;
  X_ACCESS_SECRET: string;
  NEYNAR_API_KEY: string;
  NEYNAR_SIGNER_UUID: string;
}

function getSecrets(): Secrets {
  const secretsPath = join(VAULT_PATH, "secrets.json");
  return JSON.parse(readFileSync(secretsPath, "utf8"));
}

/**
 * Post to X (Twitter)
 */
export async function postToX(text: string): Promise<{ id: string } | null> {
  const secrets = getSecrets();
  
  const client = new TwitterApi({
    appKey: secrets.X_CONSUMER_KEY,
    appSecret: secrets.X_CONSUMER_KEY_SECRET,
    accessToken: secrets.X_ACCESS_TOKEN,
    accessSecret: secrets.X_ACCESS_SECRET,
  });
  
  try {
    const result = await client.v2.tweet(text);
    console.log(`✅ Posted to X: ${result.data.id}`);
    return { id: result.data.id };
  } catch (e) {
    console.log(`❌ X error: ${(e as Error).message}`);
    return null;
  }
}

/**
 * Post to Farcaster via Neynar
 */
export async function postToFarcaster(text: string): Promise<{ hash: string } | null> {
  const secrets = getSecrets();
  
  try {
    const response = await fetch("https://api.neynar.com/v2/farcaster/cast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api_key": secrets.NEYNAR_API_KEY,
      },
      body: JSON.stringify({
        signer_uuid: secrets.NEYNAR_SIGNER_UUID,
        text,
      }),
    });
    
    const data = await response.json() as { success: boolean; cast?: { hash: string } };
    
    if (data.success && data.cast) {
      console.log(`✅ Posted to Farcaster: ${data.cast.hash}`);
      return { hash: data.cast.hash };
    } else {
      console.log(`❌ Farcaster error:`, data);
      return null;
    }
  } catch (e) {
    console.log(`❌ Farcaster error: ${(e as Error).message}`);
    return null;
  }
}

/**
 * Post to both platforms
 */
export async function postUpdate(text: string): Promise<void> {
  await Promise.all([
    postToX(text),
    postToFarcaster(text),
  ]);
}
