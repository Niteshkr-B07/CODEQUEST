import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import type { Round } from '../types/index.ts';
import { Badge } from '../components/common/Badge.tsx';
import {
  Swords,
  Play,
  Lock,
  CheckCircle2,
  Terminal,
  FileCode,
  Bug,
  Crown,
  Clock,
  Award,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface RoundsOverviewPageProps {
  onNavigate: (path: string) => void;
}

export const RoundsOverviewPage: React.FC<RoundsOverviewPageProps> = ({ onNavigate }) => {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRounds().then((res) => {
      setRounds(res.rounds);
      setLoading(false);
    });
  }, []);

  const handleStart = (round: Round) => {
    if (round.type === 'quiz') onNavigate(`/quiz/${round.id}`);
    else if (round.type === 'coding') onNavigate(`/coding/${round.id}`);
    else if (round.type === 'debugging') onNavigate(`/debugging/${round.id}`);
    else if (round.type === 'final') onNavigate(`/final/${round.id}`);
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
        return Swords;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0C1425] via-[#0F172A] to-[#0A0F1D] border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Swords className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              Battle Stages &amp; Progression Engine
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400">
            Four progressive hackathon stages from rapid MCQ screening to high-stakes algorithmic finals
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {rounds.map((round) => {
          const Icon = getRoundIcon(round.type);
          const isEligible = round.isEligible;
          const isCompleted = round.isCompleted;

          return (
            <div
              key={round.id}
              className={`p-6 sm:p-8 rounded-2xl border transition-all ${
                isCompleted
                  ? 'bg-[#0B1220] border-cyan-500/30'
                  : isEligible
                  ? 'bg-[#0E1728] border-cyan-500/50 shadow-xl'
                  : 'bg-[#090D17] border-slate-800 opacity-80'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      isEligible
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
                        Stage 0{round.roundNumber}
                      </span>
                      <h3 className="text-xl font-bold font-mono text-white">
                        {round.name}
                      </h3>
                      <Badge status={round.displayStatus || 'LOCKED'} size="sm" />
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-sans leading-relaxed">
                      {round.description}
                    </p>

                    {round.instructions && (
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-400 max-w-2xl">
                        <strong className="text-cyan-300">Rule:</strong> {round.instructions}
                      </div>
                    )}

                    {round.proctoringSettings && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-[11px] font-mono text-cyan-300 w-fit">
                        <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>AI Proctored: Camera &amp; Fullscreen Monitored (Max {round.proctoringSettings.maxTabWarnings || 3} tab warnings)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col items-end gap-4 min-w-[220px]">
                  <div className="grid grid-cols-2 gap-2 w-full text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block">Duration</span>
                      <span className="font-bold text-slate-200">{round.durationMinutes}m</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block">Max Score</span>
                      <span className="font-bold text-cyan-400">{round.maxScore} pts</span>
                    </div>
                  </div>

                  {isCompleted ? (
                    <button
                      onClick={() => handleStart(round)}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs font-semibold flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Review Attempts</span>
                    </button>
                  ) : isEligible ? (
                    <button
                      onClick={() => handleStart(round)}
                      className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-95"
                    >
                      <Play className="w-4 h-4" />
                      <span>Enter Battle</span>
                    </button>
                  ) : (
                    <div className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 font-mono text-xs flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4" />
                      <span>Requires Prior Stage Qualification</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
