import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import type { Round, ParticipantPerformance } from '../types/index.ts';
import { Badge } from '../components/common/Badge.tsx';
import {
  Trophy,
  Award,
  Zap,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Play,
  Terminal,
  Bug,
  Crown,
  FileCode,
  Bell,
  RefreshCw,
} from 'lucide-react';

interface ParticipantDashboardProps {
  onNavigate: (path: string) => void;
}

export const ParticipantDashboard: React.FC<ParticipantDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [performance, setPerformance] = useState<ParticipantPerformance | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [roundsRes, perfRes, annRes] = await Promise.all([
        api.getRounds(),
        api.getMyPerformance().catch(() => null),
        api.getAnnouncements().catch(() => ({ announcements: [] })),
      ]);

      setRounds(roundsRes.rounds);
      setPerformance(perfRes);
      setAnnouncements(annRes.announcements || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleStartRound = (round: Round) => {
    if (round.type === 'quiz') {
      onNavigate(`/quiz/${round.id}`);
    } else if (round.type === 'coding') {
      onNavigate(`/coding/${round.id}`);
    } else if (round.type === 'debugging') {
      onNavigate(`/debugging/${round.id}`);
    } else if (round.type === 'final') {
      onNavigate(`/final/${round.id}`);
    }
  };

  const getRoundIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return Terminal;
      case 'coding':
        return FileCode;
      case 'debugging':
        return Bug;
      case 'final':
        return Crown;
      default:
        return Zap;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="font-mono text-xs text-slate-400">Loading Competition Arena...</span>
        </div>
      </div>
    );
  }

  const currentRank = performance?.rank ? `#${performance.rank}` : '--';
  const totalScore = performance?.totalScore ?? 0;
  const isFinalPublished = performance?.isFinalPublished;

  // Active round or highest eligible round
  const activeRound = rounds.find((r) => r.status === 'active' && r.isEligible && !r.isCompleted) || rounds[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto font-sans">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0E1726] to-[#0A0F1D] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              Welcome back, <span className="text-cyan-400">{user?.fullName}</span>
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400">
            {user?.organization} • CODEQUEST 2026 Participant
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <button
            onClick={() => onNavigate('/leaderboard')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Leaderboard</span>
          </button>
          <button
            onClick={() => onNavigate('/performance')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors"
          >
            <Award className="w-3.5 h-3.5 text-cyan-400" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* Announcements Broadcast Bar */}
      {announcements.length > 0 && (
        <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3 text-xs font-mono">
          <Bell className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <span className="font-bold text-cyan-300">{announcements[0].title}</span>
            <p className="text-slate-300 font-sans leading-relaxed text-xs">
              {announcements[0].message}
            </p>
          </div>
        </div>
      )}

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 font-mono">
        {/* Total Score */}
        <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800/80 shadow-lg flex flex-col justify-between">
          <span className="text-xs font-medium uppercase text-slate-400">Total Score</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-black text-cyan-400 tracking-tight">
              {totalScore}
            </span>
            <span className="text-xs text-slate-500">/ 800 pts</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>Authoritative server scored</span>
          </div>
        </div>

        {/* Current Rank */}
        <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800/80 shadow-lg flex flex-col justify-between">
          <span className="text-xs font-medium uppercase text-slate-400">Current Rank</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
              {currentRank}
            </span>
            <span className="text-xs text-slate-500">
              of {performance?.totalParticipants ?? '--'}
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center gap-1">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span>{isFinalPublished ? 'Final Official Rank' : 'Provisional Standing'}</span>
          </div>
        </div>

        {/* Current Round */}
        <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800/80 shadow-lg flex flex-col justify-between">
          <span className="text-xs font-medium uppercase text-slate-400">Current Battle</span>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate block">
              {activeRound ? activeRound.name : 'Completed'}
            </span>
            <span className="text-xs text-cyan-400 font-semibold mt-1 inline-block">
              Round {activeRound ? activeRound.roundNumber : 4} of 4
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Server Clock Synced</span>
          </div>
        </div>

        {/* Qualification Status */}
        <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800/80 shadow-lg flex flex-col justify-between">
          <span className="text-xs font-medium uppercase text-slate-400">Status</span>
          <div className="mt-2">
            <Badge
              status={
                user?.isDisqualified
                  ? 'ELIMINATED'
                  : isFinalPublished
                  ? 'COMPLETED'
                  : 'QUALIFIED'
              }
              size="lg"
            />
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Active Competition Stage</span>
          </div>
        </div>
      </div>

      {/* Four Round Cards Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-mono text-white tracking-tight">
              Competition Rounds
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Complete each stage sequentially to qualify for the next battle
            </p>
          </div>
          <button
            onClick={() => onNavigate('/rounds')}
            className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
          >
            <span>Overview details</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rounds.map((round) => {
            const Icon = getRoundIcon(round.type);
            const isEligible = round.isEligible;
            const isCompleted = round.isCompleted;
            const isLocked = !isEligible && !isCompleted;

            return (
              <div
                key={round.id}
                className={`rounded-2xl p-6 border transition-all duration-300 flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-[#0B1220]/80 border-cyan-500/30'
                    : isEligible
                    ? 'bg-[#0E1628] border-cyan-500/50 shadow-xl shadow-cyan-950/20 hover:border-cyan-400'
                    : 'bg-[#090D17]/80 border-slate-800 opacity-75'
                }`}
              >
                <div>
                  {/* Top line with round number and status badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isEligible
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-slate-800/80 text-slate-500 border border-slate-700/60'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                          STAGE 0{round.roundNumber}
                        </span>
                        <h3 className="text-lg font-bold font-mono text-white leading-tight">
                          {round.name}
                        </h3>
                      </div>
                    </div>

                    <Badge status={round.displayStatus || 'LOCKED'} size="sm" />
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed mb-4">
                    {round.description}
                  </p>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono mb-4">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Duration</span>
                      <span className="font-semibold text-slate-200">
                        {round.durationMinutes} mins
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Max Points</span>
                      <span className="font-semibold text-slate-200">{round.maxScore} pts</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Your Score</span>
                      <span className="font-bold text-cyan-400">{round.userScore ?? 0} pts</span>
                    </div>
                  </div>

                  {round.lockReason && !isCompleted && !isEligible && (
                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-amber-400/90 flex items-center gap-2 mb-4">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>{round.lockReason}</span>
                    </div>
                  )}
                </div>

                {/* Card CTA Action */}
                <div className="pt-2">
                  {isCompleted ? (
                    <button
                      onClick={() => handleStartRound(round)}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Review Submissions & Results</span>
                    </button>
                  ) : isEligible ? (
                    <button
                      onClick={() => handleStartRound(round)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-xs tracking-wide flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/20 active:scale-95"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start {round.name}</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900/60 text-slate-600 border border-slate-800/80 font-mono text-xs font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Locked (Awaiting Qualification)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
