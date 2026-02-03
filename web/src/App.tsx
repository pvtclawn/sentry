import { useState, useEffect, useMemo } from 'react';
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

type SortOption = 'newest' | 'oldest' | 'score-high' | 'score-low' | 'name';
type ScoreFilter = 'all' | '80+' | '60+' | '40+';

function App() {
  const [count, setCount] = useState<number>(0);
  const [attestations, setAttestations] = useState<EnrichedAttestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentsDb, setAgentsDb] = useState<AgentsDatabase | null>(null);
  
  // Search & filter state
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('all');
  const [signalFilter, setSignalFilter] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [agentsRes, totalCount, rawAttestations] = await Promise.all([
          fetch('./agents.json').then(r => r.ok ? r.json() : { agents: {} }),
          getAttestationCount(),
          fetchAttestations(),
        ]);
        
        setAgentsDb(agentsRes);
        setCount(totalCount);
        
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

  // Filter and sort attestations
  const filteredAttestations = useMemo(() => {
    let result = [...attestations];
    
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a => {
        const name = a.agent?.name?.toLowerCase() || '';
        const desc = a.agent?.description?.toLowerCase() || '';
        const id = a.decoded?.tokenId?.toString() || '';
        return name.includes(q) || desc.includes(q) || id.includes(q);
      });
    }
    
    // Score filter
    if (scoreFilter !== 'all') {
      const minScore = parseInt(scoreFilter);
      result = result.filter(a => (a.decoded?.score || a.agent?.score || 0) >= minScore);
    }
    
    // Signal filter
    if (signalFilter.length > 0) {
      result = result.filter(a => {
        const signals = a.agent?.signals;
        if (typeof signals !== 'object') return false;
        return signalFilter.every(f => {
          if (f === 'A2A') return signals.hasA2A;
          if (f === 'MCP') return signals.hasMCP;
          if (f === 'ENS') return signals.hasENS;
          if (f === 'Web') return signals.hasWeb;
          return false;
        });
      });
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return b.time - a.time;
        case 'oldest': return a.time - b.time;
        case 'score-high': return (b.decoded?.score || b.agent?.score || 0) - (a.decoded?.score || a.agent?.score || 0);
        case 'score-low': return (a.decoded?.score || a.agent?.score || 0) - (b.decoded?.score || b.agent?.score || 0);
        case 'name': return (a.agent?.name || 'zzz').localeCompare(b.agent?.name || 'zzz');
        default: return 0;
      }
    });
    
    return result;
  }, [attestations, search, sortBy, scoreFilter, signalFilter]);

  const toggleSignalFilter = (signal: string) => {
    setSignalFilter(prev => 
      prev.includes(signal) ? prev.filter(s => s !== signal) : [...prev, signal]
    );
  };

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
          <div className="md:col-span-1 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <p className="text-gray-400 text-sm font-medium mb-2">Total Attestations</p>
            <p className="text-6xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              {loading ? '...' : count.toLocaleString()}
            </p>
            <p className="text-gray-500 text-sm mt-2">agents verified on-chain</p>
          </div>
          
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

      {/* Search & Filters */}
      <section className="relative max-w-6xl mx-auto px-6 pb-6">
        <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-white/5 rounded-xl p-5">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, description, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="score-high">Score: High → Low</option>
              <option value="score-low">Score: Low → High</option>
              <option value="name">Name A-Z</option>
            </select>
            
            {/* Score filter */}
            <select
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value as ScoreFilter)}
              className="px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              <option value="all">All scores</option>
              <option value="80+">80+ Excellent</option>
              <option value="60+">60+ Good</option>
              <option value="40+">40+ Basic</option>
            </select>
          </div>
          
          {/* Signal filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-gray-500 text-sm mr-2">Filter by signals:</span>
            {['A2A', 'MCP', 'ENS', 'Web'].map(signal => (
              <button
                key={signal}
                onClick={() => toggleSignalFilter(signal)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  signalFilter.includes(signal)
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700'
                }`}
              >
                {signal}
              </button>
            ))}
            {(search || scoreFilter !== 'all' || signalFilter.length > 0) && (
              <button
                onClick={() => { setSearch(''); setScoreFilter('all'); setSignalFilter([]); }}
                className="px-3 py-1 rounded-lg text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Recent Attestations */}
      <section className="relative max-w-6xl mx-auto px-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {search || scoreFilter !== 'all' || signalFilter.length > 0 ? 'Filtered Results' : 'Recent Attestations'}
          </h2>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {agentsDb?.updatedAt && (
              <span className="hidden md:inline">Data: {new Date(agentsDb.updatedAt).toLocaleDateString()}</span>
            )}
            <span>{filteredAttestations.length} of {attestations.length}</span>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
            <p className="text-gray-500 mt-4">Loading attestations...</p>
          </div>
        ) : filteredAttestations.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No agents match your filters</p>
            <button
              onClick={() => { setSearch(''); setScoreFilter('all'); setSignalFilter([]); }}
              className="mt-4 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAttestations.map((a) => (
              <div
                key={a.id}
                className="group bg-gradient-to-r from-slate-800/30 to-slate-900/30 border border-white/5 rounded-xl p-5 hover:border-white/20 hover:bg-slate-800/50 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
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
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {getSignalBadges(a.agent).map(b => (
                          <span key={b.label} className={`px-2 py-0.5 rounded text-xs ${b.color}`}>
                            {b.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className={`px-4 py-2 rounded-lg border shrink-0 ${scoreBg(a.decoded?.score || a.agent?.score || 0)}`}>
                      <span className={`font-bold text-xl bg-gradient-to-r ${scoreColor(a.decoded?.score || a.agent?.score || 0)} bg-clip-text text-transparent`}>
                        {a.decoded?.score || a.agent?.score || 0}
                      </span>
                      <span className="text-gray-400 text-sm ml-1">/100</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-gray-500 text-sm hidden lg:block">
                      {new Date(a.time * 1000).toLocaleString()}
                    </span>
                    
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
            <a href="https://github.com/pvtclawn/sentry" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              GitHub
            </a>
            <a href="https://warpcast.com/pvtclawn" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              Farcaster
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
