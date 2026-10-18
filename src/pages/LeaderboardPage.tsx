import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import type { LeaderboardEntry } from '../types/index.ts';
import { Badge } from '../components/common/Badge.tsx';
import {
  Trophy,
  Crown,
  Search,
  Filter,
  RefreshCw,
  Award,
  Zap,
  Info,
  Building,
} from 'lucide-react';

interface LeaderboardPageProps {
  onNavigate: (path: string) => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ onNavigate }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isFinal, setIsFinal] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [showTieBreakModal, setShowTieBreakModal] = useState(false);

  // Load initial data
  const loadLeaderboard = async () => {
    try {
      const data = await api.getLeaderboard();
      setEntries(data.entries);
      setIsFinal(data.isFinal);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time Server-Sent Events (SSE) stream
  useEffect(() => {
    loadLeaderboard();

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/leaderboard/live');
      eventSource.onopen = () => setIsLiveConnected(true);
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.entries) {
            setEntries(parsed.entries);
            setIsFinal(parsed.isFinal);
          }
        } catch {
          // ignore
        }
      };
      eventSource.onerror = () => {
        setIsLiveConnected(false);
      };
    } catch {
      setIsLiveConnected(false);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const filteredEntries = entries.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.fullName.toLowerCase().includes(q) ||
      e.organization.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0C1425] via-[#0F172A] to-[#0A0F1D] border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-7 h-7 text-amber-400" />
              <span>{isFinal ? 'FINAL LEADERBOARD' : 'PROVISIONAL LEADERBOARD'}</span>
            </h1>
            <Badge status={isFinal ? 'WINNER' : 'ACTIVE'} size="md" />
          </div>
          <p className="text-xs font-mono text-slate-400">
            {isFinal
              ? 'Official verified final standings and tournament championship ranks'
              : 'Live real-time standings subject to change during active competition rounds'}
          </p>
        </div>

        {/* Live SSE status indicator & Tie-breaker rules button */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
              }`}
            />
            <span className="text-[11px]">
              {isLiveConnected ? 'Real-Time Sync Active' : 'Polling Active'}
            </span>
          </div>

          <button
            onClick={() => setShowTieBreakModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-300 transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Tie-Breaking Rules</span>
          </button>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 font-mono">
          {/* #2 Silver */}
          <div className="order-2 md:order-1 p-5 rounded-2xl bg-[#0D1424] border border-slate-700/80 shadow-lg flex flex-col justify-between items-center text-center relative overflow-hidden group">
            <div className="w-10 h-10 rounded-full bg-slate-700/60 border border-slate-500 flex items-center justify-center font-bold text-slate-200 mb-2">
              2
            </div>
            <img
              src={entries[1].avatarUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=p2'}
              alt={entries[1].fullName}
              className="w-16 h-16 rounded-full border-2 border-slate-500 mb-2 object-cover"
            />
            <h3 className="font-bold text-slate-100 text-sm truncate max-w-[200px]">
              {entries[1].fullName}
            </h3>
            <span className="text-[10px] text-slate-400 truncate max-w-[220px]">
              {entries[1].organization}
            </span>
            <div className="mt-3 pt-2 border-t border-slate-800 w-full flex items-center justify-center gap-2">
              <span className="text-xl font-black text-slate-300">{entries[1].totalScore}</span>
              <span className="text-[11px] text-slate-500">pts</span>
            </div>
          </div>

          {/* #1 Gold Champion */}
          <div className="order-1 md:order-2 p-6 rounded-2xl bg-gradient-to-b from-amber-950/30 via-[#0F172A] to-[#0D1424] border-2 border-amber-400/60 shadow-2xl flex flex-col justify-between items-center text-center relative overflow-hidden scale-105 z-10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow">
              <Crown className="w-3 h-3 text-slate-950 fill-current" />
              <span>Championship Leader</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center font-black text-amber-300 mb-2 mt-2">
              1
            </div>
            <img
              src={entries[0].avatarUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=p1'}
              alt={entries[0].fullName}
              className="w-20 h-20 rounded-full border-2 border-amber-400 mb-2 object-cover shadow-lg"
            />
            <h3 className="font-extrabold text-white text-base truncate max-w-[220px]">
              {entries[0].fullName}
            </h3>
            <span className="text-[11px] text-slate-400 truncate max-w-[240px]">
              {entries[0].organization}
            </span>
            <div className="mt-3 pt-2 border-t border-slate-800 w-full flex items-center justify-center gap-2">
              <span className="text-2xl font-black text-amber-400">{entries[0].totalScore}</span>
              <span className="text-xs text-slate-500">pts</span>
            </div>
          </div>

          {/* #3 Bronze */}
          <div className="order-3 md:order-3 p-5 rounded-2xl bg-[#0D1424] border border-amber-800/40 shadow-lg flex flex-col justify-between items-center text-center relative overflow-hidden group">
            <div className="w-10 h-10 rounded-full bg-amber-900/40 border border-amber-700/60 flex items-center justify-center font-bold text-amber-500 mb-2">
              3
            </div>
            <img
              src={entries[2].avatarUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=p3'}
              alt={entries[2].fullName}
              className="w-16 h-16 rounded-full border-2 border-amber-700/60 mb-2 object-cover"
            />
            <h3 className="font-bold text-slate-100 text-sm truncate max-w-[200px]">
              {entries[2].fullName}
            </h3>
            <span className="text-[10px] text-slate-400 truncate max-w-[220px]">
              {entries[2].organization}
            </span>
            <div className="mt-3 pt-2 border-t border-slate-800 w-full flex items-center justify-center gap-2">
              <span className="text-xl font-black text-amber-500">{entries[2].totalScore}</span>
              <span className="text-[11px] text-slate-500">pts</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#0F172A] border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search participant or university..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          <span>Total Participants:</span>
          <strong className="text-white font-bold">{entries.length}</strong>
        </div>
      </div>

      {/* Leaderboard Relational Table */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl shadow-xl overflow-hidden font-mono text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B1120] border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                <th className="py-3.5 px-4">Participant</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Organization</th>
                <th className="py-3.5 px-3 text-center">R1 (Quiz)</th>
                <th className="py-3.5 px-3 text-center">R2 (Coding)</th>
                <th className="py-3.5 px-3 text-center">R3 (Debug)</th>
                <th className="py-3.5 px-3 text-center">R4 (Final)</th>
                <th className="py-3.5 px-4 text-right">Total Score</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
                    <span>Loading Live Standings...</span>
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No participants matched your search criteria.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const isTop3 = entry.rank <= 3;

                  return (
                    <tr
                      key={entry.userId}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        entry.rank === 1
                          ? 'bg-amber-950/15'
                          : entry.rank === 2
                          ? 'bg-slate-800/20'
                          : entry.rank === 3
                          ? 'bg-amber-950/10'
                          : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs ${
                            entry.rank === 1
                              ? 'bg-amber-500 text-slate-950 shadow'
                              : entry.rank === 2
                              ? 'bg-slate-300 text-slate-950'
                              : entry.rank === 3
                              ? 'bg-amber-700 text-slate-100'
                              : 'text-slate-400 bg-slate-900 border border-slate-800'
                          }`}
                        >
                          {entry.rank}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={entry.avatarUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=user'}
                            alt={entry.fullName}
                            className="w-8 h-8 rounded-full object-cover bg-slate-800"
                          />
                          <div>
                            <div className="font-bold text-white text-xs">{entry.fullName}</div>
                            <div className="md:hidden text-[10px] text-slate-400 truncate max-w-[140px]">
                              {entry.organization}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 hidden md:table-cell text-slate-400 text-xs truncate max-w-[200px]">
                        {entry.organization}
                      </td>

                      <td className="py-3.5 px-3 text-center text-slate-300">
                        {entry.round1Score > 0 ? (
                          <span className="text-cyan-300 font-semibold">{entry.round1Score}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center text-slate-300">
                        {entry.round2Score > 0 ? (
                          <span className="text-emerald-300 font-semibold">{entry.round2Score}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center text-slate-300">
                        {entry.round3Score > 0 ? (
                          <span className="text-amber-300 font-semibold">{entry.round3Score}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center text-slate-300">
                        {entry.round4Score > 0 ? (
                          <span className="text-purple-300 font-semibold">{entry.round4Score}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="text-sm font-black text-cyan-400">{entry.totalScore}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge status={entry.qualificationStatus} size="sm" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tie-breaking Rules Modal */}
      {showTieBreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 font-mono text-xs text-slate-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Deterministic Tie-Breaking Rules</span>
              </h3>
              <button
                onClick={() => setShowTieBreakModal(false)}
                className="text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="font-sans leading-relaxed text-slate-400">
              If two or more participants achieve identical scores, ranking order is determined automatically server-side using the following strict sequential tie-breakers:
            </p>

            <ol className="list-decimal pl-5 space-y-2 text-slate-200">
              <li>
                <strong className="text-cyan-300">Higher Total Cumulative Score:</strong> Overall sum of all four round points.
              </li>
              <li>
                <strong className="text-purple-300">Higher Final Battle (Round 4) Score:</strong> Advanced algorithmic challenges.
              </li>
              <li>
                <strong className="text-amber-300">Higher Debugging Battle (Round 3) Score:</strong> Rapid bug hunting accuracy.
              </li>
              <li>
                <strong className="text-emerald-300">Higher Coding Battle (Round 2) Score:</strong> Core algorithmic tests.
              </li>
              <li>
                <strong className="text-slate-300">Earlier Final Submission Timestamp:</strong> Participant who completed their qualifying attempt first wins the tie.
              </li>
            </ol>

            <button
              onClick={() => setShowTieBreakModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
