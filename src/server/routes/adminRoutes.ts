import { Router } from 'express';
import { dbStore } from '../db/store.ts';
import { requireAdmin, type AuthenticatedRequest } from '../services/authService.ts';
import {
  generateLeaderboard,
  evaluateRoundQualifications,
  computeUserScores,
} from '../services/scoringService.ts';
import { executeSandboxedCode } from '../services/sandboxRunner.ts';
import type { Round, QuizQuestion, CodingProblem, DebuggingProblem } from '../db/schema.ts';

const router = Router();

// Apply requireAdmin middleware to ALL admin endpoints
router.use(requireAdmin);

// 1. Admin Dashboard Statistics
router.get('/dashboard', (req: AuthenticatedRequest, res) => {
  const users = dbStore.getUsers();
  const participants = users.filter((u) => u.role === 'participant');
  const submissions = dbStore.getSubmissions();
  const quizAttempts = dbStore.getQuizAttempts();
  const rounds = dbStore.getRounds();
  const qualifications = dbStore.getQualifications();

  const activeRounds = rounds.filter((r) => r.status === 'active');
  const currentRound = activeRounds.length > 0 ? activeRounds[0].name : 'None (Competition Inactive)';

  const qualifiedCount = qualifications.filter((q) => q.status === 'QUALIFIED').length;
  const eliminatedCount = qualifications.filter((q) => q.status === 'ELIMINATED').length;

  // Compute round-wise submission counts
  const roundSubmissions = rounds.map((r) => {
    let count = 0;
    if (r.type === 'quiz') {
      count = quizAttempts.filter((qa) => qa.roundId === r.id && qa.isSubmitted).length;
    } else {
      count = submissions.filter((s) => s.roundId === r.id).length;
    }
    return {
      roundId: r.id,
      roundName: r.name,
      roundNumber: r.roundNumber,
      submissionsCount: count,
    };
  });

  // Recent 10 submissions for live ticker
  const recentSubmissions = submissions.slice(0, 10).map((s) => {
    const user = dbStore.getUserById(s.userId);
    let problemTitle = 'Problem';
    const cp = dbStore.getCodingProblemById(s.problemId) || dbStore.getDebuggingProblemById(s.problemId);
    if (cp) problemTitle = cp.title;

    return {
      id: s.id,
      userName: user ? user.fullName : 'Participant',
      userOrg: user?.organization || 'Unknown',
      problemTitle,
      roundId: s.roundId,
      status: s.status,
      score: s.score,
      maxScore: s.maxScore,
      submittedAt: s.submittedAt,
    };
  });

  res.json({
    metrics: {
      totalParticipants: participants.length,
      activeParticipants: participants.filter((p) => !p.isDisqualified).length,
      totalSubmissions: submissions.length + quizAttempts.filter((q) => q.isSubmitted).length,
      currentRound,
      qualifiedCount,
      eliminatedCount,
      isFinalPublished: dbStore.isFinalResultsPublished(),
    },
    roundSubmissions,
    recentSubmissions,
  });
});

// 2. Participants Management
router.get('/participants', (req, res) => {
  const users = dbStore.getUsers().filter((u) => u.role === 'participant');
  const leaderboard = generateLeaderboard();

  const enriched = users.map((u) => {
    const scores = computeUserScores(u);
    const quals = dbStore.getQualifications(u.id);
    const rankInfo = leaderboard.entries.find((e) => e.userId === u.id);

    return {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      organization: u.organization,
      phoneNumber: u.phoneNumber,
      createdAt: u.createdAt,
      isDisqualified: !!u.isDisqualified,
      rank: rankInfo?.rank || '-',
      totalScore: scores.totalScore,
      roundWiseScores: {
        round1: scores.round1Score,
        round2: scores.round2Score,
        round3: scores.round3Score,
        round4: scores.round4Score,
      },
      qualifications: quals,
    };
  });

  res.json({ participants: enriched });
});

router.post('/participants/:id/toggle-disqualify', (req: AuthenticatedRequest, res) => {
  const admin = req.user!;
  const user = dbStore.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const newStatus = !user.isDisqualified;
  dbStore.updateUser(user.id, { isDisqualified: newStatus });

  dbStore.addAuditLog({
    userId: admin.id,
    userName: admin.fullName,
    action: newStatus ? 'DISQUALIFY_PARTICIPANT' : 'REINSTATE_PARTICIPANT',
    details: `${newStatus ? 'Disqualified' : 'Reinstated'} participant ${user.fullName} (${user.email}).`,
  });

  res.json({ success: true, isDisqualified: newStatus });
});

// 3. Rounds Management
router.get('/rounds', (req, res) => {
  const rounds = dbStore.getRounds();
  res.json({ rounds });
});

router.post('/rounds', (req: AuthenticatedRequest, res) => {
  const admin = req.user!;
  const { name, type, description, durationMinutes, maxScore, qualificationRule } = req.body;

  if (!name || !type || !durationMinutes || !maxScore) {
    return res.status(400).json({ error: 'Missing required round fields' });
  }

  const existingRounds = dbStore.getRounds();
  const nextNum = existingRounds.length + 1;

  const newRound: Round = {
    id: `round_${nextNum}_${type}_${Date.now()}`,
    roundNumber: nextNum,
    name,
    type,
    description: description || '',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    durationMinutes: Number(durationMinutes),
    maxScore: Number(maxScore),
    status: 'upcoming',
    qualificationRule: qualificationRule || { type: 'top_n', value: 20 },
    isResultsPublished: false,
  };

  dbStore.addRound(newRound);

  dbStore.addAuditLog({
    userId: admin.id,
    userName: admin.fullName,
    action: 'CREATE_ROUND',
    details: `Created new round: Round ${newRound.roundNumber} - ${newRound.name} (${newRound.type}).`,
  });

  res.json({ success: true, round: newRound });
});

router.put('/rounds/:id', (req: AuthenticatedRequest, res) => {
  const admin = req.user!;
  const round = dbStore.getRoundById(req.params.id);
  if (!round) return res.status(404).json({ error: 'Round not found' });

  const updated = dbStore.updateRound(req.params.id, req.body);

  dbStore.addAuditLog({
    userId: admin.id,
    userName: admin.fullName,
    action: 'UPDATE_ROUND',
    details: `Updated round parameters for Round ${round.roundNumber} (${round.name}).`,
  });

  res.json({ success: true, round: updated });
});

router.post('/rounds/:id/status', (req: AuthenticatedRequest, res) => {
  const admin = req.user!;
  const { status } = req.body;
  const round = dbStore.getRoundById(req.params.id);
  if (!round) return res.status(404).json({ error: 'Round not found' });

  dbStore.updateRound(round.id, { status });

  dbStore.addAuditLog({
    userId: admin.id,
    userName: admin.fullName,
    action: 'CHANGE_ROUND_STATUS',
    details: `Changed status of Round ${round.roundNumber} (${round.name}) to "${status.toUpperCase()}".`,
  });

  res.json({ success: true, round: dbStore.getRoundById(round.id) });
});

router.delete('/rounds/:id', (req: AuthenticatedRequest, res) => {
  const admin = req.user!;
  const round = dbStore.getRoundById(req.params.id);
  if (!round) return res.status(404).json({ error: 'Round not found' });

  // Safeguard: Check if competition data exists
  const submissions = dbStore.getSubmissions({ roundId: round.id });
  const quizAttempts = dbStore.getQuizAttempts(undefined, round.id);
  if (submissions.length > 0 || quizAttempts.length > 0) {
    return res.status(400).json({
      error: `Cannot delete Round ${round.roundNumber} because it already contains ${submissions.length + quizAttempts.length} participant submission records.`,
    });
  }

  dbStore.deleteRound(round.id);

  dbStore.addAuditLog({
    userId: admin.id,
    userName: admin.fullName,
    action: 'DELETE_ROUND',
    details: `Deleted round: Round ${round.roundNumber} (${round.name}).`,
  });

  res.json({ success: true });
});

// Evaluate qualifications for a specific round
router.post('/rounds/:id/evaluate-qualifications', (req: AuthenticatedRequest, res) => {
  try {
    const result = evaluateRoundQualifications(req.params.id);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Qualification evaluation failed' });
  }
});

// 4. Questions & Problems Management
router.get('/questions', (req, res) => {
  const { roundId } = req.query;
  const quizQuestions = dbStore.getQuizQuestions(roundId as string | undefined);
  res.json({ questions: quizQuestions });
});

router.post('/questions', (req: AuthenticatedRequest, res) => {
  const admin = req.user!;
  const qData = req.body;
  const newQuestion: QuizQuestion = {
    id: `q_${Date.now()}`,
    roundId: qData.roundId || 'round_01_quiz',
    questionText: qData.questionText,
    category: qData.category || 'General',
    difficulty: qData.difficulty || 'medium',
    points: Number(qData.points) || 10,
    negativeMarking: Number(qData.negativeMarking) || 0,
    correctOptionKey: qData.correctOptionKey,
    explanation: qData.explanation || '',
    options: qData.options.map((opt: any, idx: number) => ({
      id: `opt_${Date.now()}_${idx}`,
      questionId: `q_${Date.now()}`,
      optionKey: opt.optionKey,
      optionText: opt.optionText,
    })),
  };

  dbStore.addQuizQuestion(newQuestion);

  dbStore.addAuditLog({
    userId: admin.id,
    userName: admin.fullName,
    action: 'CREATE_QUIZ_QUESTION',
    details: `Added quiz question "${newQuestion.questionText.slice(0, 40)}...".`,
  });

  res.json({ success: true, question: newQuestion });
});

router.put('/questions/:id', (req: AuthenticatedRequest, res) => {
  const admin = req.user!;
  const updated = dbStore.updateQuizQuestion(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Question not found' });

  dbStore.addAuditLog({
    userId: admin.id,
    userName: admin.fullName,
    action: 'UPDATE_QUIZ_QUESTION',
    details: `Updated quiz question ID: ${req.params.id}.`,
  });

  res.json({ success: true, question: updated });
});

router.delete('/questions/:id', (req: AuthenticatedRequest, res) => {
  dbStore.deleteQuizQuestion(req.params.id);
  res.json({ success: true });
});

// Coding / Debugging Problems Management
router.get('/problems', (req, res) => {
  const codingProblems = dbStore.getCodingProblems();
  const debuggingProblems = dbStore.getDebuggingProblems();
  res.json({ codingProblems, debuggingProblems });
});

router.post('/problems', (req: AuthenticatedRequest, res) => {
  const admin = req.user!;
  const { type, ...data } = req.body;

  if (type === 'debugging') {
    const newProb: DebuggingProblem = {
      id: `debug_prob_${Date.now()}`,
      roundId: data.roundId || 'round_03_debugging',
      title: data.title,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: data.description,
      expectedBehavior: data.expectedBehavior,
      buggyCode: data.buggyCode,
      language: data.language || 'python',
      starterCode: data.starterCode || { python: data.buggyCode, javascript: '' },
      timeLimitMs: Number(data.timeLimitMs) || 2000,
      memoryLimitMb: Number(data.memoryLimitMb) || 128,
      points: Number(data.points) || 100,
      difficulty: data.difficulty || 'medium',
      testCases: data.testCases || [],
    };
    dbStore.addDebuggingProblem(newProb);
    return res.json({ success: true, problem: newProb });
  }

  const newProb: CodingProblem = {
    id: `code_prob_${Date.now()}`,
    roundId: data.roundId || 'round_02_coding',
    title: data.title,
    slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: data.description,
    inputFormat: data.inputFormat,
    outputFormat: data.outputFormat,
    constraints: data.constraints,
    examples: data.examples || [],
    starterCode: data.starterCode || { python: '', javascript: '', cpp: '' },
    timeLimitMs: Number(data.timeLimitMs) || 2000,
    memoryLimitMb: Number(data.memoryLimitMb) || 128,
    points: Number(data.points) || 100,
    difficulty: data.difficulty || 'medium',
    testCases: data.testCases || [],
  };

  dbStore.addCodingProblem(newProb);

  dbStore.addAuditLog({
    userId: admin.id,
    userName: admin.fullName,
    action: 'CREATE_PROBLEM',
    details: `Created problem "${newProb.title}" in Round ${newProb.roundId}.`,
  });

  res.json({ success: true, problem: newProb });
});

router.put('/problems/:id', (req: AuthenticatedRequest, res) => {
  const cp = dbStore.getCodingProblemById(req.params.id);
  if (cp) {
    const updated = dbStore.updateCodingProblem(req.params.id, req.body);
    return res.json({ success: true, problem: updated });
  }
  const dp = dbStore.getDebuggingProblemById(req.params.id);
  if (dp) {
    const updated = dbStore.updateDebuggingProblem(req.params.id, req.body);
    return res.json({ success: true, problem: updated });
  }
  res.status(404).json({ error: 'Problem not found' });
});

// 5. Submissions Management
router.get('/submissions', (req, res) => {
  const { roundId, status, userId } = req.query;
  const submissions = dbStore.getSubmissions({
    roundId: roundId as string | undefined,
    userId: userId as string | undefined,
  });

  const filtered = status
    ? submissions.filter((s) => s.status === status)
    : submissions;

  const enriched = filtered.map((s) => {
    const user = dbStore.getUserById(s.userId);
    let problemTitle = 'Problem';
    const cp = dbStore.getCodingProblemById(s.problemId) || dbStore.getDebuggingProblemById(s.problemId);
    if (cp) problemTitle = cp.title;

    return {
      ...s,
      userName: user ? user.fullName : 'Participant',
      userEmail: user?.email,
      userOrg: user?.organization,
      problemTitle,
    };
  });

  res.json({ submissions: enriched });
});

// Re-evaluate a submission through the sandbox
router.post('/submissions/:id/re-evaluate', async (req: AuthenticatedRequest, res) => {
  try {
    const admin = req.user!;
    const submission = dbStore.getSubmissionById(req.params.id);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    let problem: any = dbStore.getCodingProblemById(submission.problemId) || dbStore.getDebuggingProblemById(submission.problemId);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const execution = await executeSandboxedCode(
      {
        language: submission.language,
        code: submission.code,
        testCases: problem.testCases,
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb,
      },
      problem.points
    );

    submission.status = execution.overallStatus;
    submission.score = execution.score;
    submission.passedTestCases = execution.passedTestCases;
    submission.totalTestCases = execution.totalTestCases;
    submission.testCaseResults = execution.testCaseResults;
    submission.executionTimeMs = execution.maxExecutionTimeMs;
    dbStore.save();

    dbStore.addAuditLog({
      userId: admin.id,
      userName: admin.fullName,
      action: 'RE_EVALUATE_SUBMISSION',
      details: `Re-evaluated submission ${submission.id}. New status: ${submission.status}, score: ${submission.score}.`,
    });

    res.json({ success: true, submission });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Re-evaluation failed' });
  }
});

// 6. Results Publishing Management
router.post('/calculate-final-results', (req: AuthenticatedRequest, res) => {
  const admin = req.user!;
  // Evaluate all rounds qualifications sequentially
  const rounds = dbStore.getRounds();
  for (const r of rounds) {
    evaluateRoundQualifications(r.id);
  }

  const leaderboard = generateLeaderboard();

  dbStore.addAuditLog({
    userId: admin.id,
    userName: admin.fullName,
    action: 'CALCULATE_FINAL_RESULTS',
    details: `Executed full-competition score consolidation and tie-breaking for ${leaderboard.entries.length} participants.`,
  });

  res.json({
    success: true,
    message: 'Calculated final rankings and qualifications successfully.',
    leaderboard,
  });
});

router.post('/publish-final-results', (req: AuthenticatedRequest, res) => {
  const admin = req.user!;
  const { publish } = req.body;
  const isPublished = publish !== undefined ? Boolean(publish) : true;

  dbStore.setFinalResultsPublished(isPublished);

  // Also broadcast announcement to participants
  if (isPublished) {
    dbStore.addAnnouncement({
      id: `ann_pub_${Date.now()}`,
      title: '🏆 Final Competition Results Published!',
      message: 'The official Final Leaderboard is now live. Congratulations to the champions and all participants for outstanding competitive programming performances!',
      type: 'success',
      createdAt: new Date().toISOString(),
      createdBy: admin.fullName,
    });
  }

  dbStore.addAuditLog({
    userId: admin.id,
    userName: admin.fullName,
    action: isPublished ? 'PUBLISH_FINAL_RESULTS' : 'UNPUBLISH_FINAL_RESULTS',
    details: `${isPublished ? 'Published' : 'Unpublished'} official competition results.`,
  });

  res.json({
    success: true,
    isFinalPublished: isPublished,
  });
});

// 7. Announcements Management
router.post('/announcements', (req: AuthenticatedRequest, res) => {
  const admin = req.user!;
  const { title, message, type } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'Title and message are required' });

  const ann = dbStore.addAnnouncement({
    id: `ann_${Date.now()}`,
    title,
    message,
    type: type || 'info',
    createdAt: new Date().toISOString(),
    createdBy: admin.fullName,
  });

  res.json({ success: true, announcement: ann });
});

// 7.5. System & Competition Settings
router.get('/settings', (req, res) => {
  res.json({
    competitionSettings: dbStore.getCompetitionSettings(),
    proctoringWeights: dbStore.getProctoringWeights(),
    aiConfig: dbStore.getAIConfig(),
  });
});

router.put('/settings', (req: AuthenticatedRequest, res) => {
  const admin = req.user!;
  const { competitionSettings, proctoringWeights, aiConfig } = req.body;

  let updatedSettings = dbStore.getCompetitionSettings();
  if (competitionSettings) {
    updatedSettings = dbStore.updateCompetitionSettings(competitionSettings);
  }

  let updatedWeights = dbStore.getProctoringWeights();
  if (proctoringWeights) {
    updatedWeights = dbStore.updateProctoringWeights(proctoringWeights);
  }

  let updatedAI = dbStore.getAIConfig();
  if (aiConfig) {
    updatedAI = dbStore.updateAIConfig(aiConfig);
  }

  dbStore.addAuditLog({
    userId: admin.id,
    userName: admin.fullName,
    action: 'SETTINGS_UPDATE',
    details: 'System configuration, competition rules, or proctoring penalty weights updated.',
  });

  res.json({
    success: true,
    competitionSettings: updatedSettings,
    proctoringWeights: updatedWeights,
    aiConfig: updatedAI,
  });
});

// 8. Audit Logs
router.get('/audit-logs', (req, res) => {
  res.json({ logs: dbStore.getAuditLogs() });
});

// 9. Reset Demo Data
router.post('/reset-database', (req: AuthenticatedRequest, res) => {
  const admin = req.user!;
  dbStore.resetToSeed();

  dbStore.addAuditLog({
    userId: admin.id,
    userName: admin.fullName,
    action: 'RESET_DATABASE',
    details: 'Database reset to initial demo seeds.',
  });

  res.json({ success: true, message: 'Database reset to clean demo seeds' });
});

export default router;
