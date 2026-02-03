import { useState, useEffect } from 'react';
import './App.css';
import { fetchAttestations, decodeAttestation, getAttestationCount, ATTESTER, SCHEMA_UID, type Attestation, type AgentAttestation } from './lib/eas';

function App() {
  const [count, setCount] = useState<number>(0);
  const [attestations, setAttestations] = useState<(Attestation & { decoded: AgentAttestation | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [totalCount, rawAttestations] = await Promise.all([
          getAttestationCount(),
          fetchAttestations(),
        ]);
        setCount(totalCount);
        setAttestations(
          rawAttestations.map(a => ({
            ...a,
            decoded: decodeAttestation(a),
          }))
        );
      } catch (err) {
        console.error('Failed to load:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0a0a0f]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🦞🛡️</span>
            <div>
              <h1 className="text-xl font-bold">Base Agent Sentry</h1>
              <p className="text-sm text-gray-500">Autonomous agent verification</p>
            </div>
          </div>
          <a
            href={`https://base.easscan.org/schema/view/${SCHEMA_UID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View Schema →
          </a>
        </div>
      </header>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
            <p className="text-gray-500 text-sm mb-1">Total Attestations</p>
            <p className="text-4xl font-bold text-green-400">
              {loading ? '...' : count.toLocaleString()}
            </p>
          </div>
          <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
            <p className="text-gray-500 text-sm mb-1">Attester</p>
            <a
              href={`https://basescan.org/address/${ATTESTER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-mono text-sm break-all"
            >
              {ATTESTER.slice(0, 10)}...{ATTESTER.slice(-8)}
            </a>
          </div>
          <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
            <p className="text-gray-500 text-sm mb-1">Network</p>
            <p className="text-xl font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Base Mainnet
            </p>
          </div>
        </div>
      </section>

      {/* Recent Attestations */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-semibold mb-4">Recent Attestations</h2>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-3">
            {attestations.map((a) => (
              <div
                key={a.id}
                className="bg-[#12121a] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500 font-mono">
                      #{a.decoded?.tokenId || '?'}
                    </span>
                    <span className={`font-semibold ${scoreColor(a.decoded?.score || 0)}`}>
                      Score: {a.decoded?.score || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500 text-sm">
                      {new Date(a.time * 1000).toLocaleString()}
                    </span>
                    <a
                      href={`https://base.easscan.org/attestation/view/${a.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm"
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
      <footer className="border-t border-gray-800 py-6">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between text-gray-500 text-sm">
          <p>Built by <a href="https://x.com/pvtclawn" className="text-blue-400 hover:text-blue-300">@pvtclawn</a></p>
          <a
            href="https://github.com/pvtclawn/sentry"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
