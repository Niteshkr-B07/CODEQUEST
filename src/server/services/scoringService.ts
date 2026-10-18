import { dbStore } from '../db/store.ts';
import type {
  LeaderboardEntry,
  Qualification,
  Round,
  User,
} from '../db/schema.ts';

export interface UserScoreBreakdown {
  userId: string;
  fullName: string;
  organization: string;
  avatarUrl?: string;
  round1Score: number;
  round2Score: number;
  round3Score: number;
  round4Score: number;
  totalScore: number;
  highestRoundNumber: number;
  lastSubmissionTimestamp: number;
  lastSubmissionTimeStr: string;
}

export function computeUserScores(user: User): UserScoreBreakdown {
  const quizAttempts = dbStore.getQuizAttempts(user.id);
  const submissions = dbStore.getSubmissions({ userId: user.id });

  // Round 1: Quiz score (best attempt or latest submitted)
  const round1Attempts = quizAttempts.filter((qa) => qa.roundId === 'round_01_quiz' && qa.isSubmitted);
  const round1Score = round1Attempts.length > 0 ? Math.max(...round1Attempts.map((a) => a.score)) : 0;

  // Round 2: Coding score (sum of maximum score achieved per problem in round 2)
  const r2Submissions = submissions.filter((s) => s.roundId === 'round_02_coding');
  const r2ProblemMax = new Map<string, number>();
  for (const s of r2Submissions) {
    const cur = r2ProblemMax.get(s.problemId) || 0;
    if (s.score > cur) r2ProblemMax.set(s.problemId, s.score);
  }
  const round2Score = Array.from(r2ProblemMax.values()).reduce((a, b) => a + b, 0);

  // Round 3: Debugging score (sum of maximum score achieved per problem in round 3)
  const r3Submissions = submissions.filter((s) => s.roundId === 'round_03_debugging');
  const r3ProblemMax = new Map<string, number>();
  for (const s of r3Submissions) {
    const cur = r3ProblemMax.get(s.problemId) || 0;
    if (s.score > cur) r3ProblemMax.set(s.problemId, s.score);
  }
  const round3Score = Array.from(r3ProblemMax.values()).reduce((a, b) => a + b, 0);

  // Round 4: Final battle score (sum of max score achieved per problem in round 4)
  const r4Submissions = submissions.filter((s) => s.roundId === 'round_04_final');
  const r4ProblemMax = new Map<string, number>();
  for (const s of r4Submissions) {
    const cur = r4ProblemMax.get(s.problemId) || 0;
    if (s.score > cur) r4ProblemMax.set(s.problemId, s.score);
  }
  const round4Score = Array.from(r4ProblemMax.values()).reduce((a, b) => a + b, 0);

  // Determine latest submission timestamp for tie-breaking
  let lastTimestamp = new Date(user.createdAt).getTime();
  let lastTimeStr = user.createdAt;

  for (const qa of round1Attempts) {
    if (qa.submittedAt) {
      const t = new Date(qa.submittedAt).getTime();
      if (t > lastTimestamp) {
        lastTimestamp = t;
        lastTimeStr = qa.submittedAt;
      }
    }
  }

  for (const s of submissions) {
    const t = new Date(s.submittedAt).getTime();
    if (t > lastTimestamp) {
      lastTimestamp = t;
      lastTimeStr = s.submittedAt;
    }
  }

  let highestRound = 1;
  if (round4Score > 0 || r4Submissions.length > 0) highestRound = 4;
  else if (round3Score > 0 || r3Submissions.length > 0) highestRound = 3;
  else if (round2Score > 0 || r2Submissions.length > 0) highestRound = 2;

  const totalScore = round1Score + round2Score + round3Score + round4Score;

  return {
    userId: user.id,
    fullName: user.fullName,
    organization: user.organization,
    avatarUrl: user.avatarUrl,
    round1Score,
    round2Score,
    round3Score,
    round4Score,
    totalScore,
    highestRoundNumber: highestRound,
    lastSubmissionTimestamp: lastTimestamp,
    lastSubmissionTimeStr: lastTimeStr,
  };
}

export function generateLeaderboard(): {
  entries: LeaderboardEntry[];
  isFinal: boolean;
  totalParticipants: number;
} {
  const participants = dbStore.getUsers().filter((u) => u.role === 'participant' && !u.isDisqualified);
  const breakdowns = participants.map((u) => computeUserScores(u));

  // Deterministic tie-breaking rules:
  // 1. Higher total score
  // 2. Higher final round (Round 4) score
  // 3. Higher round 3 score
  // 4. Higher round 2 score
  // 5. Earlier last submission time
  breakdowns.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.round4Score !== a.round4Score) return b.round4Score - a.round4Score;
    if (b.round3Score !== a.round3Score) return b.round3Score - a.round3Score;
    if (b.round2Score !== a.round2Score) return b.round2Score - a.round2Score;
    return a.lastSubmissionTimestamp - b.lastSubmissionTimestamp;
  });

  const isFinal = dbStore.isFinalResultsPublished();

  const entries: LeaderboardEntry[] = breakdowns.map((b, idx) => {
    const quals = dbStore.getQualifications(b.userId);
    // Find latest round qualification
    const latestQual = quals.sort((x, y) => y.roundNumber - x.roundNumber)[0];

    let qualStatus: LeaderboardEntry['qualificationStatus'] = 'PENDING';
    if (isFinal) {
      qualStatus = idx === 0 && b.totalScore > 0 ? 'WINNER' : (latestQual?.status || 'QUALIFIED');
    } else if (latestQual) {
      qualStatus = latestQual.status;
    } else {
      qualStatus = 'QUALIFIED';
    }

    return {
      rank: idx + 1,
      userId: b.userId,
      fullName: b.fullName,
      organization: b.organization,
      avatarUrl: b.avatarUrl,
      round1Score: b.round1Score,
      round2Score: b.round2Score,
      round3Score: b.round3Score,
      round4Score: b.round4Score,
      totalScore: b.totalScore,
      currentRoundNumber: b.highestRoundNumber,
      qualificationStatus: qualStatus,
      lastSubmissionTime: b.lastSubmissionTimeStr,
    };
  });

  return {
    entries,
    isFinal,
    totalParticipants: participants.length,
  };
}

// Check if a participant is eligible to start a specific round
export function checkRoundEligibility(
  userId: string,
  round: Round
): { eligible: boolean; reason?: string; status: 'ACTIVE' | 'QUALIFIED' | 'ELIMINATED' | 'LOCKED' | 'COMPLETED' } {
  // Disqualification check
  const user = dbStore.getUserById(userId);
  if (!user || user.isDisqualified) {
    return { eligible: false, reason: 'Participant is disqualified', status: 'ELIMINATED' };
  }

  // Check round status
  if (round.status === 'upcoming') {
    return { eligible: false, reason: 'This round has not started yet.', status: 'LOCKED' };
  }
  if (round.status === 'paused') {
    return { eligible: false, reason: 'This round is currently paused by admin.', status: 'LOCKED' };
  }
  if (round.status === 'closed') {
    // If closed, check if user completed it
    return { eligible: false, reason: 'This round has concluded.', status: 'COMPLETED' };
  }

  // Round 1 is open to all registered active participants
  if (round.roundNumber === 1) {
    const attempt = dbStore.getQuizAttempt(userId, round.id);
    if (attempt && attempt.isSubmitted) {
      return { eligible: false, reason: 'You have already submitted your Quiz attempt.', status: 'COMPLETED' };
    }
    return { eligible: true, status: 'ACTIVE' };
  }

  // For Round 2, 3, 4: Participant must have qualified from the previous round
  const prevRoundNumber = round.roundNumber - 1;
  const prevRounds = dbStore.getRounds().filter((r) => r.roundNumber === prevRoundNumber);
  const prevRound = prevRounds[0];

  if (!prevRound) {
    return { eligible: true, status: 'ACTIVE' };
  }

  const quals = dbStore.getQualifications(userId, prevRound.id);
  const prevQual = quals[0];

  if (!prevQual) {
    // Check if participant has scores from prev round that meet qualification
    const scores = computeUserScores(user);
    const prevScore =
      prevRoundNumber === 1
        ? scores.round1Score
        : prevRoundNumber === 2
        ? scores.round2Score
        : scores.round3Score;

    if (prevScore > 0) {
      // Auto-qualify if autoAdvance is enabled
      const newQual: Qualification = {
        id: `q_auto_${userId}_${prevRound.id}`,
        userId,
        roundId: prevRound.id,
        roundNumber: prevRoundNumber,
        status: 'QUALIFIED',
        roundScore: prevScore,
        cumulativeScore: scores.totalScore,
        evaluatedAt: new Date().toISOString(),
      };
      dbStore.setQualification(newQual);
      return { eligible: true, status: 'QUALIFIED' };
    }

    return {
      eligible: false,
      reason: `You must participate and qualify from Round ${prevRoundNumber} (${prevRound.name}) to unlock this battle.`,
      status: 'LOCKED',
    };
  }

  if (prevQual.status === 'ELIMINATED') {
    return {
      eligible: false,
      reason: `You were not qualified from Round ${prevRoundNumber}.`,
      status: 'ELIMINATED',
    };
  }

  return { eligible: true, status: 'QUALIFIED' };
}

// Qualification Engine: Evaluate participant qualifications for a round based on rule
export function evaluateRoundQualifications(roundId: string): {
  qualifiedCount: number;
  eliminatedCount: number;
} {
  const round = dbStore.getRoundById(roundId);
  if (!round) throw new Error('Round not found');

  const participants = dbStore.getUsers().filter((u) => u.role === 'participant' && !u.isDisqualified);
  const userScores = participants.map((u) => {
    const breakdown = computeUserScores(u);
    let roundScore = 0;
    if (round.roundNumber === 1) roundScore = breakdown.round1Score;
    else if (round.roundNumber === 2) roundScore = breakdown.round2Score;
    else if (round.roundNumber === 3) roundScore = breakdown.round3Score;
    else if (round.roundNumber === 4) roundScore = breakdown.round4Score;

    return {
      user: u,
      roundScore,
      cumulativeScore: breakdown.totalScore,
      lastSubmissionTime: breakdown.lastSubmissionTimestamp,
    };
  });

  // Sort by round score descending, then earlier submission time
  userScores.sort((a, b) => {
    if (b.roundScore !== a.roundScore) return b.roundScore - a.roundScore;
    return a.lastSubmissionTime - b.lastSubmissionTime;
  });

  const rule = round.qualificationRule;
  let cutoffRank = userScores.length;

  if (rule.type === 'top_n') {
    cutoffRank = Math.min(rule.value, userScores.length);
  } else if (rule.type === 'percentage') {
    cutoffRank = Math.max(1, Math.ceil((rule.value / 100) * userScores.length));
  }

  let qualifiedCount = 0;
  let eliminatedCount = 0;

  userScores.forEach((item, index) => {
    let isQualified = false;

    if (rule.type === 'min_score') {
      isQualified = item.roundScore >= rule.value;
    } else {
      isQualified = index < cutoffRank && item.roundScore > 0;
    }

    const status = isQualified ? 'QUALIFIED' : 'ELIMINATED';
    if (isQualified) qualifiedCount++;
    else eliminatedCount++;

    const qual: Qualification = {
      id: `qual_${item.user.id}_${round.id}`,
      userId: item.user.id,
      roundId: round.id,
      roundNumber: round.roundNumber,
      status,
      roundScore: item.roundScore,
      cumulativeScore: item.cumulativeScore,
      evaluatedAt: new Date().toISOString(),
    };

    dbStore.setQualification(qual);
  });

  dbStore.addAuditLog({
    userId: 'system',
    userName: 'Qualification Engine',
    action: 'EVALUATE_QUALIFICATIONS',
    details: `Evaluated Round ${round.roundNumber} (${round.name}): ${qualifiedCount} qualified, ${eliminatedCount} eliminated.`,
  });

  return { qualifiedCount, eliminatedCount };
}

// Compute comprehensive participant performance metrics
export function getParticipantPerformance(userId: string) {
  const user = dbStore.getUserById(userId);
  if (!user) throw new Error('User not found');

  const scores = computeUserScores(user);
  const quizAttempts = dbStore.getQuizAttempts(userId);
  const submissions = dbStore.getSubmissions({ userId });
  const quals = dbStore.getQualifications(userId);
  const leaderboard = generateLeaderboard();
  const rank = leaderboard.entries.findIndex((e) => e.userId === userId) + 1;

  // Quiz statistics
  let quizAttempted = 0;
  let quizCorrect = 0;
  let quizWrong = 0;
  let quizSkipped = 0;
  let quizTimeSeconds = 0;

  for (const qa of quizAttempts) {
    if (qa.isSubmitted) {
      quizAttempted += qa.attemptedCount;
      quizCorrect += qa.correctCount;
      quizWrong += qa.wrongCount;
      quizSkipped += qa.skippedCount;
      quizTimeSeconds += qa.timeTakenSeconds;
    }
  }

  // Coding and debugging submissions statistics
  const totalSubmissions = submissions.length;
  const acceptedSubmissions = submissions.filter((s) => s.status === 'ACCEPTED').length;
  const wrongSubmissions = submissions.filter((s) => s.status === 'WRONG_ANSWER').length;
  const tleSubmissions = submissions.filter((s) => s.status === 'TIME_LIMIT_EXCEEDED').length;
  const compileErrorSubmissions = submissions.filter((s) => s.status === 'COMPILATION_ERROR').length;
  const runtimeErrorSubmissions = submissions.filter((s) => s.status === 'RUNTIME_ERROR').length;

  const solvedProblemsSet = new Set<string>();
  for (const s of submissions) {
    if (s.status === 'ACCEPTED') {
      solvedProblemsSet.add(s.problemId);
    }
  }

  const avgExecTime =
    submissions.length > 0
      ? Math.round(submissions.reduce((acc, s) => acc + s.executionTimeMs, 0) / submissions.length)
      : 0;

  const totalQuestions = quizAttempted + quizSkipped;
  const overallAccuracy =
    totalQuestions > 0 ? Math.round((quizCorrect / totalQuestions) * 100) : 100;

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      organization: user.organization,
      avatarUrl: user.avatarUrl,
    },
    rank: rank || leaderboard.entries.length,
    totalParticipants: leaderboard.entries.length,
    totalScore: scores.totalScore,
    roundWiseScores: {
      round1: scores.round1Score,
      round2: scores.round2Score,
      round3: scores.round3Score,
      round4: scores.round4Score,
    },
    quizStats: {
      attempted: quizAttempted,
      correct: quizCorrect,
      wrong: quizWrong,
      skipped: quizSkipped,
      timeTakenSeconds: quizTimeSeconds,
    },
    submissionStats: {
      total: totalSubmissions,
      accepted: acceptedSubmissions,
      wrongAnswer: wrongSubmissions,
      tle: tleSubmissions,
      compilationError: compileErrorSubmissions,
      runtimeError: runtimeErrorSubmissions,
      problemsSolved: solvedProblemsSet.size,
      averageExecutionTimeMs: avgExecTime,
      acceptanceRate:
        totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0,
    },
    accuracy: overallAccuracy,
    qualifications: quals,
    isFinalPublished: dbStore.isFinalResultsPublished(),
  };
}
