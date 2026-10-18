import { Router } from 'express';
import { dbStore } from '../db/store.ts';
import { requireAuth, type AuthenticatedRequest } from '../services/authService.ts';
import { checkRoundEligibility, computeUserScores } from '../services/scoringService.ts';

const router = Router();

// List all rounds with user-specific eligibility and progress
router.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const rounds = dbStore.getRounds();
  const userScores = computeUserScores(user);
  const now = new Date();

  const enrichedRounds = rounds.map((r) => {
    const eligibility = checkRoundEligibility(user.id, r);

    // Get score achieved in this round
    let userScore = 0;
    if (r.roundNumber === 1) userScore = userScores.round1Score;
    else if (r.roundNumber === 2) userScore = userScores.round2Score;
    else if (r.roundNumber === 3) userScore = userScores.round3Score;
    else if (r.roundNumber === 4) userScore = userScores.round4Score;

    // Check if user has completed this round
    let isCompleted = false;
    if (r.type === 'quiz') {
      const attempt = dbStore.getQuizAttempt(user.id, r.id);
      isCompleted = !!attempt?.isSubmitted;
    } else {
      const submissions = dbStore.getSubmissions({ userId: user.id, roundId: r.id });
      // If user achieved max score or has accepted submissions
      isCompleted = submissions.some((s) => s.status === 'ACCEPTED');
    }

    // Determine state badge
    let displayStatus: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'QUALIFIED' | 'ELIMINATED' | 'LOCKED' =
      'LOCKED';

    if (eligibility.status === 'ELIMINATED') {
      displayStatus = 'ELIMINATED';
    } else if (isCompleted) {
      displayStatus = 'COMPLETED';
    } else if (eligibility.eligible && r.status === 'active') {
      displayStatus = 'ACTIVE';
    } else if (r.status === 'upcoming') {
      displayStatus = 'UPCOMING';
    } else {
      displayStatus = 'LOCKED';
    }

    return {
      ...r,
      userScore,
      isCompleted,
      displayStatus,
      isEligible: eligibility.eligible,
      lockReason: eligibility.reason,
    };
  });

  res.json({
    rounds: enrichedRounds,
    serverTime: now.toISOString(),
    isFinalResultsPublished: dbStore.isFinalResultsPublished(),
  });
});

// Get individual round details
router.get('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const round = dbStore.getRoundById(req.params.id);

  if (!round) {
    return res.status(404).json({ error: 'Round not found' });
  }

  const eligibility = checkRoundEligibility(user.id, round);
  const quizAttempt = round.type === 'quiz' ? dbStore.getQuizAttempt(user.id, round.id) : null;
  const submissions = dbStore.getSubmissions({ userId: user.id, roundId: round.id });

  res.json({
    round,
    serverTime: new Date().toISOString(),
    eligibility,
    quizAttempt: quizAttempt ? {
      isSubmitted: quizAttempt.isSubmitted,
      startedAt: quizAttempt.startedAt,
      submittedAt: quizAttempt.submittedAt,
      score: quizAttempt.score,
      totalQuestions: quizAttempt.totalQuestions,
      attemptedCount: quizAttempt.attemptedCount,
      accuracy: quizAttempt.accuracy,
    } : null,
    submissionsCount: submissions.length,
  });
});

// Start an attempt for a round
router.post('/:id/start', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const round = dbStore.getRoundById(req.params.id);

  if (!round) {
    return res.status(404).json({ error: 'Round not found' });
  }

  const eligibility = checkRoundEligibility(user.id, round);
  if (!eligibility.eligible && round.status !== 'active') {
    return res.status(403).json({ error: eligibility.reason || 'Not eligible to start this round' });
  }

  if (round.type === 'quiz') {
    let attempt = dbStore.getQuizAttempt(user.id, round.id);
    if (attempt && attempt.isSubmitted) {
      return res.status(400).json({ error: 'Quiz has already been submitted.' });
    }

    if (!attempt) {
      const questions = dbStore.getQuizQuestions(round.id);
      attempt = {
        id: `qa_${user.id}_${round.id}_${Date.now()}`,
        userId: user.id,
        roundId: round.id,
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
      dbStore.saveQuizAttempt(attempt);

      dbStore.addAuditLog({
        userId: user.id,
        userName: user.fullName,
        action: 'ROUND_START',
        details: `Started Round ${round.roundNumber}: ${round.name}.`,
      });
    }

    return res.json({
      success: true,
      startedAt: attempt.startedAt,
      durationMinutes: round.durationMinutes,
      serverTime: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    serverTime: new Date().toISOString(),
  });
});

export default router;
