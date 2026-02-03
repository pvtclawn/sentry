/**
 * Sentry API Server
 * 
 * Provides trust queries for ERC-8004 agents with x402 payment support.
 * 
 * Endpoints:
 * - GET /health - Health check
 * - GET /agent/:id - Get agent trust data (free preview)
 * - GET /agent/:id/full - Full trust report (x402 paid)
 * - GET /stats - Registry statistics
 */

import { loadAgentsData, loadState } from "./services/state";
import type { AgentData } from "./types";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3402;
const WALLET_ADDRESS = "0xeC6cd01f6fdeaEc192b88Eb7B62f5E72D65719Af";

// x402 pricing (in USDC, 6 decimals)
const PRICE_FULL_REPORT = "10000"; // 0.01 USDC per full report

interface PaymentRequirement {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra?: Record<string, unknown>;
}

function createPaymentRequired(resource: string, description: string): PaymentRequirement {
  return {
    scheme: "exact",
    network: "base",
    maxAmountRequired: PRICE_FULL_REPORT,
    resource,
    description,
    payTo: WALLET_ADDRESS,
    maxTimeoutSeconds: 300,
    asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
  };
}

function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Payment",
      ...headers,
    },
  });
}

function payment402Response(requirement: PaymentRequirement): Response {
  const encoded = Buffer.from(JSON.stringify(requirement)).toString("base64");
  return new Response(JSON.stringify({ error: "Payment Required", requirement }), {
    status: 402,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "X-Payment-Required": encoded,
    },
  });
}

// Simplified preview - just basic info
function getAgentPreview(agent: AgentData) {
  return {
    tokenId: agent.tokenId,
    name: agent.name,
    score: agent.score,
    attested: !!agent.attestationId,
    probedAt: agent.probedAt,
    // Tease the full data
    _note: "Full report requires x402 payment. See X-Payment-Required header on /agent/:id/full",
  };
}

// Full report - all signals
function getAgentFullReport(agent: AgentData) {
  return {
    tokenId: agent.tokenId,
    name: agent.name,
    description: agent.description,
    owner: agent.owner,
    score: agent.score,
    signals: agent.signals,
    attestationId: agent.attestationId,
    probedAt: agent.probedAt,
    attestationLink: agent.attestationId 
      ? `https://base.easscan.org/attestation/view/${agent.attestationId}`
      : null,
  };
}

const server = Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    
    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Payment",
        },
      });
    }
    
    // Health check
    if (path === "/health" || path === "/") {
      return jsonResponse({
        status: "ok",
        service: "Base Agent Sentry",
        version: "0.1.0",
        operator: "PrivateClawn",
        endpoints: {
          "/agent/:id": "Free preview of agent trust data",
          "/agent/:id/full": "Full trust report (x402 payment required)",
          "/stats": "Registry statistics",
        },
      });
    }
    
    // Stats
    if (path === "/stats") {
      const state = loadState();
      const agentsData = loadAgentsData();
      
      return jsonResponse({
        totalAgents: Object.keys(agentsData.agents).length,
        attestedAgents: state.attestedAgents.length,
        lastScannedBlock: state.lastScannedBlock,
        schema: "0x8a333ad4136176b36dd826d3f8fa5ef796b1edc923f878676cabbac8d7c84f8d",
        operator: {
          name: "PrivateClawn",
          wallet: WALLET_ADDRESS,
          ens: "pvtclawn.base.eth",
        },
      });
    }
    
    // Agent preview (free)
    const previewMatch = path.match(/^\/agent\/(\d+)$/);
    if (previewMatch) {
      const agentId = previewMatch[1];
      const agentsData = loadAgentsData();
      const agent = agentsData.agents[agentId];
      
      if (!agent) {
        return jsonResponse({ error: "Agent not found" }, 404);
      }
      
      return jsonResponse(getAgentPreview(agent));
    }
    
    // Agent full report (paid)
    const fullMatch = path.match(/^\/agent\/(\d+)\/full$/);
    if (fullMatch) {
      const agentId = fullMatch[1];
      const agentsData = loadAgentsData();
      const agent = agentsData.agents[agentId];
      
      if (!agent) {
        return jsonResponse({ error: "Agent not found" }, 404);
      }
      
      // Check for x402 payment header
      const paymentHeader = req.headers.get("X-Payment");
      
      if (!paymentHeader) {
        // Return 402 with payment requirement
        const requirement = createPaymentRequired(
          `/agent/${agentId}/full`,
          `Full trust report for agent #${agentId} (${agent.name})`
        );
        return payment402Response(requirement);
      }
      
      // TODO: Verify payment with facilitator
      // For now, accept any payment header as valid (demo mode)
      // In production: POST to facilitator's /verify endpoint
      
      console.log(`[x402] Payment received for agent #${agentId}`);
      
      return jsonResponse(getAgentFullReport(agent));
    }
    
    // 404
    return jsonResponse({ error: "Not found" }, 404);
  },
});

console.log(`🦞🛡️ Base Agent Sentry API`);
console.log(`==========================`);
console.log(`Listening on http://localhost:${PORT}`);
console.log(`Wallet: ${WALLET_ADDRESS}`);
console.log(`\nEndpoints:`);
console.log(`  GET /health     - Health check`);
console.log(`  GET /stats      - Registry statistics`);
console.log(`  GET /agent/:id  - Agent preview (free)`);
console.log(`  GET /agent/:id/full - Full report (x402 paid)`);
