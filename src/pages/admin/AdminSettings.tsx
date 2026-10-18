import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useNotification } from '../../context/NotificationContext.tsx';
import {
  Settings,
  RotateCcw,
  ShieldAlert,
  FileText,
  Bot,
  Sliders,
  Save,
  CheckCircle2,
  Key,
  Eye,
  EyeOff,
  Trophy,
  Activity,
  Shield,
  Zap,
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { showToast } = useNotification();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingAI, setSavingAI] = useState(false);
  const [savingComp, setSavingComp] = useState(false);
  const [savingWeights, setSavingWeights] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Form states
  const [aiConfig, setAIConfig] = useState({
    enabled: true,
    model: 'gemini-1.5-pro',
    allowInCompetition: true,
    defaultMode: 'competition' as 'practice' | 'competition',
    apiKey: '',
    systemPrompt: 'You are CODEQUEST AI Assistant, an elite competitive programming mentor and Socratic tutor.',
  });

  const [compSettings, setCompSettings] = useState({
    competitionName: 'CODEQUEST 2026',
    isRegistrationOpen: true,
    requireApproval: false,
    autoAdvanceQualified: true,
  });

  const [proctoringWeights, setProctoringWeights] = useState({
    tabSwitch: 15,
    fullscreenExit: 20,
    copyAttempt: 15,
    pasteAttempt: 20,
    cameraLost: 25,
    micLost: 15,
    suspiciousSimilarity: 50,
  });

  const loadData = async () => {
    try {
      const [logsRes, settingsRes] = await Promise.all([
        api.getAuditLogs(),
        api.getSettings(),
      ]);

      setLogs(logsRes.logs || []);

      if (settingsRes.aiConfig) {
        setAIConfig((prev) => ({
          ...prev,
          ...settingsRes.aiConfig,
          apiKey: settingsRes.aiConfig.apiKey || '',
        }));
      }

      if (settingsRes.competitionSettings) {
        setCompSettings((prev) => ({
          ...prev,
          ...settingsRes.competitionSettings,
        }));
      }

      if (settingsRes.proctoringWeights) {
        setProctoringWeights((prev) => ({
          ...prev,
          ...settingsRes.proctoringWeights,
        }));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load system settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveAISettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAI(true);
    try {
      await api.updateSettings({ aiConfig });
      showToast('AI Assistant configuration updated successfully!', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save AI configuration', 'error');
    } finally {
      setSavingAI(false);
    }
  };

  const handleSaveCompetitionSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingComp(true);
    try {
      await api.updateSettings({ competitionSettings: compSettings });
      showToast('Competition settings updated successfully!', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save competition settings', 'error');
    } finally {
      setSavingComp(false);
    }
  };

  const handleSaveProctoringWeights = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWeights(true);
    try {
      await api.updateSettings({ proctoringWeights });
      showToast('Proctoring violation penalty weights saved!', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save proctoring weights', 'error');
    } finally {
      setSavingWeights(false);
    }
  };

  const handleResetDatabase = async () => {
    if (
      !window.confirm(
        'DANGER: Are you sure you want to restore the CODEQUEST database to fresh initial seed state? This resets all participant attempts to demo baseline.'
      )
    ) {
      return;
    }

    setResetting(true);
    try {
      await api.resetDatabase();
      showToast('Database successfully restored to clean demo seeds!', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Reset failed', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#0F172A] to-[#0A0F1D] border border-purple-500/40 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              Competition Settings &amp; Administration
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400">
            Configure AI Assistant policies, competition rules, proctoring violation weights, and security audit logs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. AI Assistant Configuration Panel */}
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-cyan-500/30 shadow-xl space-y-6 font-mono text-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">AI Assistant Controls</h3>
                <p className="text-[11px] text-slate-400 font-sans">
                  Manage Gemini model, Socratic competition safeguards, and API keys.
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                aiConfig.enabled
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                  : 'bg-rose-950 text-rose-400 border border-rose-500/40'
              }`}
            >
              {aiConfig.enabled ? 'ACTIVE' : 'DISABLED'}
            </span>
          </div>

          <form onSubmit={handleSaveAISettings} className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <label className="text-slate-200 font-bold block">Enable AI Assistant Globally</label>
                <span className="text-[11px] text-slate-400 font-sans">
                  Allow candidates to interact with the floating AI co-pilot.
                </span>
              </div>
              <input
                type="checkbox"
                checked={aiConfig.enabled}
                onChange={(e) => setAIConfig({ ...aiConfig, enabled: e.target.checked })}
                className="w-5 h-5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 bg-slate-950"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <label className="text-slate-200 font-bold block">Allow During Active Competition</label>
                <span className="text-[11px] text-slate-400 font-sans">
                  Restricts AI to Socratic mode (hints and complexity only; never gives code).
                </span>
              </div>
              <input
                type="checkbox"
                checked={aiConfig.allowInCompetition}
                onChange={(e) => setAIConfig({ ...aiConfig, allowInCompetition: e.target.checked })}
                className="w-5 h-5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 bg-slate-950"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">AI Engine / Model</label>
                <select
                  value={aiConfig.model}
                  onChange={(e) => setAIConfig({ ...aiConfig, model: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  <option value="gemini-2.0-flash-thinking">Gemini 2.0 Flash Thinking</option>
                  <option value="built-in-algorithmic">Built-in Algorithmic Engine</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Default Mode</label>
                <select
                  value={aiConfig.defaultMode}
                  onChange={(e) => setAIConfig({ ...aiConfig, defaultMode: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="competition">Competition (Socratic)</option>
                  <option value="practice">Practice (Full Mentor)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Google Gemini API Key (Optional)</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={aiConfig.apiKey}
                  onChange={(e) => setAIConfig({ ...aiConfig, apiKey: e.target.value })}
                  placeholder="AIzaSy... (leave blank to use built-in engine)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                />
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-sans">
                When provided, queries are powered directly by Gemini LLM. When empty, CODEQUEST uses its built-in rule-based algorithmic reasoning engine.
              </p>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Custom System Instruction</label>
              <textarea
                rows={2}
                value={aiConfig.systemPrompt}
                onChange={(e) => setAIConfig({ ...aiConfig, systemPrompt: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-cyan-400 font-sans text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={savingAI}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingAI ? 'Saving AI Settings...' : 'Save AI Configuration'}</span>
            </button>
          </form>
        </div>

        {/* 2. Competition General Settings */}
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-purple-500/30 shadow-xl space-y-6 font-mono text-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-950 border border-purple-500/40 text-purple-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Competition Parameters</h3>
                <p className="text-[11px] text-slate-400 font-sans">
                  Tournament identity and registration lifecycle.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveCompetitionSettings} className="space-y-4">
            <div>
              <label className="block text-slate-400 mb-1">Official Competition Name</label>
              <input
                type="text"
                required
                value={compSettings.competitionName}
                onChange={(e) => setCompSettings({ ...compSettings, competitionName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <label className="text-slate-200 font-bold block">Open Public Registration</label>
                <span className="text-[11px] text-slate-400 font-sans">
                  Allow new participants to sign up on the portal.
                </span>
              </div>
              <input
                type="checkbox"
                checked={compSettings.isRegistrationOpen}
                onChange={(e) => setCompSettings({ ...compSettings, isRegistrationOpen: e.target.checked })}
                className="w-5 h-5 rounded border-slate-700 text-purple-500 focus:ring-purple-400 bg-slate-950"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <label className="text-slate-200 font-bold block">Auto-Advance Qualified Candidates</label>
                <span className="text-[11px] text-slate-400 font-sans">
                  Automatically unlocks subsequent rounds when passing score threshold.
                </span>
              </div>
              <input
                type="checkbox"
                checked={compSettings.autoAdvanceQualified}
                onChange={(e) => setCompSettings({ ...compSettings, autoAdvanceQualified: e.target.checked })}
                className="w-5 h-5 rounded border-slate-700 text-purple-500 focus:ring-purple-400 bg-slate-950"
              />
            </div>

            <button
              type="submit"
              disabled={savingComp}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingComp ? 'Saving...' : 'Save Competition Settings'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* 3. Proctoring Violation Penalty Weights */}
      <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-6 font-mono text-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-950 border border-amber-500/40 text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Proctoring Penalty Scoring Weights</h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Points added to candidate's Violation Score upon anti-cheat event trigger.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProctoringWeights} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Tab Switch Penalty</label>
              <input
                type="number"
                min="0"
                max="100"
                value={proctoringWeights.tabSwitch}
                onChange={(e) => setProctoringWeights({ ...proctoringWeights, tabSwitch: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Fullscreen Exit</label>
              <input
                type="number"
                min="0"
                max="100"
                value={proctoringWeights.fullscreenExit}
                onChange={(e) => setProctoringWeights({ ...proctoringWeights, fullscreenExit: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Copy Attempt</label>
              <input
                type="number"
                min="0"
                max="100"
                value={proctoringWeights.copyAttempt}
                onChange={(e) => setProctoringWeights({ ...proctoringWeights, copyAttempt: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Paste Attempt</label>
              <input
                type="number"
                min="0"
                max="100"
                value={proctoringWeights.pasteAttempt}
                onChange={(e) => setProctoringWeights({ ...proctoringWeights, pasteAttempt: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Camera Feed Lost</label>
              <input
                type="number"
                min="0"
                max="100"
                value={proctoringWeights.cameraLost}
                onChange={(e) => setProctoringWeights({ ...proctoringWeights, cameraLost: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Mic Feed Lost</label>
              <input
                type="number"
                min="0"
                max="100"
                value={proctoringWeights.micLost}
                onChange={(e) => setProctoringWeights({ ...proctoringWeights, micLost: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Suspicious Code Similarity</label>
              <input
                type="number"
                min="0"
                max="100"
                value={proctoringWeights.suspiciousSimilarity}
                onChange={(e) => setProctoringWeights({ ...proctoringWeights, suspiciousSimilarity: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={savingWeights}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-600/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingWeights ? 'Saving...' : 'Save Weights'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 4. Danger Zone: Reset to Demo Seed Data */}
      <div className="p-6 rounded-2xl bg-[#0F172A] border border-rose-500/30 shadow-xl space-y-4 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Reset Database to Seed State</h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Restores four official rounds, 10 quiz questions, algorithmic problems, and demo contestants.
              </p>
            </div>
          </div>

          <button
            onClick={handleResetDatabase}
            disabled={resetting}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-lg shadow-rose-600/25 flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
          >
            <RotateCcw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Resetting Database...' : 'Restore Seed Baseline'}</span>
          </button>
        </div>
      </div>

      {/* 5. Audit Logs Table */}
      <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white">System Security &amp; Action Audit Trail</h3>
          </div>
          <span className="text-slate-400 text-[11px]">{logs.length} Logged Events</span>
        </div>

        <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#0B1120] text-slate-400 text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-cyan-300 font-semibold">{log.userName}</td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700 text-purple-300">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-300 max-w-md truncate font-sans text-xs">
                    {log.details}
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
