import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import type { Submission } from '../types/index.ts';
import { Badge } from '../components/common/Badge.tsx';
import { Modal } from '../components/common/Modal.tsx';
import {
  History,
  FileCode,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Clock,
  Terminal,
} from 'lucide-react';

interface SubmissionsHistoryPageProps {
  onNavigate: (path: string) => void;
}

export const SubmissionsHistoryPage: React.FC<SubmissionsHistoryPageProps> = ({ onNavigate }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [roundFilter, setRoundFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [inspectSubmission, setInspectSubmission] = useState<Submission | null>(null);

  const loadSubmissions = async () => {
    try {
      const res = await api.getSubmissions();
      setSubmissions(res.submissions || []);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const filtered = submissions.filter((s) => {
    if (roundFilter !== 'all' && s.roundId !== roundFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0C1425] via-[#0F172A] to-[#0A0F1D] border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              Submission History
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400">
            Audit trail of all sandbox code submissions and verdicts
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <select
            value={roundFilter}
            onChange={(e) => setRoundFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="all">All Rounds</option>
            <option value="round_02_coding">Round 2: Coding</option>
            <option value="round_03_debugging">Round 3: Debugging</option>
            <option value="round_04_final">Round 4: Final</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="all">All Verdicts</option>
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
                <th className="py-3.5 px-4">Problem</th>
                <th className="py-3.5 px-4">Stage</th>
                <th className="py-3.5 px-4">Language</th>
                <th className="py-3.5 px-4 text-center">Verdict</th>
                <th className="py-3.5 px-4 text-center">Test Cases</th>
                <th className="py-3.5 px-4 text-center">Score</th>
                <th className="py-3.5 px-4 text-center">Runtime</th>
                <th className="py-3.5 px-4 text-right">Submitted At</th>
                <th className="py-3.5 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
                    <span>Loading Submissions Log...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No submissions found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white max-w-[200px] truncate">
                      {s.problemTitle}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 uppercase text-[11px]">
                      {s.problemType}
                    </td>

                    <td className="py-3.5 px-4 text-cyan-300 font-semibold uppercase text-[11px]">
                      {s.language}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Badge status={s.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-center text-slate-300">
                      {s.passedTestCases} / {s.totalTestCases}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-cyan-400">
                      {s.score} / {s.maxScore}
                    </td>

                    <td className="py-3.5 px-4 text-center text-slate-400">
                      {s.executionTimeMs}ms
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
                      {new Date(s.submittedAt).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setInspectSubmission(s)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors"
                        title="View Submitted Code"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Inspection Modal */}
      {inspectSubmission && (
        <Modal
          isOpen={!!inspectSubmission}
          onClose={() => setInspectSubmission(null)}
          title={`Submission: ${inspectSubmission.problemTitle}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <div>
                <span className="text-slate-500 block text-[10px]">VERDICT</span>
                <Badge status={inspectSubmission.status} size="sm" />
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">SCORE</span>
                <span className="font-bold text-cyan-400">
                  {inspectSubmission.score} / {inspectSubmission.maxScore} pts
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">TIME / MEM</span>
                <span className="text-slate-300">
                  {inspectSubmission.executionTimeMs}ms
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] mb-1 font-bold">
                Submitted Code ({inspectSubmission.language}):
              </span>
              <pre className="p-4 rounded-xl bg-[#070B14] border border-slate-800 text-slate-200 overflow-x-auto whitespace-pre font-mono leading-relaxed max-h-96">
                {inspectSubmission.code}
              </pre>
            </div>

            <div className="text-[11px] text-slate-500 font-sans border-t border-slate-800 pt-3">
              Note: Hidden test case inputs and expected outputs are confidential and protected by the CODEQUEST evaluation sandbox.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
