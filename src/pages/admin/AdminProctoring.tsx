import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useNotification } from '../../context/NotificationContext.tsx';
import type { ProctoringSession, AuditEvent, SimilarityResult, Round } from '../../types/index.ts';
import { Badge } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import {
  ShieldAlert,
  ShieldCheck,
  Camera,
  Mic,
  Maximize2,
  AlertTriangle,
  RotateCcw,
  Lock,
  Unlock,
  CheckCircle2,
  Trash2,
  Eye,
  FileCode,
  Users,
  Search,
  RefreshCw,
  Clock,
  Sparkles,
  AlertOctagon,
  Sliders,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';

export const AdminProctoring: React.FC = () => {
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState<'sessions' | 'events' | 'snapshots' | 'similarity' | 'settings'>('sessions');

  const [rounds, setRounds] = useState<Round[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [sessions, setSessions] = useState<ProctoringSession[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [similarityResults, setSimilarityResults] = useState<SimilarityResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  // Modal states
  const [selectedSnapshot, setSelectedSnapshot] = useState<any | null>(null);
  const [inspectingPair, setInspectingPair] = useState<SimilarityResult | null>(null);
  const [notesModalSession, setNotesModalSession] = useState<ProctoringSession | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Load rounds
  useEffect(() => {
    api.getAdminRounds().then((res) => {
      setRounds(res.rounds || []);
      if (res.rounds && res.rounds.length > 0) {
        setSelectedRoundId(res.rounds[0].id);
      }
    });
  }, []);

  // Load active tab data
  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sessions') {
        const res = await api.getAdminProctoringSessions(selectedRoundId, statusFilter);
        setSessions(res.sessions || []);
      } else if (activeTab === 'events') {
        const res = await api.getAdminAuditEvents({ roundId: selectedRoundId, limit: 100 });
        setAuditEvents(res.events || []);
      } else if (activeTab === 'snapshots') {
        if (selectedRoundId) {
          const res = await api.getProctoringSnapshots(selectedRoundId);
          setSnapshots(res.snapshots || []);
        }
      } else if (activeTab === 'similarity') {
        if (selectedRoundId) {
          const res = await api.getPlagiarismResults(selectedRoundId);
          setSimilarityResults(res.results || []);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load proctoring data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, selectedRoundId, statusFilter]);

  // Admin session action handler
  const handleSessionAction = async (action: string, session: ProctoringSession) => {
    if (action === 'disqualify') {
      if (!window.confirm(`Disqualify ${session.participantName} for cheating/violations?`)) return;
    }

    try {
      await api.adminProctoringAction(action, session.id, adminNotes);
      showToast(`Action "${action}" executed successfully`, 'success');
      setNotesModalSession(null);
      setAdminNotes('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  // Run plagiarism scan
  const handleRunScan = async () => {
    if (!selectedRoundId) return;
    setIsScanning(true);
    try {
      const res = await api.runPlagiarismScan(selectedRoundId);
      setSimilarityResults(res.results || []);
      showToast(`Plagiarism scan completed: ${res.count} comparison pairs analyzed`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Plagiarism scan failed', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  // Save Round proctoring settings
  const handleSaveRoundSettings = async (roundId: string, updates: any) => {
    try {
      await api.updateRoundProctoringSettings(roundId, updates);
      showToast('Round proctoring settings updated successfully', 'success');
      const res = await api.getAdminRounds();
      setRounds(res.rounds || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to update round settings', 'error');
    }
  };

  const currentRound = rounds.find((r) => r.id === selectedRoundId);

  // Filter sessions by search
  const filteredSessions = sessions.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.participantName.toLowerCase().includes(q) ||
      s.participantEmail.toLowerCase().includes(q) ||
      s.organization.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0C152B] via-[#0E1B38] to-[#0A1024] border border-cyan-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              Anti-Cheating &amp; Online Proctoring Center
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400">
            Real-time candidate telemetry, live webcam monitoring, tab switch auditing, and plagiarism detection
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-bold text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Tabs & Round Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
              activeTab === 'sessions'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Live Sessions ({sessions.length})
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
              activeTab === 'events'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Audit Events Stream
          </button>

          <button
            onClick={() => setActiveTab('snapshots')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
              activeTab === 'snapshots'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Webcam Snapshots
          </button>

          <button
            onClick={() => setActiveTab('similarity')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
              activeTab === 'similarity'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Code Similarity &amp; Plagiarism
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
              activeTab === 'settings'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Round Rules Config
          </button>
        </div>

        {/* Round Filter dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Round:</span>
          <select
            value={selectedRoundId}
            onChange={(e) => setSelectedRoundId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            {rounds.map((r) => (
              <option key={r.id} value={r.id}>
                Round {r.roundNumber}: {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB 1: LIVE PARTICIPANT SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {/* Controls & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate name, email, org..."
                className="w-full bg-[#0A0F1D] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-mono text-slate-400">Status:</span>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {(['ALL', 'NORMAL', 'WARNING', 'SUSPICIOUS', 'REVIEW_REQUIRED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                      statusFilter === st
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sessions Table */}
          <div className="rounded-2xl border border-slate-800 bg-[#0A0F1D] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Organization</th>
                    <th className="py-3 px-4">Devices</th>
                    <th className="py-3 px-4">Tab Switches</th>
                    <th className="py-3 px-4">Copy/Paste</th>
                    <th className="py-3 px-4">Risk Score</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Interventions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        No proctored participant sessions found for this round.
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((sess) => {
                      const isDisq = (sess as any).isDisqualified;

                      return (
                        <tr
                          key={sess.id}
                          className={`hover:bg-slate-900/40 transition-colors ${
                            sess.status === 'REVIEW_REQUIRED'
                              ? 'bg-rose-950/10'
                              : sess.status === 'SUSPICIOUS'
                              ? 'bg-amber-950/10'
                              : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-200">{sess.participantName}</div>
                            <div className="text-[11px] text-slate-400">{sess.participantEmail}</div>
                            {sess.adminNotes && (
                              <div className="text-[10px] text-amber-400 mt-1 italic">
                                Note: {sess.adminNotes}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">{sess.organization}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span
                                title={sess.cameraActive ? 'Camera active' : 'Camera lost'}
                                className={`p-1 rounded ${
                                  sess.cameraActive
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-rose-500/10 text-rose-400'
                                }`}
                              >
                                <Camera className="w-3.5 h-3.5" />
                              </span>
                              <span
                                title={sess.microphoneActive ? 'Microphone active' : 'Microphone lost'}
                                className={`p-1 rounded ${
                                  sess.microphoneActive
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-rose-500/10 text-rose-400'
                                }`}
                              >
                                <Mic className="w-3.5 h-3.5" />
                              </span>
                              <span
                                title={sess.fullscreenActive ? 'Fullscreen locked' : 'Fullscreen exited'}
                                className={`p-1 rounded ${
                                  sess.fullscreenActive
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-amber-500/10 text-amber-400'
                                }`}
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`font-bold ${
                                sess.tabSwitchCount >= 3
                                  ? 'text-rose-400'
                                  : sess.tabSwitchCount > 0
                                  ? 'text-amber-400'
                                  : 'text-slate-300'
                              }`}
                            >
                              {sess.tabSwitchCount} times
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">{sess.copyPasteAttemptCount} attempts</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-bold ${
                                  sess.violationScore >= 70
                                    ? 'text-rose-400'
                                    : sess.violationScore >= 30
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {sess.violationScore} pts
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {isDisq ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                                DISQUALIFIED
                              </span>
                            ) : sess.isLocked ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1 w-max">
                                <Lock className="w-3 h-3" /> LOCKED
                              </span>
                            ) : (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  sess.status === 'NORMAL'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : sess.status === 'WARNING'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                    : sess.status === 'SUSPICIOUS'
                                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                }`}
                              >
                                {sess.status}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {sess.isLocked ? (
                                <button
                                  type="button"
                                  onClick={() => handleSessionAction('unlock', sess)}
                                  title="Unlock candidate session"
                                  className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors"
                                >
                                  <Unlock className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSessionAction('lock', sess)}
                                  title="Lock candidate session"
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleSessionAction('clear_warnings', sess)}
                                title="Reset warning counter to 0"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setNotesModalSession(sess);
                                  setAdminNotes(sess.adminNotes || '');
                                }}
                                title="Flag for Review with Notes"
                                className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </button>

                              {!isDisq && (
                                <button
                                  type="button"
                                  onClick={() => handleSessionAction('disqualify', sess)}
                                  title="Disqualify participant"
                                  className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-800 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT EVENTS STREAM */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-[#0A0F1D] overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
              <div className="text-xs font-mono font-bold text-slate-200">
                Live Proctoring Events Telemetry Stream
              </div>
              <span className="text-[11px] font-mono text-cyan-400">
                {auditEvents.length} events logged
              </span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {auditEvents.length === 0 ? (
                <div className="p-12 text-center text-slate-500 font-mono text-xs">
                  No telemetry events recorded yet.
                </div>
              ) : (
                auditEvents.map((ev) => {
                  const severityBadge =
                    ev.severity === 'critical'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : ev.severity === 'high'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : ev.severity === 'medium'
                      ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700';

                  return (
                    <div
                      key={ev.id}
                      className="p-4 hover:bg-slate-900/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase shrink-0 ${severityBadge}`}>
                          {ev.severity}
                        </span>
                        <div>
                          <div className="text-slate-200 font-bold flex items-center gap-2">
                            <span>{ev.eventType}</span>
                            <span className="text-slate-500 font-normal">•</span>
                            <span className="text-cyan-400">{ev.participantName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {ev.participantEmail} • {ev.organization}
                          </div>
                          {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                            <div className="text-[10px] text-slate-500 mt-1 font-mono">
                              Payload: {JSON.stringify(ev.metadata)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 shrink-0 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(ev.timestamp).toLocaleTimeString()} •{' '}
                        {new Date(ev.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WEBCAM SNAPSHOTS GALLERY */}
      {activeTab === 'snapshots' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#0A0F1D] border border-slate-800 flex items-center justify-between">
            <div className="text-xs font-mono text-slate-300">
              Webcam captures recorded periodically or upon violation triggers
            </div>
            <span className="text-xs font-mono text-cyan-400 font-bold">
              {snapshots.length} snapshots recorded
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {snapshots.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-500 font-mono text-xs">
                No webcam snapshots found for this round.
              </div>
            ) : (
              snapshots.map((snap) => (
                <div
                  key={snap.id}
                  onClick={() => setSelectedSnapshot(snap)}
                  className="rounded-2xl border border-slate-800 bg-[#0A0F1D] overflow-hidden hover:border-cyan-500/50 transition-all cursor-pointer group shadow-lg"
                >
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <img
                      src={snap.imageUrl}
                      alt="Candidate snapshot"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {snap.status === 'flagged' && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-rose-500/80 text-white text-[9px] font-mono font-bold">
                        FLAGGED
                      </div>
                    )}
                  </div>
                  <div className="p-3 text-xs font-mono space-y-1">
                    <div className="text-slate-300 font-bold truncate">Candidate Snapshot</div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(snap.capturedAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CODE SIMILARITY & PLAGIARISM CHECK */}
      {activeTab === 'similarity' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/20 via-slate-900 to-cyan-950/20 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
                <FileCode className="w-5 h-5 text-purple-400" />
                Automated Submission Plagiarism &amp; Structural AST Scanner
              </h3>
              <p className="text-xs font-mono text-slate-400">
                Compares normalized n-gram token structures across all participant submissions for the selected round.
              </p>
            </div>

            <button
              type="button"
              disabled={isScanning}
              onClick={handleRunScan}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono font-bold text-xs shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {isScanning ? 'Analyzing Submissions...' : 'Run Plagiarism Scan'}
            </button>
          </div>

          {/* Results table */}
          <div className="rounded-2xl border border-slate-800 bg-[#0A0F1D] overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
              <div className="text-xs font-mono font-bold text-slate-200">
                Flagged Pairwise Similarities (&gt;= 50% match)
              </div>
              <span className="text-xs font-mono text-purple-400 font-bold">
                {similarityResults.length} match pairs identified
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/30 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Problem</th>
                    <th className="py-3 px-4">Candidate A</th>
                    <th className="py-3 px-4">Candidate B</th>
                    <th className="py-3 px-4">Similarity %</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4 text-right">Inspection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                  {similarityResults.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No suspicious similarities detected. Click "Run Plagiarism Scan" to evaluate recent submissions.
                      </td>
                    </tr>
                  ) : (
                    similarityResults.map((sim) => (
                      <tr key={sim.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-200">{sim.problemTitle}</td>
                        <td className="py-3.5 px-4 text-cyan-300 font-bold">{sim.participantName1}</td>
                        <td className="py-3.5 px-4 text-cyan-300 font-bold">{sim.participantName2}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`font-bold text-sm ${
                              sim.similarityScore >= 85
                                ? 'text-rose-400'
                                : sim.similarityScore >= 70
                                ? 'text-amber-400'
                                : 'text-yellow-300'
                            }`}
                          >
                            {sim.similarityScore}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              sim.status === 'HIGHLY_SUSPICIOUS'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : sim.status === 'SUSPICIOUS'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {sim.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setInspectingPair(sim)}
                            className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[11px] font-bold flex items-center gap-1.5 ml-auto transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Diff Inspection
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ROUND PROCTORING RULES CONFIGURATION */}
      {activeTab === 'settings' && currentRound && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0A0F1D] border border-slate-800 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold font-mono text-white">
                Proctoring Enforcement Rules for Round {currentRound.roundNumber}: {currentRound.name}
              </h3>
              <p className="text-xs font-mono text-slate-400">
                Configure browser security restrictions, warning thresholds, and disciplinary actions.
              </p>
            </div>

            {currentRound.proctoringSettings && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as any;
                  handleSaveRoundSettings(currentRound.id, {
                    cameraRequired: form.cameraRequired.checked,
                    microphoneRequired: form.microphoneRequired.checked,
                    fullscreenRequired: form.fullscreenRequired.checked,
                    tabMonitoring: form.tabMonitoring.checked,
                    copyRestriction: form.copyRestriction.checked,
                    pasteRestriction: form.pasteRestriction.checked,
                    maxTabWarnings: parseInt(form.maxTabWarnings.value, 10),
                    violationAction: form.violationAction.value,
                  });
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {/* Camera */}
                  <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      name="cameraRequired"
                      defaultChecked={currentRound.proctoringSettings.cameraRequired}
                      className="mt-1 w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 bg-slate-800"
                    />
                    <div className="text-xs font-mono">
                      <div className="text-slate-200 font-bold">Mandatory Camera</div>
                      <div className="text-slate-400 text-[11px]">Require live webcam access before entry</div>
                    </div>
                  </label>

                  {/* Mic */}
                  <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      name="microphoneRequired"
                      defaultChecked={currentRound.proctoringSettings.microphoneRequired}
                      className="mt-1 w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 bg-slate-800"
                    />
                    <div className="text-xs font-mono">
                      <div className="text-slate-200 font-bold">Mandatory Microphone</div>
                      <div className="text-slate-400 text-[11px]">Continuous audio activity monitoring</div>
                    </div>
                  </label>

                  {/* Fullscreen */}
                  <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      name="fullscreenRequired"
                      defaultChecked={currentRound.proctoringSettings.fullscreenRequired}
                      className="mt-1 w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 bg-slate-800"
                    />
                    <div className="text-xs font-mono">
                      <div className="text-slate-200 font-bold">Fullscreen Lockdown</div>
                      <div className="text-slate-400 text-[11px]">Enforce fullscreen mode and audit exits</div>
                    </div>
                  </label>

                  {/* Tab Monitoring */}
                  <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      name="tabMonitoring"
                      defaultChecked={currentRound.proctoringSettings.tabMonitoring}
                      className="mt-1 w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 bg-slate-800"
                    />
                    <div className="text-xs font-mono">
                      <div className="text-slate-200 font-bold">Tab Visibility Tracking</div>
                      <div className="text-slate-400 text-[11px]">Detect window blur and tab switching</div>
                    </div>
                  </label>

                  {/* Copy Block */}
                  <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      name="copyRestriction"
                      defaultChecked={currentRound.proctoringSettings.copyRestriction}
                      className="mt-1 w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 bg-slate-800"
                    />
                    <div className="text-xs font-mono">
                      <div className="text-slate-200 font-bold">Block Copying</div>
                      <div className="text-slate-400 text-[11px]">Prevent copying test questions/code</div>
                    </div>
                  </label>

                  {/* Paste Block */}
                  <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      name="pasteRestriction"
                      defaultChecked={currentRound.proctoringSettings.pasteRestriction}
                      className="mt-1 w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 bg-slate-800"
                    />
                    <div className="text-xs font-mono">
                      <div className="text-slate-200 font-bold">Block Pasting</div>
                      <div className="text-slate-400 text-[11px]">Intercept external clipboard pasting</div>
                    </div>
                  </label>
                </div>

                {/* Threshold & Action */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-900/40 border border-slate-800">
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-200 mb-1">
                      Max Tab Warnings Permitted:
                    </label>
                    <input
                      type="number"
                      name="maxTabWarnings"
                      defaultValue={currentRound.proctoringSettings.maxTabWarnings || 3}
                      min={1}
                      max={10}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
                    />
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">
                      Violations beyond this trigger the configured threshold action.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-200 mb-1">
                      Threshold Action:
                    </label>
                    <select
                      name="violationAction"
                      defaultValue={currentRound.proctoringSettings.violationAction || 'warning'}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
                    >
                      <option value="warning">Warning Only (Status marked WARNING)</option>
                      <option value="temporary_lock">Temporary Lock (Participant session locked)</option>
                      <option value="auto_submit">Auto-Submit Attempt</option>
                      <option value="review_required">Flag for Mandatory Review</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono font-bold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  Save Proctoring Configuration
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Snapshot Preview Modal */}
      {selectedSnapshot && (
        <Modal
          isOpen={Boolean(selectedSnapshot)}
          onClose={() => setSelectedSnapshot(null)}
          title="Candidate Webcam Snapshot Inspection"
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
              <img
                src={selectedSnapshot.imageUrl}
                alt="Enlarged snapshot"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
              <div>Captured: {new Date(selectedSnapshot.capturedAt).toLocaleString()}</div>
              <div>Status: {selectedSnapshot.status}</div>
              {selectedSnapshot.metadata?.notes && (
                <div className="text-amber-400">Notes: {selectedSnapshot.metadata.notes}</div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Plagiarism Side-by-Side Diff Modal */}
      {inspectingPair && (
        <Modal
          isOpen={Boolean(inspectingPair)}
          onClose={() => setInspectingPair(null)}
          title={`Plagiarism Diff: ${inspectingPair.problemTitle}`}
          maxWidth="4xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs font-mono">
              <div>
                Similarity Score:{' '}
                <span className="text-rose-400 font-bold text-sm">
                  {inspectingPair.similarityScore}% Match
                </span>
              </div>
              <div className="text-slate-400">
                Round: {inspectingPair.roundId}
              </div>
            </div>

            {/* Side-by-side view */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-cyan-300">
                  Candidate A: {inspectingPair.participantName1}
                </div>
                <div className="p-3 rounded-xl bg-[#060A14] border border-slate-800 text-xs font-mono text-slate-300 max-h-80 overflow-y-auto whitespace-pre leading-relaxed">
                  {inspectingPair.matchingSnippets && inspectingPair.matchingSnippets.length > 0
                    ? inspectingPair.matchingSnippets.join('\n\n--- MATCHING BLOCK ---\n\n')
                    : 'Candidate A submission code block'}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-cyan-300">
                  Candidate B: {inspectingPair.participantName2}
                </div>
                <div className="p-3 rounded-xl bg-[#060A14] border border-slate-800 text-xs font-mono text-slate-300 max-h-80 overflow-y-auto whitespace-pre leading-relaxed">
                  {inspectingPair.matchingSnippets && inspectingPair.matchingSnippets.length > 0
                    ? inspectingPair.matchingSnippets.join('\n\n--- MATCHING BLOCK ---\n\n')
                    : 'Candidate B submission code block'}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setInspectingPair(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono hover:bg-slate-700"
              >
                Close Diff
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Admin Notes / Flag Modal */}
      {notesModalSession && (
        <Modal
          isOpen={Boolean(notesModalSession)}
          onClose={() => setNotesModalSession(null)}
          title={`Proctoring Review: ${notesModalSession.participantName}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-xs font-mono text-slate-400">
              Add administrative notes and update review flags for this candidate session.
            </p>

            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g. Candidate left webcam frame at 14:20 and opened unauthorized browser window..."
              className="w-full h-28 bg-[#060A14] border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNotesModalSession(null)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSessionAction('flag_review', notesModalSession)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs"
              >
                Save &amp; Flag for Review
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
