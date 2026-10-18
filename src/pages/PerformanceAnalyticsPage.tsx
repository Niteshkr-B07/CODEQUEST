import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import type { ParticipantPerformance } from '../types/index.ts';
import { SimpleBarChart, DonutChart, Sparkline } from '../components/common/Chart.tsx';
import { Badge } from '../components/common/Badge.tsx';
import {
  BarChart3,
  Award,
  Trophy,
  CheckCircle2,
  Clock,
  Target,
  RefreshCw,
  Zap,
  ArrowRight,
} from 'lucide-react';

interface PerformanceAnalyticsPageProps {
  onNavigate: (path: string) => void;
}

export const PerformanceAnalyticsPage: React.FC<PerformanceAnalyticsPageProps> = ({ onNavigate }) => {
  const [data, setData] = useState<ParticipantPerformance | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPerformance = async () => {
    try {
      const res = await api.getMyPerformance();
      setData(res);
    } catch (err) {
      console.error('Failed to load performance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerformance();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="font-mono text-xs text-slate-400">Computing Analytics Engine Metrics...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono text-xs">
        Performance data unavailable. Submit attempts in rounds to generate metrics.
      </div>
    );
  }

  const roundBarData = [
    { label: 'R1: Quiz', value: data.roundWiseScores.round1, max: 100, color: 'from-blue-500 to-cyan-500', subtext: 'Max 100' },
    { label: 'R2: Coding', value: data.roundWiseScores.round2, max: 200, color: 'from-cyan-500 to-emerald-500', subtext: 'Max 200' },
    { label: 'R3: Debug', value: data.roundWiseScores.round3, max: 200, color: 'from-amber-500 to-orange-500', subtext: 'Max 200' },
    { label: 'R4: Final', value: data.roundWiseScores.round4, max: 300, color: 'from-purple-500 to-pink-500', subtext: 'Max 300' },
  ];

  // Simulated rank progression across rounds
  const rankProgressionPoints = [
    Math.min(data.totalParticipants, Math.max(1, data.rank + 8)),
    Math.min(data.totalParticipants, Math.max(1, data.rank + 4)),
    Math.min(data.totalParticipants, Math.max(1, data.rank + 1)),
    data.rank,
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0C1425] via-[#0F172A] to-[#0A0F1D] border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              Performance &amp; Analytics
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400">
            {data.user.fullName} • {data.user.organization}
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <Badge
            status={data.isFinalPublished ? 'FINAL RESULTS' : 'PROVISIONAL'}
            size="md"
          />
        </div>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 font-mono">
        <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800 shadow flex flex-col justify-between">
          <span className="text-xs text-slate-400 uppercase">Cumulative Points</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-black text-cyan-400 tracking-tight">
              {data.totalScore}
            </span>
            <span className="text-xs text-slate-500">/ 800 max</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            Ranked #{data.rank} of {data.totalParticipants} coders
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800 shadow flex flex-col justify-between">
          <span className="text-xs text-slate-400 uppercase">Quiz Accuracy</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
              {data.accuracy}%
            </span>
            <span className="text-xs text-slate-500">
              {data.quizStats.correct}/{data.quizStats.attempted} correct
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            {data.quizStats.skipped} skipped questions
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800 shadow flex flex-col justify-between">
          <span className="text-xs text-slate-400 uppercase">Code Submissions</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
              {data.submissionStats.total}
            </span>
            <span className="text-xs text-slate-500">
              {data.submissionStats.accepted} accepted
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            {data.submissionStats.acceptanceRate}% acceptance rate
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800 shadow flex flex-col justify-between">
          <span className="text-xs text-slate-400 uppercase">Avg Sandbox Runtime</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-black text-purple-400 tracking-tight">
              {data.submissionStats.averageExecutionTimeMs}
            </span>
            <span className="text-xs text-slate-500">ms / testcase</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            {data.submissionStats.problemsSolved} challenges solved
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Score by Round Bar Chart (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-mono text-white">Score by Round Breakdown</h3>
              <p className="text-xs text-slate-400 font-mono">Points earned per battle stage</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-bold">{data.totalScore} Total Pts</span>
          </div>

          <div className="pt-6">
            <SimpleBarChart data={roundBarData} height={200} />
          </div>
        </div>

        {/* Accuracy and Acceptance Donut Charts (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-base font-bold font-mono text-white">Accuracy &amp; Acceptance</h3>
          <p className="text-xs text-slate-400 font-mono">Precision metrics across rounds</p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <DonutChart
              percentage={data.accuracy}
              label="Quiz Accuracy"
              sublabel="Correct / Picked"
              color="#38BDF8"
            />
            <DonutChart
              percentage={data.submissionStats.acceptanceRate}
              label="Code Acceptance"
              sublabel="Passed / Total"
              color="#10B981"
            />
          </div>
        </div>
      </div>

      {/* Submission Status Breakdown & Rank Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
        {/* Submissions by Status breakdown */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white">Submission Verdicts Breakdown</h3>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-emerald-400 font-bold">ACCEPTED</span>
              <span className="text-slate-200 font-bold">{data.submissionStats.accepted}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-rose-400 font-bold">WRONG ANSWER</span>
              <span className="text-slate-200 font-bold">{data.submissionStats.wrongAnswer}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-amber-400 font-bold">TIME LIMIT EXCEEDED</span>
              <span className="text-slate-200 font-bold">{data.submissionStats.tle}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-purple-400 font-bold">COMPILATION ERROR</span>
              <span className="text-slate-200 font-bold">{data.submissionStats.compilationError}</span>
            </div>
          </div>
        </div>

        {/* Rank Progression */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Rank Progression Curve</h3>
              <span className="text-amber-400 font-bold">Current: #{data.rank}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Estimated ranking trajectory across Stages 1, 2, 3, and 4
            </p>
          </div>

          <div className="py-6 flex items-center justify-center">
            <Sparkline points={rankProgressionPoints} color="#F59E0B" height={80} />
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-[10px] text-slate-400 border-t border-slate-800 pt-3">
            <div>Stage 01</div>
            <div>Stage 02</div>
            <div>Stage 03</div>
            <div className="text-amber-400 font-bold">Stage 04</div>
          </div>
        </div>
      </div>
    </div>
  );
};
