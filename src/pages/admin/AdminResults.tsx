import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useNotification } from '../../context/NotificationContext.tsx';
import type { LeaderboardEntry } from '../../types/index.ts';
import { Badge } from '../../components/common/Badge.tsx';
import {
  Award,
  Crown,
  Trophy,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const AdminResults: React.FC = () => {
  const { showToast } = useNotification();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isFinalPublished, setIsFinalPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const loadResults = async () => {
    try {
      const res = await api.getLeaderboard();
      setEntries(res.entries || []);
      setIsFinalPublished(res.isFinal);
    } catch (err: any) {
      showToast(err.message || 'Failed to load results', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, []);

  const handleCalculateFinal = async () => {
    setCalculating(true);
    try {
      const res = await api.calculateFinalResults();
      setEntries(res.leaderboard.entries || []);
      showToast(
        'Consolidated all 4 round scores, evaluated qualification cutoffs, and applied tie-breakers!',
        'success'
      );
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    } catch (err: any) {
      showToast(err.message || 'Calculation error', 'error');
    } finally {
      setCalculating(false);
    }
  };

  const handleTogglePublish = async (targetState: boolean) => {
    setPublishing(true);
    try {
      const res = await api.publishFinalResults(targetState);
      setIsFinalPublished(res.isFinalPublished);
      showToast(
        res.isFinalPublished
          ? 'OFFICIAL FINAL RESULTS PUBLISHED! Leaderboard is now officially frozen and published.'
          : 'Competition results unpublished; reverted to Provisional mode.',
        'success'
      );
      if (res.isFinalPublished) {
        try {
          confetti({
            particleCount: 160,
            spread: 100,
            origin: { y: 0.5 },
          });
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update publishing state', 'error');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#0F172A] to-[#0A0F1D] border border-purple-500/40 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              Final Results &amp; Championship Publishing
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400">
            Consolidate 4-round tournament scores, verify deterministic tie-breakers, and officially publish results
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <button
            onClick={handleCalculateFinal}
            disabled={calculating}
            className="px-4 py-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
            <span>{calculating ? 'Consolidating...' : 'Calculate Final Results'}</span>
          </button>

          {isFinalPublished ? (
            <button
              onClick={() => handleTogglePublish(false)}
              disabled={publishing}
              className="px-4 py-2.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-300 font-bold flex items-center gap-2 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Unpublish (Return to Provisional)</span>
            </button>
          ) : (
            <button
              onClick={() => handleTogglePublish(true)}
              disabled={publishing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
            >
              <Award className="w-4 h-4" />
              <span>Publish Final Results</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Notice Banner */}
      <div
        className={`p-4 rounded-xl border flex items-center justify-between font-mono text-xs ${
          isFinalPublished
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
            : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <Badge status={isFinalPublished ? 'WINNER' : 'ACTIVE'} size="md" />
          <span className="font-bold">
            {isFinalPublished
              ? 'Final Results Officially Published & Frozen.'
              : 'Competition in Provisional Mode. Standings may shift until officially published.'}
          </span>
        </div>
        <span className="text-slate-400 text-[11px] hidden md:inline">
          Deterministic 5-tier tie-breaking applied
        </span>
      </div>

      {/* Review Rankings Table */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl shadow-xl overflow-hidden font-mono text-xs">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">
            Audited Rankings &amp; Score Consolidation
          </h3>
          <span className="text-slate-400 text-[11px]">
            {entries.length} Qualified Participants Ranked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B1120] border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                <th className="py-3.5 px-4">Participant</th>
                <th className="py-3.5 px-4">Affiliation</th>
                <th className="py-3.5 px-3 text-center">R1 (Quiz)</th>
                <th className="py-3.5 px-3 text-center">R2 (Coding)</th>
                <th className="py-3.5 px-3 text-center">R3 (Debug)</th>
                <th className="py-3.5 px-3 text-center">R4 (Final)</th>
                <th className="py-3.5 px-4 text-center">Cumulative</th>
                <th className="py-3.5 px-4 text-center">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
                    <span>Consolidating Leaderboard Results...</span>
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr
                    key={e.userId}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      e.rank === 1 ? 'bg-amber-950/20 font-bold' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold ${
                          e.rank === 1
                            ? 'bg-amber-400 text-slate-950'
                            : e.rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : e.rank === 3
                            ? 'bg-amber-700 text-slate-100'
                            : 'text-slate-400 bg-slate-900 border border-slate-800'
                        }`}
                      >
                        {e.rank}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-xs">{e.fullName}</div>
                      {e.rank === 1 && (
                        <span className="text-[10px] text-amber-400 uppercase font-black tracking-wider flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-400 fill-current" />
                          <span>Grand Champion</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-xs truncate max-w-[200px]">
                      {e.organization}
                    </td>

                    <td className="py-3.5 px-3 text-center text-cyan-300 font-semibold">
                      {e.round1Score}
                    </td>

                    <td className="py-3.5 px-3 text-center text-emerald-300 font-semibold">
                      {e.round2Score}
                    </td>

                    <td className="py-3.5 px-3 text-center text-amber-300 font-semibold">
                      {e.round3Score}
                    </td>

                    <td className="py-3.5 px-3 text-center text-purple-300 font-semibold">
                      {e.round4Score}
                    </td>

                    <td className="py-3.5 px-4 text-center font-black text-cyan-400 text-sm">
                      {e.totalScore}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        status={e.rank === 1 && isFinalPublished ? 'WINNER' : e.qualificationStatus}
                        size="sm"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
