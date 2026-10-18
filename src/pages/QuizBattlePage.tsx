import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { useNotification } from '../context/NotificationContext.tsx';
import type { QuizQuestion } from '../types/index.ts';
import { CountdownTimer } from '../components/common/CountdownTimer.tsx';
import { Badge } from '../components/common/Badge.tsx';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  RotateCcw,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useProctoring } from '../hooks/useProctoring.ts';
import { ProctoringSystemCheck } from '../components/proctoring/ProctoringSystemCheck.tsx';
import { ProctoringHUD } from '../components/proctoring/ProctoringHUD.tsx';

interface QuizBattlePageProps {
  roundId: string;
  onNavigate: (path: string) => void;
}

export const QuizBattlePage: React.FC<QuizBattlePageProps> = ({ roundId, onNavigate }) => {
  const { showToast } = useNotification();
  const [round, setRound] = useState<any>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D' | null>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attemptResult, setAttemptResult] = useState<any>(null);
  const [reviewQuestions, setReviewQuestions] = useState<any[]>([]);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [serverTime, setServerTime] = useState<string>(new Date().toISOString());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSystemCheck, setShowSystemCheck] = useState(false);
  const [hasCompletedSystemCheck, setHasCompletedSystemCheck] = useState(false);

  const proctoring = useProctoring({
    roundId,
    settings: round?.proctoringSettings,
    enabled: hasCompletedSystemCheck && !isSubmitted,
    onAutoSubmit: () => handleSubmit(),
    onViolation: (msg) => showToast(msg, 'warning'),
  });

  const loadQuiz = async () => {
    try {
      // Start or retrieve attempt
      const startRes = await api.startRound(roundId);
      setStartedAt(startRes.startedAt || new Date().toISOString());

      const data = await api.getQuizQuestions(roundId);
      setRound(data.round);
      setQuestions(data.questions);
      setAnswers(data.existingAnswers || {});
      setIsSubmitted(data.isSubmitted);
      setServerTime(data.serverTime);

      if (data.isSubmitted) {
        // If already submitted, submit to load review
        const submitRes = await api.submitQuiz(roundId, data.existingAnswers || {});
        setAttemptResult(submitRes.attempt);
        setReviewQuestions(submitRes.reviewQuestions);
        setHasCompletedSystemCheck(true);
      } else {
        // Check proctoring requirement & consent
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
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to initialize Quiz Battle', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuiz();
  }, [roundId]);

  const handleSelectOption = async (optionKey: 'A' | 'B' | 'C' | 'D') => {
    if (isSubmitted) return;
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const newAnswers = { ...answers, [currentQ.id]: optionKey };
    setAnswers(newAnswers);

    // Save incrementally to server
    try {
      await api.saveQuizAnswer(roundId, currentQ.id, optionKey);
    } catch {
      // ignore
    }
  };

  const handleClearOption = async () => {
    if (isSubmitted) return;
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const newAnswers = { ...answers, [currentQ.id]: null };
    setAnswers(newAnswers);

    try {
      await api.saveQuizAnswer(roundId, currentQ.id, null);
    } catch {
      // ignore
    }
  };

  const handleSubmit = async () => {
    if (isSubmitted || submitting) return;
    setSubmitting(true);

    try {
      const res = await api.submitQuiz(roundId, answers);
      setIsSubmitted(true);
      setAttemptResult(res.attempt);
      setReviewQuestions(res.reviewQuestions);
      showToast(`Quiz Battle completed! Score: ${res.attempt.score} pts`, 'success');

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    } catch (err: any) {
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="font-mono text-xs text-slate-400">Loading Quiz Battle Arena...</span>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const attemptedCount = Object.values(answers).filter((v) => v !== null).length;
  const remainingCount = questions.length - attemptedCount;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Top Header Bar */}
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
                Round 01
              </span>
              <Badge status={isSubmitted ? 'COMPLETED' : 'ACTIVE'} size="sm" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
              Quiz Battle Arena
            </h1>
          </div>
        </div>

        {/* Server Countdown Timer */}
        {!isSubmitted && startedAt && (
          <CountdownTimer
            startedAt={startedAt}
            durationMinutes={round?.durationMinutes || 15}
            serverTime={serverTime}
            onExpire={handleSubmit}
            size="lg"
          />
        )}
      </div>

      {/* Main Quiz Body */}
      {isSubmitted && attemptResult ? (
        /* Evaluation Results Card */
        <div className="space-y-6 animate-in fade-in">
          <div className="p-8 rounded-2xl bg-gradient-to-b from-[#0E1B2E] to-[#0A101D] border border-cyan-500/40 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-300">
              <Trophy className="w-8 h-8 text-cyan-400" />
            </div>

            <h2 className="text-3xl font-black font-mono text-white">
              Quiz Battle Completed!
            </h2>
            <p className="text-xs font-mono text-slate-400 max-w-md mx-auto">
              Your answers have been evaluated authoritatively by the CODEQUEST scoring engine.
            </p>

            {/* Score Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Final Score</span>
                <span className="text-2xl font-bold text-cyan-400">
                  {attemptResult.score} / {round?.maxScore || 100}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Accuracy</span>
                <span className="text-2xl font-bold text-emerald-400">
                  {attemptResult.accuracy}%
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Correct / Wrong</span>
                <span className="text-2xl font-bold text-slate-200">
                  {attemptResult.correctCount} / {attemptResult.wrongCount}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Time Taken</span>
                <span className="text-2xl font-bold text-slate-200">
                  {Math.floor(attemptResult.timeTakenSeconds / 60)}m {attemptResult.timeTakenSeconds % 60}s
                </span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-center gap-4">
              <button
                onClick={() => onNavigate('/coding/round_02_coding')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs tracking-wide transition-all shadow-lg shadow-cyan-500/20"
              >
                Proceed to Round 2: Coding Battle
              </button>
              <button
                onClick={() => onNavigate('/leaderboard')}
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs font-semibold"
              >
                View Leaderboard
              </button>
            </div>
          </div>

          {/* Post-submission Answers Review with Explanations */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-mono text-white">
              Answer Review & Explanations
            </h3>

            <div className="space-y-4">
              {reviewQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className={`p-6 rounded-2xl border ${
                    q.isCorrect
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : q.userChoice === null
                      ? 'bg-slate-900/40 border-slate-800'
                      : 'bg-rose-950/20 border-rose-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      Question {idx + 1} of {reviewQuestions.length} • {q.category}
                    </span>
                    <Badge
                      status={q.isCorrect ? 'ACCEPTED' : q.userChoice === null ? 'PENDING' : 'WRONG_ANSWER'}
                      size="sm"
                    />
                  </div>

                  <p className="text-sm font-medium text-slate-100 mb-4">{q.questionText}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono mb-4">
                    {q.options.map((opt: any) => {
                      const isChosen = q.userChoice === opt.optionKey;
                      const isTheCorrect = q.correctOptionKey === opt.optionKey;

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border flex items-center justify-between ${
                            isTheCorrect
                              ? 'bg-emerald-900/30 border-emerald-500 text-emerald-200 font-semibold'
                              : isChosen
                              ? 'bg-rose-900/30 border-rose-500 text-rose-200'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400'
                          }`}
                        >
                          <span>
                            <strong className="mr-2">{opt.optionKey}.</strong> {opt.optionText}
                          </span>
                          {isTheCorrect && <span className="text-[10px] text-emerald-400 uppercase font-bold">Correct</span>}
                          {isChosen && !isTheCorrect && <span className="text-[10px] text-rose-400 uppercase font-bold">Your Pick</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-sans text-slate-300 leading-relaxed">
                    <strong className="text-cyan-400 font-mono block mb-1">Official Explanation:</strong>
                    {q.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Live Quiz Interface */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question & Options Area */}
          <div className="lg:col-span-3 space-y-6">
            {currentQ ? (
              <div className="p-6 sm:p-8 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-6">
                {/* Question Info Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800">
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      {currentQ.category || 'Algorithms'}
                    </span>
                    <Badge status={currentQ.difficulty.toUpperCase()} size="sm" />
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      +{currentQ.points} pts
                    </span>
                    {currentQ.negativeMarking > 0 && (
                      <span className="text-xs font-mono text-rose-400">
                        -{currentQ.negativeMarking} penalty
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <div className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed font-sans">
                  {currentQ.questionText}
                </div>

                {/* Options (A, B, C, D) */}
                <div className="space-y-3 pt-2">
                  {currentQ.options.map((opt) => {
                    const isSelected = answers[currentQ.id] === opt.optionKey;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(opt.optionKey)}
                        className={`w-full text-left p-4 rounded-xl border font-mono text-xs sm:text-sm transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/50'
                            : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                            isSelected
                              ? 'bg-cyan-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {opt.optionKey}
                        </span>
                        <span className="leading-relaxed mt-0.5">{opt.optionText}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Navigation & Controls */}
                <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentIndex === 0}
                      onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    <button
                      type="button"
                      disabled={currentIndex === questions.length - 1}
                      onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {answers[currentQ.id] && (
                      <button
                        type="button"
                        onClick={handleClearOption}
                        className="px-3 py-2 text-slate-500 hover:text-slate-300 text-xs transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold tracking-wide transition-all shadow-md shadow-cyan-500/20 flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Submitting...' : 'Submit Final Quiz'}</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Right Sidebar: Question Palette & Counts */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-4 font-mono">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Question Palette
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Attempted</span>
                  <span className="text-cyan-400 font-bold">{attemptedCount}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Remaining</span>
                  <span className="text-slate-300 font-bold">{remainingCount}</span>
                </div>
              </div>

              {/* Grid of question buttons */}
              <div className="grid grid-cols-5 gap-2 pt-2">
                {questions.map((q, idx) => {
                  const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null;
                  const isCurrent = idx === currentIndex;

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-10 rounded-xl font-mono text-xs font-bold transition-all ${
                        isCurrent
                          ? 'ring-2 ring-cyan-400 bg-cyan-500 text-slate-950 shadow-md'
                          : isAnswered
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/50'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="pt-3 border-t border-slate-800 text-[10px] space-y-1 text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-500" />
                  <span>Current Question</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-950 border border-cyan-500/50" />
                  <span>Attempted</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-slate-900 border border-slate-800" />
                  <span>Not Attempted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proctoring HUD when in active competition session */}
      {!isSubmitted && hasCompletedSystemCheck && round?.proctoringSettings && (
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
          roundName={round?.name || 'Quiz Battle'}
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
