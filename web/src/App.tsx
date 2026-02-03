import { useState, useEffect } from 'react';
import './App.css';
import { fetchAttestations, decodeAttestation, getAttestationCount, ATTESTER, SCHEMA_UID, REGISTRY_ADDRESS, type Attestation, type AgentAttestation } from './lib/eas';

interface AgentWithMeta extends Attestation {
  decoded: AgentAttestation | null;
  name?: string;
}

// Fetch agent name from ERC-8004 registry
async function fetchAgentName(tokenId: number): Promise<string> {
  try {
    const response = await fetch(`https://ethereum-rpc.publicnode.com`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{
          to: REGISTRY_ADDRESS,
          data: `0xc87b56dd${tokenId.toString(16).padStart(64, '0')}` // tokenURI(uint256)
        }, 'latest']
      })
    });
    const result = await response.json();
    if (result.result && result.result !== '0x') {
      // Decode the URI and fetch metadata
      const hex = result.result.slice(2);
      const offset = parseInt(hex.slice(0, 64), 16) * 2;
      const length = parseInt(hex.slice(offset, offset + 64), 16);
      const uriHex = hex.slice(offset + 64, offset + 64 + length * 2);
      const uri = decodeURIComponent(uriHex.replace(/[0-9a-f]{2}/g, '%$&'));
      
      if (uri.startsWith('data:application/json')) {
        const json = JSON.parse(uri.split(',')[1]);
        return json.name || `Agent #${tokenId}`;
      } else if (uri.startsWith('http')) {
        const meta = await fetch(uri).then(r => r.json());
        return meta.name || `Agent #${tokenId}`;
      }
    }
  } catch (e) {
    console.error('Failed to fetch agent name:', e);
  }
  return `Agent #${tokenId}`;
}

function App() {
  const [count, setCount] = useState<number>(0);
  const [attestations, setAttestations] = useState<AgentWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [totalCount, rawAttestations] = await Promise.all([
          getAttestationCount(),
          fetchAttestations(),
        ]);
        setCount(totalCount);
        
        // Decode and add basic data first
        const decoded = rawAttestations.map(a => ({
          ...a,
          decoded: decodeAttestation(a),
        }));
        setAttestations(decoded);
        
        // Then fetch names in background (first 20 only to avoid rate limits)
        const withNames = await Promise.all(
          decoded.slice(0, 20).map(async (a) => {
            if (a.decoded?.tokenId) {
              const name = await fetchAgentName(a.decoded.tokenId);
              return { ...a, name };
            }
            return a;
          })
        );
        setAttestations([...withNames, ...decoded.slice(20)]);
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
              <span className="text-gray-300">80-100: Excellent</span>
              <span className="text-gray-500">— Full services, active, well-documented</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-gray-300">60-79: Good</span>
              <span className="text-gray-500">— Most signals present</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-gray-300">40-59: Basic</span>
              <span className="text-gray-500">— Limited metadata</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-500"></span>
              <span className="text-gray-300">0-39: Minimal</span>
              <span className="text-gray-500">— Needs improvement</span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Attestations */}
      <section className="relative max-w-6xl mx-auto px-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Recent Attestations</h2>
          <span className="text-gray-500 text-sm">{attestations.length} shown</span>
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
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    {/* Agent info */}
                    <div className="min-w-[180px]">
                      <p className="font-semibold text-white truncate">
                        {a.name || `Agent #${a.decoded?.tokenId || '?'}`}
                      </p>
                      <span className="text-gray-500 text-xs font-mono">#{a.decoded?.tokenId}</span>
                    </div>
                    
                    {/* Score badge */}
                    <div className={`px-4 py-2 rounded-lg border ${scoreBg(a.decoded?.score || 0)}`}>
                      <span className={`font-bold text-xl bg-gradient-to-r ${scoreColor(a.decoded?.score || 0)} bg-clip-text text-transparent`}>
                        {a.decoded?.score || 0}
                      </span>
                      <span className="text-gray-400 text-sm ml-1">/100</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {/* Timestamp */}
                    <span className="text-gray-500 text-sm hidden md:block">
                      {new Date(a.time * 1000).toLocaleString()}
                    </span>
                    
                    {/* View link */}
                    <a
                      href={`https://base.easscan.org/attestation/view/${a.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
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
