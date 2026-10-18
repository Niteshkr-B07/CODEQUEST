import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useNotification } from '../../context/NotificationContext.tsx';
import type { Round } from '../../types/index.ts';
import { Badge } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import {
  Swords,
  Plus,
  Play,
  Pause,
  StopCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Clock,
  Award,
} from 'lucide-react';

export const AdminRounds: React.FC = () => {
  const { showToast } = useNotification();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRound, setEditingRound] = useState<Round | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<'quiz' | 'coding' | 'debugging' | 'final'>('coding');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [maxScore, setMaxScore] = useState(100);
  const [ruleType, setRuleType] = useState<'top_n' | 'min_score' | 'percentage'>('top_n');
  const [ruleValue, setRuleValue] = useState(20);

  const loadRounds = async () => {
    try {
      const res = await api.getAdminRounds();
      setRounds(res.rounds || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load rounds', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRounds();
  }, []);

  const openCreateModal = () => {
    setEditingRound(null);
    setName('');
    setType('coding');
    setDescription('');
    setDurationMinutes(30);
    setMaxScore(100);
    setRuleType('top_n');
    setRuleValue(20);
    setIsModalOpen(true);
  };

  const openEditModal = (r: Round) => {
    setEditingRound(r);
    setName(r.name);
    setType(r.type);
    setDescription(r.description);
    setDurationMinutes(r.durationMinutes);
    setMaxScore(r.maxScore);
    if (r.qualificationRule) {
      setRuleType(r.qualificationRule.type);
      setRuleValue(r.qualificationRule.value);
    }
    setIsModalOpen(true);
  };

  const handleSaveRound = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        type,
        description,
        durationMinutes: Number(durationMinutes),
        maxScore: Number(maxScore),
        qualificationRule: {
          type: ruleType,
          value: Number(ruleValue),
        },
      };

      if (editingRound) {
        await api.updateRound(editingRound.id, payload);
        showToast(`Round ${editingRound.roundNumber} updated successfully!`, 'success');
      } else {
        await api.createRound(payload);
        showToast('New battle round created!', 'success');
      }

      setIsModalOpen(false);
      loadRounds();
    } catch (err: any) {
      showToast(err.message || 'Failed to save round', 'error');
    }
  };

  const handleStatusChange = async (roundId: string, newStatus: string) => {
    try {
      await api.changeRoundStatus(roundId, newStatus);
      showToast(`Round status transitioned to ${newStatus.toUpperCase()}`, 'success');
      loadRounds();
    } catch (err: any) {
      showToast(err.message || 'Failed to update round status', 'error');
    }
  };

  const handleDeleteRound = async (r: Round) => {
    if (!window.confirm(`Are you sure you want to permanently delete Round ${r.roundNumber}: ${r.name}?`)) {
      return;
    }

    try {
      await api.deleteRound(r.id);
      showToast(`Round ${r.roundNumber} deleted`, 'success');
      loadRounds();
    } catch (err: any) {
      showToast(err.message || 'Deletion failed', 'error');
    }
  };

  const handleEvaluateQualifications = async (roundId: string) => {
    try {
      const res = await api.evaluateRoundQualifications(roundId);
      showToast(
        `Qualification Engine Evaluated: ${res.qualifiedCount} Qualified, ${res.eliminatedCount} Eliminated!`,
        'success'
      );
      loadRounds();
    } catch (err: any) {
      showToast(err.message || 'Qualification evaluation failed', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#0F172A] to-[#0A0F1D] border border-purple-500/40 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Swords className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              Competition Rounds Engine
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400">
            Configure round timing, lifecycle statuses, scoring weights, and automated qualification cutoffs
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Round</span>
        </button>
      </div>

      {/* Rounds Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-500 font-mono text-xs">
            <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
            <span>Loading Round Engines...</span>
          </div>
        ) : (
          rounds.map((round) => (
            <div
              key={round.id}
              className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-mono font-bold uppercase text-purple-400">
                    Stage 0{round.roundNumber}
                  </span>
                  <h3 className="text-xl font-bold font-mono text-white">
                    {round.name}
                  </h3>
                  <Badge status={round.status.toUpperCase()} size="sm" />
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-900 border border-slate-700 text-slate-300">
                    Type: {round.type}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed max-w-3xl">
                  {round.description}
                </p>

                {/* Qualification rule badge & metadata */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                  <span>Duration: <strong className="text-slate-200">{round.durationMinutes}m</strong></span>
                  <span>Max Points: <strong className="text-cyan-400">{round.maxScore} pts</strong></span>
                  {round.qualificationRule && (
                    <span className="p-1 px-2 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300 text-[11px]">
                      Qualification Rule: {round.qualificationRule.type.replace('_', ' ').toUpperCase()} = {round.qualificationRule.value}
                    </span>
                  )}
                  {round.proctoringSettings && (
                    <span className="p-1 px-2 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[11px] flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-cyan-400" />
                      Proctored: {round.proctoringSettings.maxTabWarnings} Warnings Max • {round.proctoringSettings.violationAction}
                    </span>
                  )}
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                {round.status !== 'active' ? (
                  <button
                    onClick={() => handleStatusChange(round.id, 'active')}
                    className="px-3 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 flex items-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Activate</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(round.id, 'paused')}
                    className="px-3 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/50 text-amber-300 flex items-center gap-1.5 transition-colors"
                  >
                    <Pause className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pause</span>
                  </button>
                )}

                {round.status !== 'closed' && (
                  <button
                    onClick={() => handleStatusChange(round.id, 'closed')}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
                  >
                    <StopCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Close Round</span>
                  </button>
                )}

                <button
                  onClick={() => handleEvaluateQualifications(round.id)}
                  title="Run qualification evaluation"
                  className="px-3 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/50 text-cyan-300 flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Evaluate Cuts</span>
                </button>

                <button
                  onClick={() => openEditModal(round)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
                  title="Edit Round"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteRound(round)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Delete Round"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Round Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingRound ? `Edit Round 0${editingRound.roundNumber}` : 'Create New Competition Round'}
          maxWidth="lg"
        >
          <form onSubmit={handleSaveRound} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-slate-300 mb-1">Round Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Algorithmic Sprint"
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Round Type *</label>
                <select
                  value={type}
                  onChange={(e: any) => setType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-purple-400"
                >
                  <option value="quiz">Quiz Battle (MCQ)</option>
                  <option value="coding">Coding Battle (Sandbox)</option>
                  <option value="debugging">Debugging Battle</option>
                  <option value="final">Final Championship</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Duration (Minutes) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Maximum Points *</label>
              <input
                type="number"
                required
                min={10}
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Qualification Rule *</label>
                <select
                  value={ruleType}
                  onChange={(e: any) => setRuleType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-purple-400"
                >
                  <option value="top_n">Top N Qualify</option>
                  <option value="min_score">Minimum Score Required</option>
                  <option value="percentage">Top Percentage (%)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Rule Cutoff Value *</label>
                <input
                  type="number"
                  required
                  value={ruleValue}
                  onChange={(e) => setRuleValue(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of challenges and format..."
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-purple-400 resize-none font-sans"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-md shadow-purple-600/30"
              >
                Save Round
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
