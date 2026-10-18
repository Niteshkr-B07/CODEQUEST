import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useNotification } from '../../context/NotificationContext.tsx';
import type { CodingProblem, DebuggingProblem } from '../../types/index.ts';
import { Badge } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import {
  FileCode,
  Bug,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  Lock,
  Eye,
  CheckCircle2,
} from 'lucide-react';

export const AdminProblems: React.FC = () => {
  const { showToast } = useNotification();
  const [codingProblems, setCodingProblems] = useState<CodingProblem[]>([]);
  const [debuggingProblems, setDebuggingProblems] = useState<DebuggingProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'coding' | 'debugging'>('coding');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<any>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [roundId, setRoundId] = useState('round_02_coding');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [points, setPoints] = useState(100);
  const [timeLimitMs, setTimeLimitMs] = useState(2000);
  const [description, setDescription] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [constraints, setConstraints] = useState('');
  const [starterPython, setStarterPython] = useState('');
  const [starterJs, setStarterJs] = useState('');
  // Debugging specific
  const [buggyCode, setBuggyCode] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  // Test cases (list)
  const [testCases, setTestCases] = useState<
    { id: string; input: string; expectedOutput: string; isHidden: boolean; explanation?: string }[]
  >([]);

  const loadProblems = async () => {
    try {
      const res = await api.getAdminProblems();
      setCodingProblems(res.codingProblems || []);
      setDebuggingProblems(res.debuggingProblems || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load problems', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProblems();
  }, []);

  const openCreateModal = (type: 'coding' | 'debugging') => {
    setEditingProblem(null);
    setTitle('');
    setRoundId(type === 'coding' ? 'round_02_coding' : 'round_03_debugging');
    setDifficulty('medium');
    setPoints(100);
    setTimeLimitMs(2000);
    setDescription('');
    setInputFormat('');
    setOutputFormat('');
    constraints;
    setStarterPython('');
    setStarterJs('');
    setBuggyCode('');
    setExpectedBehavior('');
    setTestCases([
      { id: 'tc_1', input: 'sample input', expectedOutput: 'sample output', isHidden: false },
      { id: 'tc_2', input: 'hidden edge case input', expectedOutput: 'hidden output', isHidden: true },
    ]);
    setIsModalOpen(true);
  };

  const handleAddTestCase = () => {
    setTestCases([
      ...testCases,
      {
        id: `tc_${Date.now()}`,
        input: '',
        expectedOutput: '',
        isHidden: true,
      },
    ]);
  };

  const handleRemoveTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const handleSaveProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        type: activeTab,
        title,
        roundId,
        difficulty,
        points: Number(points),
        timeLimitMs: Number(timeLimitMs),
        memoryLimitMb: 128,
        description,
        testCases,
      };

      if (activeTab === 'coding') {
        payload.inputFormat = inputFormat;
        payload.outputFormat = outputFormat;
        payload.constraints = constraints;
        payload.starterCode = {
          python: starterPython,
          javascript: starterJs,
          cpp: '',
        };
      } else {
        payload.buggyCode = buggyCode;
        payload.expectedBehavior = expectedBehavior;
        payload.language = 'python';
        payload.starterCode = {
          python: buggyCode,
          javascript: '',
        };
      }

      await api.createProblem(payload);
      showToast('Problem successfully configured and test suite locked!', 'success');
      setIsModalOpen(false);
      loadProblems();
    } catch (err: any) {
      showToast(err.message || 'Failed to save problem', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#0F172A] to-[#0A0F1D] border border-purple-500/40 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileCode className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              Problem &amp; Test Suite Engine
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400">
            Configure algorithmic problems, starter templates, public samples, and hidden validation suites
          </p>
        </div>

        <button
          onClick={() => openCreateModal(activeTab)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New {activeTab === 'coding' ? 'Coding Challenge' : 'Debugging Defect'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 font-mono text-xs border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('coding')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'coding'
              ? 'bg-cyan-950 border border-cyan-400 text-cyan-300 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-4 h-4 text-cyan-400" />
          <span>Coding Battle &amp; Final Problems ({codingProblems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('debugging')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'debugging'
              ? 'bg-amber-950 border border-amber-400 text-amber-300 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bug className="w-4 h-4 text-amber-400" />
          <span>Debugging Battle Defects ({debuggingProblems.length})</span>
        </button>
      </div>

      {/* Problems List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-500 font-mono text-xs">
            <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
            <span>Loading Problem Definitions...</span>
          </div>
        ) : (
          (activeTab === 'coding' ? codingProblems : debuggingProblems).map((p: any) => (
            <div
              key={p.id}
              className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-4 font-mono text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white">{p.title}</h3>
                  <Badge status={p.difficulty.toUpperCase()} size="sm" />
                  <span className="text-slate-500 text-[11px]">Round: {p.roundId}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-cyan-400 font-bold text-sm">+{p.points} pts</span>
                  <span className="text-slate-400">{p.timeLimitMs}ms limit</span>
                </div>
              </div>

              <p className="text-slate-300 text-xs font-sans line-clamp-2">
                {p.description}
              </p>

              {/* Test Cases Counter */}
              <div className="flex items-center gap-4 text-[11px] text-slate-400 bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Sample Test Cases: {p.testCases ? p.testCases.filter((tc: any) => !tc.isHidden).length : p.sampleTestCases?.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <span>
                    Hidden Test Cases: {p.testCases ? p.testCases.filter((tc: any) => tc.isHidden).length : 'Encrypted Sandbox'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Configure ${activeTab === 'coding' ? 'Coding Problem' : 'Debugging Defect'}`}
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveProblem} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-slate-300 mb-1">Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Reverse Pairs in Logarithmic Time"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Round Assignment</label>
                <select
                  value={roundId}
                  onChange={(e) => setRoundId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none"
                >
                  <option value="round_02_coding">Round 2: Coding</option>
                  <option value="round_03_debugging">Round 3: Debugging</option>
                  <option value="round_04_final">Round 4: Final</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e: any) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Max Points</label>
                <input
                  type="number"
                  min={10}
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Problem Statement *</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Clear specification, mathematical bounds, and task..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none font-sans"
              />
            </div>

            {activeTab === 'debugging' ? (
              <>
                <div>
                  <label className="block text-slate-300 mb-1">Expected Behavior *</label>
                  <textarea
                    rows={2}
                    required
                    value={expectedBehavior}
                    onChange={(e) => setExpectedBehavior(e.target.value)}
                    placeholder="Describe correct behavior..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none font-sans"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Buggy Code Snippet (Python) *</label>
                  <textarea
                    rows={4}
                    required
                    value={buggyCode}
                    onChange={(e) => setBuggyCode(e.target.value)}
                    placeholder="# Broken code for contestant to repair..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none whitespace-pre"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Input Format</label>
                    <input
                      type="text"
                      value={inputFormat}
                      onChange={(e) => setInputFormat(e.target.value)}
                      placeholder="e.g. N integers on line 1"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Output Format</label>
                    <input
                      type="text"
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value)}
                      placeholder="e.g. Single integer output"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Starter Code (Python)</label>
                  <textarea
                    rows={3}
                    value={starterPython}
                    onChange={(e) => setStarterPython(e.target.value)}
                    placeholder="import sys..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none whitespace-pre"
                  />
                </div>
              </>
            )}

            {/* Test Cases Manager */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">Test Cases ({testCases.length})</span>
                <button
                  type="button"
                  onClick={handleAddTestCase}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Case</span>
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {testCases.map((tc, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-300">Case #{idx + 1}</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-400">
                          <input
                            type="checkbox"
                            checked={tc.isHidden}
                            onChange={(e) => {
                              const updated = [...testCases];
                              updated[idx].isHidden = e.target.checked;
                              setTestCases(updated);
                            }}
                          />
                          <span>Hidden (Confidential)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveTestCase(idx)}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Stdin input"
                        value={tc.input}
                        onChange={(e) => {
                          const updated = [...testCases];
                          updated[idx].input = e.target.value;
                          setTestCases(updated);
                        }}
                        className="p-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Expected stdout"
                        value={tc.expectedOutput}
                        onChange={(e) => {
                          const updated = [...testCases];
                          updated[idx].expectedOutput = e.target.value;
                          setTestCases(updated);
                        }}
                        className="p-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
              >
                Save Problem
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
