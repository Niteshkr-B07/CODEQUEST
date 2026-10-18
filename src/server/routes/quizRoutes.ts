import { Router } from 'express';
import { dbStore } from '../db/store.ts';
import { requireAuth, type AuthenticatedRequest } from '../services/authService.ts';
import type { QuizAnswer, Qualification } from '../db/schema.ts';

const router = Router();

// Get questions for Quiz Battle (PROTECTED: Never exposes correctOptionKey or explanations to participants)
router.get('/:roundId/questions', requireAuth, (req: AuthenticatedRequest, res) => {
  const round = dbStore.getRoundById(req.params.roundId);
  if (!round || round.type !== 'quiz') {
    return res.status(404).json({ error: 'Quiz round not found' });
  }

  const user = req.user!;
  const attempt = dbStore.getQuizAttempt(user.id, round.id);

  const rawQuestions = dbStore.getQuizQuestions(round.id);

  // Strip correct answer and explanation for participants during the quiz
  const sanitizedQuestions = rawQuestions.map((q, idx) => ({
    id: q.id,
    questionNumber: idx + 1,
    questionText: q.questionText,
    category: q.category,
    difficulty: q.difficulty,
    points: q.points,
    negativeMarking: q.negativeMarking,
    options: q.options.map((opt) => ({
      id: opt.id,
      optionKey: opt.optionKey,
      optionText: opt.optionText,
    })),
  }));

  res.json({
    round: {
      id: round.id,
      name: round.name,
      durationMinutes: round.durationMinutes,
      maxScore: round.maxScore,
    },
    questions: sanitizedQuestions,
    existingAnswers: attempt ? attempt.answers : {},
    isSubmitted: !!attempt?.isSubmitted,
    startedAt: attempt?.startedAt || null,
    serverTime: new Date().toISOString(),
  });
});

// Save answer progress incrementally
router.post('/:roundId/answer', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const roundId = req.params.roundId;
  const { questionId, selectedOptionKey } = req.body;

  let attempt = dbStore.getQuizAttempt(user.id, roundId);
  if (!attempt) {
    const questions = dbStore.getQuizQuestions(roundId);
    attempt = {
      id: `qa_${user.id}_${roundId}_${Date.now()}`,
      userId: user.id,
      roundId,
      startedAt: new Date().toISOString(),
      isSubmitted: false,
      answers: {},
      totalQuestions: questions.length,
      attemptedCount: 0,
      correctCount: 0,
      wrongCount: 0,
      skippedCount: questions.length,
      score: 0,
      accuracy: 0,
      timeTakenSeconds: 0,
    };
  }

  if (attempt.isSubmitted) {
    return res.status(400).json({ error: 'Quiz attempt already submitted.' });
  }

  attempt.answers[questionId] = selectedOptionKey;
  attempt.attemptedCount = Object.values(attempt.answers).filter((v) => v !== null).length;
  attempt.skippedCount = attempt.totalQuestions - attempt.attemptedCount;

  dbStore.saveQuizAttempt(attempt);

  res.json({ success: true, attemptedCount: attempt.attemptedCount });
});

// Final submission of Quiz Battle: Server calculates authoritative scoring
router.post('/:roundId/submit', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const roundId = req.params.roundId;
  const { answers } = req.body; // Map of questionId -> optionKey

  const round = dbStore.getRoundById(roundId);
  if (!round) {
    return res.status(404).json({ error: 'Round not found' });
  }

  let attempt = dbStore.getQuizAttempt(user.id, roundId);
  const questions = dbStore.getQuizQuestions(roundId);

  const startTime = attempt ? new Date(attempt.startedAt).getTime() : Date.now() - 60000;
  const submitTime = Date.now();
  const timeTakenSeconds = Math.max(1, Math.round((submitTime - startTime) / 1000));

  const submittedAnswers = answers || (attempt ? attempt.answers : {});

  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  let calculatedScore = 0;

  const evaluatedAnswers: QuizAnswer[] = [];

  for (const q of questions) {
    const chosen = submittedAnswers[q.id];

    if (!chosen) {
      skippedCount++;
      evaluatedAnswers.push({
        questionId: q.id,
        selectedOptionKey: null,
        isCorrect: false,
        pointsAwarded: 0,
      });
    } else if (chosen === q.correctOptionKey) {
      correctCount++;
      calculatedScore += q.points;
      evaluatedAnswers.push({
        questionId: q.id,
        selectedOptionKey: chosen,
        isCorrect: true,
        pointsAwarded: q.points,
      });
    } else {
      wrongCount++;
      const penalty = q.negativeMarking || 0;
      calculatedScore -= penalty;
      evaluatedAnswers.push({
        questionId: q.id,
        selectedOptionKey: chosen,
        isCorrect: false,
        pointsAwarded: -penalty,
      });
    }
  }

  // Prevent negative total round score
  calculatedScore = Math.max(0, calculatedScore);
  const totalQuestions = questions.length;
  const attemptedCount = correctCount + wrongCount;
  const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

  const updatedAttempt = {
    id: attempt?.id || `qa_${user.id}_${roundId}_${Date.now()}`,
    userId: user.id,
    roundId,
    startedAt: attempt?.startedAt || new Date(startTime).toISOString(),
    submittedAt: new Date(submitTime).toISOString(),
    isSubmitted: true,
    answers: submittedAnswers,
    evaluatedAnswers,
    totalQuestions,
    attemptedCount,
    correctCount,
    wrongCount,
    skippedCount,
    score: calculatedScore,
    accuracy,
    timeTakenSeconds,
  };

  dbStore.saveQuizAttempt(updatedAttempt);

  // Auto-generate provisional qualification record for Round 1
  const qual: Qualification = {
    id: `qual_${user.id}_${round.id}`,
    userId: user.id,
    roundId: round.id,
    roundNumber: 1,
    status: calculatedScore >= (round.qualificationRule.value || 40) ? 'QUALIFIED' : 'PENDING',
    roundScore: calculatedScore,
    cumulativeScore: calculatedScore,
    evaluatedAt: new Date().toISOString(),
  };
  dbStore.setQualification(qual);

  dbStore.addAuditLog({
    userId: user.id,
    userName: user.fullName,
    action: 'QUIZ_SUBMISSION',
    details: `Submitted Quiz Battle. Score: ${calculatedScore}/${round.maxScore}, Accuracy: ${accuracy}%.`,
  });

  // Now that submission is complete, return full breakdown including explanations
  const reviewQuestions = questions.map((q) => {
    const evalAns = evaluatedAnswers.find((ea) => ea.questionId === q.id);
    return {
      id: q.id,
      questionText: q.questionText,
      category: q.category,
      correctOptionKey: q.correctOptionKey,
      explanation: q.explanation,
      points: q.points,
      options: q.options,
      userChoice: evalAns?.selectedOptionKey || null,
      isCorrect: !!evalAns?.isCorrect,
      pointsAwarded: evalAns?.pointsAwarded || 0,
    };
  });

  res.json({
    success: true,
    attempt: updatedAttempt,
    reviewQuestions,
  });
});

export default router;
