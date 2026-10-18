import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { useNotification } from '../context/NotificationContext.tsx';
import type { CodingProblem } from '../types/index.ts';
import { CodeEditor } from '../components/common/CodeEditor.tsx';
import { Badge } from '../components/common/Badge.tsx';
import {
  FileCode,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Cpu,
  Layers,
  Sparkles,
  Terminal,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useProctoring } from '../hooks/useProctoring.ts';
import { ProctoringSystemCheck } from '../components/proctoring/ProctoringSystemCheck.tsx';
import { ProctoringHUD } from '../components/proctoring/ProctoringHUD.tsx';

interface CodingBattlePageProps {
  roundId: string;
  onNavigate: (path: string) => void;
}

export const CodingBattlePage: React.FC<CodingBattlePageProps> = ({ roundId, onNavigate }) => {
  const { showToast } = useNotification();
  const [round, setRound] = useState<any>(null);
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [selectedProblemIndex, setSelectedProblemIndex] = useState(0);
  const [language, setLanguage] = useState<'python' | 'javascript' | 'cpp'>('python');
  const [code, setCode] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'problem' | 'testcases' | 'submissions'>('problem');
  const [problemSubmissions, setProblemSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSystemCheck, setShowSystemCheck] = useState(false);
  const [hasCompletedSystemCheck, setHasCompletedSystemCheck] = useState(false);

  const proctoring = useProctoring({
    roundId,
    settings: round?.proctoringSettings,
    enabled: hasCompletedSystemCheck,
    onAutoSubmit: () => {
      showToast('Session auto-submitted due to proctoring policy violation', 'warning');
    },
    onViolation: (msg) => showToast(msg, 'warning'),
  });

  const currentProblem = problems[selectedProblemIndex];

  const loadRoundProblems = async () => {
    try {
      const data = await api.getProblemsForRound(roundId);
      setRound(data.round);
      setProblems(data.problems);

      if (data.problems.length > 0) {
        const first = data.problems[0];
        setCode(first.starterCode[language] || first.starterCode.python || '');
        loadSubmissionsForProblem(first.id);
      }

      // Check proctoring session
      try {
        const procData = await api.getProctoringSession(roundId);
        if (procData?.proctoringSettings && !procData?.consent) {
          setShowSystemCheck(true);
        } else {
          setHasCompletedSystemCheck(true);
          proctoring.startMediaStream();
        }
      } catch {
        setHasCompletedSystemCheck(true);
        proctoring.startMediaStream();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load Coding Battle problems', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissionsForProblem = async (probId: string) => {
    try {
      const res = await api.getSubmissions({ roundId, problemId: probId });
      setProblemSubmissions(res.submissions || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadRoundProblems();
  }, [roundId]);

  const handleSelectProblem = (idx: number) => {
    setSelectedProblemIndex(idx);
    const p = problems[idx];
    if (p) {
      setCode(p.starterCode[language] || p.starterCode.python || '');
      setRunResult(null);
      setSubmissionResult(null);
      loadSubmissionsForProblem(p.id);
    }
  };

  const handleLanguageChange = (newLang: string) => {
    const langKey = newLang as 'python' | 'javascript' | 'cpp';
    setLanguage(langKey);
    if (currentProblem) {
      setCode(currentProblem.starterCode[langKey] || currentProblem.starterCode.python || '');
    }
  };

  const handleResetStarter = () => {
    if (currentProblem) {
      setCode(currentProblem.starterCode[language] || currentProblem.starterCode.python || '');
      showToast('Starter template reset', 'info');
    }
  };

  const handleRunCode = async () => {
    if (!currentProblem || isRunning) return;
    setIsRunning(true);
    setRunResult(null);
    setSubmissionResult(null);
    setActiveTab('testcases');

    try {
      const res = await api.runCode({
        problemId: currentProblem.id,
        roundId,
        language,
        code,
      });
      setRunResult(res.result);
      if (res.result.overallStatus === 'ACCEPTED') {
        showToast('Sample test cases passed!', 'success');
      } else {
        showToast(`Sample test result: ${res.result.overallStatus}`, 'warning');
      }
    } catch (err: any) {
      showToast(err.message || 'Run execution failed', 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!currentProblem || isSubmitting) return;
    setIsSubmitting(true);
    setRunResult(null);
    setSubmissionResult(null);
    setActiveTab('testcases');

    try {
      const res = await api.submitCode({
        problemId: currentProblem.id,
        roundId,
        language,
        code,
      });

      setSubmissionResult(res.submission);
      loadSubmissionsForProblem(currentProblem.id);

      if (res.submission.status === 'ACCEPTED') {
        showToast(`ACCEPTED! +${res.submission.score} points awarded`, 'success');
        try {
          confetti({
            particleCount: 90,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      } else {
        showToast(
          `Result: ${res.submission.status} (${res.submission.passedTestCases}/${res.submission.totalTestCases} passed)`,
          'warning'
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="font-mono text-xs text-slate-400">Loading Coding Battle Arena...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#0D1322] border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
                Round 02
              </span>
              <Badge status={round?.status || 'ACTIVE'} size="sm" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
              Coding Battle Arena
            </h1>
          </div>
        </div>

        {/* Problem selector tabs */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {problems.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => handleSelectProblem(idx)}
              className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${
                selectedProblemIndex === idx
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 font-bold shadow'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Problem {idx + 1}</span>
              {p.userStats?.isSolved && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {currentProblem ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Problem Statement & Details (5 cols) */}
          <div className="lg:col-span-5 bg-[#0F172A] border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[750px] overflow-hidden">
            {/* Nav Header */}
            <div className="flex items-center border-b border-slate-800 bg-[#0B1120] px-4 font-mono text-xs">
              <button
                onClick={() => setActiveTab('problem')}
                className={`py-3 px-3 font-semibold border-b-2 transition-colors ${
                  activeTab === 'problem'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Problem Description
              </button>
              <button
                onClick={() => setActiveTab('testcases')}
                className={`py-3 px-3 font-semibold border-b-2 transition-colors ${
                  activeTab === 'testcases'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Test Results Console
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`py-3 px-3 font-semibold border-b-2 transition-colors ${
                  activeTab === 'submissions'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Submissions ({problemSubmissions.length})
              </button>
            </div>

            {/* Tab 1: Problem Description */}
            {activeTab === 'problem' && (
              <div className="p-6 overflow-y-auto space-y-6 text-slate-200 text-xs sm:text-sm flex-1 leading-relaxed">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold font-mono text-white">
                      {currentProblem.title}
                    </h2>
                    <Badge status={currentProblem.difficulty.toUpperCase()} size="sm" />
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                    <span>Points: <strong className="text-cyan-400">{currentProblem.points}</strong></span>
                    <span>Time Limit: <strong>{currentProblem.timeLimitMs}ms</strong></span>
                    <span>Memory: <strong>{currentProblem.memoryLimitMb}MB</strong></span>
                  </div>
                </div>

                <div className="space-y-2 whitespace-pre-line font-sans text-slate-300">
                  {currentProblem.description}
                </div>

                <div className="space-y-2">
                  <h4 className="font-mono font-bold text-cyan-300 text-xs uppercase tracking-wider">
                    Input Format
                  </h4>
                  <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap">
                    {currentProblem.inputFormat}
                  </pre>
                </div>

                <div className="space-y-2">
                  <h4 className="font-mono font-bold text-cyan-300 text-xs uppercase tracking-wider">
                    Output Format
                  </h4>
                  <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap">
                    {currentProblem.outputFormat}
                  </pre>
                </div>

                <div className="space-y-2">
                  <h4 className="font-mono font-bold text-cyan-300 text-xs uppercase tracking-wider">
                    Constraints
                  </h4>
                  <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap">
                    {currentProblem.constraints}
                  </pre>
                </div>

                {/* Examples */}
                <div className="space-y-4">
                  <h4 className="font-mono font-bold text-cyan-300 text-xs uppercase tracking-wider">
                    Sample Test Cases
                  </h4>
                  {currentProblem.examples.map((ex, i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 font-mono text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Example Input:</span>
                        <pre className="text-cyan-300 whitespace-pre-wrap mt-0.5">{ex.input}</pre>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Example Output:</span>
                        <pre className="text-emerald-300 whitespace-pre-wrap mt-0.5">{ex.output}</pre>
                      </div>
                      {ex.explanation && (
                        <div className="pt-1 text-[11px] text-slate-400 font-sans border-t border-slate-800/80">
                          <strong>Explanation:</strong> {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Test Results Console */}
            {activeTab === 'testcases' && (
              <div className="p-6 overflow-y-auto space-y-4 flex-1 font-mono text-xs">
                {isRunning || isSubmitting ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                    <span className="text-slate-300 font-bold">
                      {isRunning ? 'Running Sample Tests in Sandbox...' : 'Evaluating Full Hidden Test Suite...'}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Enforcing 2.0s time boundary & 128MB memory ceiling
                    </span>
                  </div>
                ) : submissionResult ? (
                  /* Full Submission Result View */
                  <div className="space-y-4 animate-in fade-in">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase text-slate-500 block">Overall Status</span>
                        <Badge status={submissionResult.status} size="lg" />
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase text-slate-500 block">Score Earned</span>
                        <span className="text-xl font-bold text-cyan-400">
                          {submissionResult.score} / {submissionResult.maxScore}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block">Test Cases</span>
                        <span className="font-bold text-slate-200">
                          {submissionResult.passedTestCases} / {submissionResult.totalTestCases}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block">Max Time</span>
                        <span className="font-bold text-slate-200">{submissionResult.executionTimeMs}ms</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block">Memory</span>
                        <span className="font-bold text-slate-200">
                          {Math.round(submissionResult.memoryKb / 1024)}MB
                        </span>
                      </div>
                    </div>

                    {/* Test case breakdown badges */}
                    <div className="space-y-2 pt-2">
                      <h5 className="font-bold text-slate-300 text-xs">Test Cases Execution Breakdown:</h5>
                      {submissionResult.testCaseResults?.map((tc: any, i: number) => (
                        <div
                          key={i}
                          className={`p-3 rounded-xl border flex items-center justify-between ${
                            tc.passed
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                              : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {tc.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-rose-400" />
                            )}
                            <span className="font-bold">Test Case {i + 1}</span>
                            {tc.input === undefined && (
                              <span className="text-[10px] text-slate-400">(Hidden Test Case)</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-slate-400">{tc.executionTimeMs}ms</span>
                            <Badge status={tc.status} size="sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : runResult ? (
                  /* Sample Run Result View */
                  <div className="space-y-4 animate-in fade-in">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase text-slate-500 block">Run Status</span>
                        <Badge status={runResult.overallStatus} size="lg" />
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase text-slate-500 block">Passed</span>
                        <span className="text-lg font-bold text-slate-200">
                          {runResult.passedTestCases} / {runResult.totalTestCases} samples
                        </span>
                      </div>
                    </div>

                    {runResult.compilationError && (
                      <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 whitespace-pre-wrap font-mono text-xs">
                        {runResult.compilationError}
                      </div>
                    )}

                    <div className="space-y-3">
                      {runResult.testCaseResults?.map((tc: any, i: number) => (
                        <div key={i} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200">Sample Case {i + 1}</span>
                            <Badge status={tc.status} size="sm" />
                          </div>
                          {tc.input && (
                            <div>
                              <span className="text-[10px] uppercase text-slate-500 block">Input:</span>
                              <pre className="text-slate-300">{tc.input}</pre>
                            </div>
                          )}
                          {tc.expectedOutput && (
                            <div>
                              <span className="text-[10px] uppercase text-slate-500 block">Expected:</span>
                              <pre className="text-emerald-300">{tc.expectedOutput}</pre>
                            </div>
                          )}
                          {tc.actualOutput && (
                            <div>
                              <span className="text-[10px] uppercase text-slate-500 block">Your Output:</span>
                              <pre className={tc.passed ? 'text-emerald-300' : 'text-rose-300'}>
                                {tc.actualOutput}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-500">
                    <Terminal className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>Click &quot;Run Code&quot; to test sample cases</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Click &quot;Submit Code&quot; to evaluate hidden test cases and earn points
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Submissions History for this Problem */}
            {activeTab === 'submissions' && (
              <div className="p-6 overflow-y-auto space-y-3 flex-1 font-mono text-xs">
                {problemSubmissions.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <p>No submissions for this problem yet.</p>
                  </div>
                ) : (
                  problemSubmissions.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge status={s.status} size="sm" />
                          <span className="text-slate-400 text-[10px]">
                            {new Date(s.submittedAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <span className="text-slate-300 text-[11px]">
                          Lang: {s.language} • {s.passedTestCases}/{s.totalTestCases} passed
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-cyan-400 block">
                          {s.score} / {s.maxScore} pts
                        </span>
                        <span className="text-[10px] text-slate-500">{s.executionTimeMs}ms</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right Column: Code Editor (7 cols) */}
          <div className="lg:col-span-7 h-[750px] flex flex-col">
            <CodeEditor
              code={code}
              onChange={setCode}
              language={language}
              onLanguageChange={handleLanguageChange}
              onRun={handleRunCode}
              onSubmit={handleSubmitCode}
              isRunning={isRunning}
              isSubmitting={isSubmitting}
              onResetStarter={handleResetStarter}
            />
          </div>
        </div>
      ) : null}

      {/* Proctoring HUD when in active competition session */}
      {hasCompletedSystemCheck && round?.proctoringSettings && (
        <ProctoringHUD
          videoRef={proctoring.videoRef}
          cameraActive={proctoring.cameraActive}
          micActive={proctoring.micActive}
          fullscreenActive={proctoring.fullscreenActive}
          audioLevel={proctoring.audioLevel}
          tabWarnings={proctoring.tabWarnings}
          maxWarnings={proctoring.maxWarnings}
          isLocked={proctoring.isLocked}
          lastWarningNotice={proctoring.lastWarningNotice}
          isSimulatedStream={proctoring.isSimulatedStream}
          onClearWarning={proctoring.clearWarningNotice}
          onReEnterFullscreen={proctoring.requestFullscreen}
        />
      )}

      {/* Proctoring Diagnostic System Check before starting round */}
      {showSystemCheck && (
        <ProctoringSystemCheck
          roundId={roundId}
          roundName={round?.name || 'Coding Battle'}
          proctoringSettings={round?.proctoringSettings}
          onCheckPassed={() => {
            setHasCompletedSystemCheck(true);
            setShowSystemCheck(false);
            proctoring.startMediaStream();
            proctoring.requestFullscreen();
          }}
          onCancel={() => onNavigate('/rounds')}
        />
      )}
    </div>
  );
};
