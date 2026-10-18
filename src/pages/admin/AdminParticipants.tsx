import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useNotification } from '../../context/NotificationContext.tsx';
import { Badge } from '../../components/common/Badge.tsx';
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Mail,
  Building,
} from 'lucide-react';

export const AdminParticipants: React.FC = () => {
  const { showToast } = useNotification();
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadParticipants = async () => {
    try {
      const res = await api.getAdminParticipants();
      setParticipants(res.participants || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load participants', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParticipants();
  }, []);

  const handleToggleDisqualify = async (p: any) => {
    const actionName = p.isDisqualified ? 'reinstate' : 'disqualify';
    if (!window.confirm(`Are you sure you want to ${actionName} participant ${p.fullName}?`)) {
      return;
    }

    try {
      const res = await api.toggleDisqualify(p.id);
      showToast(
        `Participant ${res.isDisqualified ? 'disqualified' : 'reinstated'} successfully`,
        'success'
      );
      loadParticipants();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const filtered = participants.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.organization.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#0F172A] to-[#0A0F1D] border border-purple-500/40 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              Participant Registry &amp; Moderation
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400">
            Audit contestant records, verify affiliations, monitor scores, and moderate eligibility
          </p>
        </div>

        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search participant or university..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
          />
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl shadow-xl overflow-hidden font-mono text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B1120] border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                <th className="py-3.5 px-4">Participant</th>
                <th className="py-3.5 px-4">Institution / Contact</th>
                <th className="py-3.5 px-3 text-center">R1 (Quiz)</th>
                <th className="py-3.5 px-3 text-center">R2 (Coding)</th>
                <th className="py-3.5 px-3 text-center">R3 (Debug)</th>
                <th className="py-3.5 px-3 text-center">R4 (Final)</th>
                <th className="py-3.5 px-4 text-center">Total Score</th>
                <th className="py-3.5 px-4 text-center">Eligibility</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
                    <span>Loading Contestant Database...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    No participants matched your search.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      p.isDisqualified ? 'bg-rose-950/20 opacity-75' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                      {p.rank !== '-' ? `#${p.rank}` : '-'}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-xs">{p.fullName}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{p.email}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="truncate max-w-[200px]">{p.organization}</div>
                      <div className="text-[10px] text-slate-500">{p.phoneNumber || 'No phone'}</div>
                    </td>

                    <td className="py-3.5 px-3 text-center text-cyan-300 font-semibold">
                      {p.roundWiseScores.round1}
                    </td>

                    <td className="py-3.5 px-3 text-center text-emerald-300 font-semibold">
                      {p.roundWiseScores.round2}
                    </td>

                    <td className="py-3.5 px-3 text-center text-amber-300 font-semibold">
                      {p.roundWiseScores.round3}
                    </td>

                    <td className="py-3.5 px-3 text-center text-purple-300 font-semibold">
                      {p.roundWiseScores.round4}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-cyan-400">
                      {p.totalScore}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        status={p.isDisqualified ? 'ELIMINATED' : 'ACTIVE'}
                        size="sm"
                      />
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleDisqualify(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono border transition-colors ${
                          p.isDisqualified
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/40'
                            : 'bg-rose-950/40 border-rose-500/50 text-rose-300 hover:bg-rose-900/40'
                        }`}
                      >
                        {p.isDisqualified ? 'Reinstate' : 'Disqualify'}
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
  );
};
