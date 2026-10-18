import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useNotification } from '../../context/NotificationContext.tsx';
import type { Submission } from '../../types/index.ts';
import { Badge } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import {
  CheckSquare,
  Search,
  RefreshCw,
  Eye,
  RotateCcw,
  Clock,
  Terminal,
} from 'lucide-react';

export const AdminSubmissions: React.FC = () => {
  const { showToast } = useNotification();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roundFilter, setRoundFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [inspectSubmission, setInspectSubmission] = useState<any>(null);
  const [reEvaluatingId, setReEvaluatingId] = useState<string | null>(null);

  const loadSubmissions = async () => {
    try {
      const res = await api.getAdminSubmissions({
        roundId: roundFilter !== 'all' ? roundFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setSubmissions(res.submissions || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load submissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [roundFilter, statusFilter]);

  const handleReEvaluate = async (sub: any) => {
    setReEvaluatingId(sub.id);
    try {
      const res = await api.reEvaluateSubmission(sub.id);
      showToast(
        `Re-evaluation complete! New Verdict: ${res.submission.status}, Score: ${res.submission.score}`,
        'success'
      );
      loadSubmissions();
    } catch (err: any) {
      showToast(err.message || 'Re-evaluation failed', 'error');
    } finally {
      setReEvaluatingId(null);
    }
  };

  const filtered = submissions.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.userName && s.userName.toLowerCase().includes(q)) ||
      (s.problemTitle && s.problemTitle.toLowerCase().includes(q)) ||
      (s.userOrg && s.userOrg.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#0F172A] to-[#0A0F1D] border border-purple-500/40 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              Submissions Oversight &amp; Audit
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400">
            Inspect all contestant code, monitor sandbox runtimes, and trigger on-demand re-evaluations
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contestant..."
              className="w-full pl-8 pr-2 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          <select
            value={roundFilter}
            onChange={(e) => setRoundFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
          >
            <option value="all">All Rounds</option>
            <option value="round_02_coding">Round 2: Coding</option>
            <option value="round_03_debugging">Round 3: Debugging</option>
            <option value="round_04_final">Round 4: Final</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="WRONG_ANSWER">WRONG ANSWER</option>
            <option value="TIME_LIMIT_EXCEEDED">TIME LIMIT</option>
            <option value="COMPILATION_ERROR">COMPILATION ERROR</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl shadow-xl overflow-hidden font-mono text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B1120] border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Participant</th>
                <th className="py-3.5 px-4">Problem</th>
                <th className="py-3.5 px-3">Lang</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-3 text-center">Test Cases</th>
                <th className="py-3.5 px-3 text-center">Score</th>
                <th className="py-3.5 px-3 text-center">Time</th>
                <th className="py-3.5 px-4 text-right">Timestamp</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
                    <span>Loading Submissions Log...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No submissions found.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-xs">{s.userName}</div>
                      <div className="text-[10px] text-slate-400">{s.userOrg}</div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-300 max-w-[180px] truncate">
                      {s.problemTitle}
                    </td>

                    <td className="py-3.5 px-3 uppercase text-cyan-300 font-bold">
                      {s.language}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <Badge status={s.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-3 text-center text-slate-300">
                      {s.passedTestCases} / {s.totalTestCases}
                    </td>

                    <td className="py-3.5 px-3 text-center font-bold text-cyan-400">
                      {s.score} / {s.maxScore}
                    </td>

                    <td className="py-3.5 px-3 text-center text-slate-400">
                      {s.executionTimeMs}ms
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-400 text-[10px]">
                      {new Date(s.submittedAt).toLocaleTimeString()}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setInspectSubmission(s)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
                          title="View Code & Diagnostics"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleReEvaluate(s)}
                          disabled={reEvaluatingId === s.id}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-purple-300 transition-colors disabled:opacity-50"
                          title="Re-run in Sandbox"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${reEvaluatingId === s.id ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Inspection Modal for Admin */}
      {inspectSubmission && (
        <Modal
          isOpen={!!inspectSubmission}
          onClose={() => setInspectSubmission(null)}
          title={`Contestant Submission: ${inspectSubmission.userName} (${inspectSubmission.problemTitle})`}
          maxWidth="4xl"
        >
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-4 gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <div>
                <span className="text-slate-500 block text-[10px]">VERDICT</span>
                <Badge status={inspectSubmission.status} size="sm" />
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">POINTS</span>
                <span className="font-bold text-cyan-400">
                  {inspectSubmission.score} / {inspectSubmission.maxScore}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">RUNTIME</span>
                <span className="text-slate-200">{inspectSubmission.executionTimeMs}ms</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">TESTS PASSED</span>
                <span className="text-slate-200">
                  {inspectSubmission.passedTestCases} / {inspectSubmission.totalTestCases}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] font-bold mb-1">
                Submitted Solution Code:
              </span>
              <pre className="p-4 rounded-xl bg-[#070B14] border border-slate-800 text-slate-200 overflow-x-auto whitespace-pre font-mono leading-relaxed max-h-96">
                {inspectSubmission.code}
              </pre>
            </div>

            {/* Test Case Execution Audit Results */}
            {inspectSubmission.testCaseResults && inspectSubmission.testCaseResults.length > 0 && (
              <div className="space-y-2">
                <span className="text-slate-400 block text-[11px] font-bold">
                  Test Case Diagnostics:
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {inspectSubmission.testCaseResults.map((tc: any, i: number) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-lg border flex items-center justify-between ${
                        tc.passed
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      <span className="font-bold">Test Case #{i + 1}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-400">{tc.executionTimeMs}ms</span>
                        <Badge status={tc.status} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
