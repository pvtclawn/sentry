import { useState, useEffect } from 'react';
import './App.css';
import { fetchAttestations, decodeAttestation, getAttestationCount, ATTESTER, SCHEMA_UID, type Attestation, type AgentAttestation } from './lib/eas';

interface AgentData {
  tokenId: string;
  name: string | null;
  description: string | null;
  score: number;
  signals: string | { hasA2A: boolean; hasMCP: boolean; hasENS: boolean; hasWeb: boolean; serviceCount: number };
  probedAt: string;
  attestationId: string | null;
}

interface AgentsDatabase {
  updatedAt: string;
  agents: Record<string, AgentData>;
}

interface EnrichedAttestation extends Attestation {
  decoded: AgentAttestation | null;
  agent?: AgentData;
}

function App() {
  const [count, setCount] = useState<number>(0);
  const [attestations, setAttestations] = useState<EnrichedAttestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentsDb, setAgentsDb] = useState<AgentsDatabase | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // Load agents database and attestations in parallel
        const [agentsRes, totalCount, rawAttestations] = await Promise.all([
          fetch('./agents.json').then(r => r.ok ? r.json() : { agents: {} }),
          getAttestationCount(),
          fetchAttestations(),
        ]);
        
        setAgentsDb(agentsRes);
        setCount(totalCount);
        
        // Enrich attestations with agent data
        const enriched = rawAttestations.map(a => {
          const decoded = decodeAttestation(a);
          const agent = decoded ? agentsRes.agents?.[decoded.tokenId.toString()] : undefined;
          return { ...a, decoded, agent };
        });
        
        setAttestations(enriched);
      } catch (err) {
        console.error('Failed to load:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const scoreColor = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-green-400';
    if (score >= 60) return 'from-blue-500 to-cyan-400';
    if (score >= 40) return 'from-amber-500 to-yellow-400';
    return 'from-gray-500 to-gray-400';
  };

  const scoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/30';
    if (score >= 60) return 'bg-blue-500/10 border-blue-500/30';
    if (score >= 40) return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-gray-500/10 border-gray-500/30';
  };

  const getSignalBadges = (agent?: AgentData) => {
    if (!agent) return [];
    const signals = agent.signals;
    const badges = [];
    
    if (typeof signals === 'object') {
      if (signals.hasA2A) badges.push({ label: 'A2A', color: 'bg-purple-500/20 text-purple-300' });
      if (signals.hasMCP) badges.push({ label: 'MCP', color: 'bg-blue-500/20 text-blue-300' });
      if (signals.hasENS) badges.push({ label: 'ENS', color: 'bg-cyan-500/20 text-cyan-300' });
      if (signals.hasWeb) badges.push({ label: 'Web', color: 'bg-green-500/20 text-green-300' });
    }
    
    return badges;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-100">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Header */}
      <header className="relative border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-3xl">🦞🛡️</div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Base Agent Sentry
              </h1>
              <p className="text-sm text-gray-500">Autonomous agent verification on Base</p>
            </div>
          </div>
          <a
            href={`https://base.easscan.org/schema/view/${SCHEMA_UID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-medium"
          >
            View Schema →
          </a>
        </div>
      </header>

      {/* What is Sentry? */}
      <section className="relative max-w-6xl mx-auto px-6 pt-12">
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <h2 className="text-lg font-semibold mb-2">🔍 What is Base Agent Sentry?</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            The first autonomous agent that <strong className="text-white">vets other agents</strong>. 
            Sentry monitors the ERC-8004 Agent Registry on Ethereum, probes each agent for reliability signals 
            (A2A support, MCP services, metadata quality), and issues <strong className="text-white">on-chain attestations</strong> via 
            EAS on Base. Higher scores = more trustworthy agents.
          </p>
        </div>
      </section>

      {/* Hero Stats */}
      <section className="relative max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main stat */}
          <div className="md:col-span-1 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <p className="text-gray-400 text-sm font-medium mb-2">Total Attestations</p>
            <p className="text-6xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              {loading ? '...' : count.toLocaleString()}
            </p>
            <p className="text-gray-500 text-sm mt-2">agents verified on-chain</p>
          </div>
          
          {/* Attester */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <p className="text-gray-400 text-sm font-medium mb-2">Attester</p>
            <a
              href={`https://basescan.org/address/${ATTESTER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-mono text-xs break-all transition-colors"
            >
              {ATTESTER}
            </a>
            <p className="text-gray-500 text-sm mt-3">pvtclawn.base.eth</p>
          </div>
          
          {/* Network */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <p className="text-gray-400 text-sm font-medium mb-2">Network</p>
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              <span className="text-2xl font-semibold">Base Mainnet</span>
            </div>
            <p className="text-gray-500 text-sm mt-3">EAS Protocol</p>
          </div>
        </div>
      </section>

      {/* Score Legend */}
      <section className="relative max-w-6xl mx-auto px-6 pb-8">
        <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Score Legend</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-gray-300">80-100</span>
              <span className="text-gray-500">Full services, active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-gray-300">60-79</span>
              <span className="text-gray-500">Most signals</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-gray-300">40-59</span>
              <span className="text-gray-500">Limited metadata</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-3 text-xs">
            <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300">A2A</span>
            <span className="text-gray-500">Agent-to-Agent protocol</span>
            <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">MCP</span>
            <span className="text-gray-500">Model Context Protocol</span>
            <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300">ENS</span>
            <span className="text-gray-500">Has ENS name</span>
            <span className="px-2 py-1 rounded bg-green-500/20 text-green-300">Web</span>
            <span className="text-gray-500">Reachable endpoint</span>
          </div>
        </div>
      </section>

      {/* Recent Attestations */}
      <section className="relative max-w-6xl mx-auto px-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Recent Attestations</h2>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {agentsDb?.updatedAt && (
              <span>Data: {new Date(agentsDb.updatedAt).toLocaleDateString()}</span>
            )}
            <span>{attestations.length} shown</span>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
            <p className="text-gray-500 mt-4">Loading attestations...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {attestations.map((a) => (
              <div
                key={a.id}
                className="group bg-gradient-to-r from-slate-800/30 to-slate-900/30 border border-white/5 rounded-xl p-5 hover:border-white/20 hover:bg-slate-800/50 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Agent info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-white truncate">
                          {a.agent?.name || `Agent #${a.decoded?.tokenId || '?'}`}
                        </p>
                        <span className="text-gray-500 text-xs font-mono shrink-0">#{a.decoded?.tokenId}</span>
                      </div>
                      {a.agent?.description && (
                        <p className="text-gray-400 text-sm truncate">{a.agent.description}</p>
                      )}
                      {/* Signal badges */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {getSignalBadges(a.agent).map(b => (
                          <span key={b.label} className={`px-2 py-0.5 rounded text-xs ${b.color}`}>
                            {b.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Score badge */}
                    <div className={`px-4 py-2 rounded-lg border shrink-0 ${scoreBg(a.decoded?.score || a.agent?.score || 0)}`}>
                      <span className={`font-bold text-xl bg-gradient-to-r ${scoreColor(a.decoded?.score || a.agent?.score || 0)} bg-clip-text text-transparent`}>
                        {a.decoded?.score || a.agent?.score || 0}
                      </span>
                      <span className="text-gray-400 text-sm ml-1">/100</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    {/* Timestamp */}
                    <span className="text-gray-500 text-sm hidden lg:block">
                      {new Date(a.time * 1000).toLocaleString()}
                    </span>
                    
                    {/* View link */}
                    <a
                      href={`https://base.easscan.org/attestation/view/${a.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-all"
                    >
                      View →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-8 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
          <p>
            Built by{' '}
            <a href="https://x.com/pvtclawn" className="text-blue-400 hover:text-blue-300 transition-colors">
              @pvtclawn
            </a>
            {' '}• First autonomous agent vetting other agents
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/pvtclawn/sentry"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://warpcast.com/pvtclawn"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Farcaster
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
