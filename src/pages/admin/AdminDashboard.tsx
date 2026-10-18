import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useNotification } from '../../context/NotificationContext.tsx';
import { Badge } from '../../components/common/Badge.tsx';
import { SimpleBarChart } from '../../components/common/Chart.tsx';
import {
  Users,
  CheckSquare,
  Swords,
  Trophy,
  Award,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Bell,
  Send,
  ShieldAlert,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { showToast } = useNotification();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const loadDashboard = async () => {
    try {
      const res = await api.getAdminDashboard();
      setData(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load admin dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle || !announcementMessage) return;
    setIsBroadcasting(true);

    try {
      await api.createAnnouncement({
        title: announcementTitle,
        message: announcementMessage,
        type: 'info',
      });
      showToast('Announcement broadcast to all participants!', 'success');
      setAnnouncementTitle('');
      setAnnouncementMessage('');
    } catch (err: any) {
      showToast(err.message || 'Broadcast failed', 'error');
    } finally {
      setIsBroadcasting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
          <span className="font-mono text-xs text-slate-400">Loading Admin Mission Control...</span>
        </div>
      </div>
    );
  }

  const { metrics, roundSubmissions = [], recentSubmissions = [] } = data || {};

  const barData = roundSubmissions.map((rs: any) => ({
    label: rs.roundName,
    value: rs.submissionsCount,
    max: Math.max(...roundSubmissions.map((r: any) => r.submissionsCount), 10),
    color: 'from-purple-500 to-cyan-500',
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#0F172A] to-[#0A0F1D] border border-purple-500/40 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              Admin Mission Control
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400">
            Hackathon orchestration, automated evaluations, scoring oversight &amp; results management
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <button
            onClick={() => onNavigate('/admin/results')}
            className="px-4 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/50 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Award className="w-3.5 h-3.5 text-purple-300" />
            <span>Publish Results</span>
          </button>
          <button
            onClick={() => onNavigate('/admin/rounds')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Swords className="w-3.5 h-3.5 text-cyan-400" />
            <span>Manage Rounds</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 font-mono text-xs">
        <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800 shadow flex flex-col justify-between">
          <span className="text-slate-400 uppercase">Total Participants</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-black text-cyan-400 tracking-tight">
              {metrics?.totalParticipants || 0}
            </span>
            <span className="text-slate-500 text-[11px]">{metrics?.activeParticipants} Active</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1">
            <Users className="w-3 h-3 text-cyan-400" />
            <span>All registered accounts</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800 shadow flex flex-col justify-between">
          <span className="text-slate-400 uppercase">Total Submissions</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-black text-purple-400 tracking-tight">
              {metrics?.totalSubmissions || 0}
            </span>
            <span className="text-slate-500 text-[11px]">Sandboxed</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1">
            <CheckSquare className="w-3 h-3 text-purple-400" />
            <span>Quiz &amp; Code submissions</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800 shadow flex flex-col justify-between">
          <span className="text-slate-400 uppercase">Qualified / Eliminated</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
              {metrics?.qualifiedCount || 0}
            </span>
            <span className="text-rose-400 font-bold">{metrics?.eliminatedCount || 0} Elim</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1">
            <Trophy className="w-3 h-3 text-emerald-400" />
            <span>Qualification Engine active</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800 shadow flex flex-col justify-between">
          <span className="text-slate-400 uppercase">Results Status</span>
          <div className="mt-2">
            <Badge
              status={metrics?.isFinalPublished ? 'WINNER' : 'ACTIVE'}
              size="lg"
            />
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1">
            <span>{metrics?.isFinalPublished ? 'Final Leaderboard Published' : 'Provisional Competition'}</span>
          </div>
        </div>
      </div>

      {/* Anti-Cheating & Proctoring Quick Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/30 via-slate-900 to-amber-950/20 border border-rose-500/30 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-sm flex items-center gap-2">
              <span>Online Proctoring &amp; Anti-Cheating Telemetry Active</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Live webcam streams, tab visibility counters, clipboard restrictions, and code plagiarism detection are running.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('/admin/proctoring')}
          className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer"
        >
          <span>Open Proctoring Center</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid: Round Activity Chart + In-App Broadcast Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Round submissions chart (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-mono text-white">Stage Submission Volume</h3>
              <p className="text-xs text-slate-400 font-mono">Submission counts per hackathon round</p>
            </div>
            <button
              onClick={() => onNavigate('/admin/submissions')}
              className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="pt-4">
            <SimpleBarChart data={barData} height={180} />
          </div>
        </div>

        {/* Live Broadcast Form (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold font-mono text-white">Broadcast Announcement</h3>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Sends an immediate high-priority announcement to all active participants
          </p>

          <form onSubmit={handleBroadcastAnnouncement} className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-slate-300 block mb-1">Headline</label>
              <input
                type="text"
                required
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="e.g. Round 2 Closing in 15 Minutes!"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">Message Body</label>
              <textarea
                required
                rows={3}
                value={announcementMessage}
                onChange={(e) => setAnnouncementMessage(e.target.value)}
                placeholder="Important instructions or announcements..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 resize-none font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={isBroadcasting}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isBroadcasting ? 'Broadcasting...' : 'Broadcast to Arena'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Live Recent Submissions Ticker Table */}
      <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Live Participant Submissions Stream</h3>
          <button
            onClick={() => onNavigate('/admin/submissions')}
            className="text-xs text-purple-400 hover:underline flex items-center gap-1"
          >
            <span>Full audit log</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase">
                <th className="py-2.5 px-3">Participant</th>
                <th className="py-2.5 px-3">Problem</th>
                <th className="py-2.5 px-3 text-center">Verdict</th>
                <th className="py-2.5 px-3 text-center">Score</th>
                <th className="py-2.5 px-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentSubmissions.map((sub: any) => (
                <tr key={sub.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-slate-200">
                    {sub.userName}
                    <span className="block text-[10px] text-slate-500">{sub.userOrg}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{sub.problemTitle}</td>
                  <td className="py-2.5 px-3 text-center">
                    <Badge status={sub.status} size="sm" />
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-cyan-400">
                    {sub.score} / {sub.maxScore}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-500 text-[10px]">
                    {new Date(sub.submittedAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
