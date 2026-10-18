import { Router } from 'express';
import { dbStore } from '../db/store.ts';
import { requireAuth, type AuthenticatedRequest } from '../services/authService.ts';
import { executeSandboxedCode } from '../services/sandboxRunner.ts';
import type { Submission, Qualification } from '../db/schema.ts';

const router = Router();

// Seeded deterministic Fisher-Yates shuffle to guarantee unique per-user problem ordering that remains stable on page refresh
function deterministicShuffle<T>(items: T[], seedStr: string): T[] {
  const arr = [...items];
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed << 5) - seed + seedStr.charCodeAt(i);
    seed |= 0;
  }
  const rng = () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Get problems for a specific round (Coding, Debugging, Final)
router.get('/round/:roundId', requireAuth, (req: AuthenticatedRequest, res) => {
  const roundId = req.params.roundId;
  const round = dbStore.getRoundById(roundId);

  if (!round) {
    return res.status(404).json({ error: 'Round not found' });
  }

  const user = req.user!;
  const userSubmissions = dbStore.getSubmissions({ userId: user.id, roundId });
  const shouldRandomize = round.proctoringSettings?.questionRandomization !== false;

  if (round.type === 'coding' || round.type === 'final') {
    const rawProblems = dbStore.getCodingProblems(roundId);
    const sanitized = rawProblems.map((p) => {
      // Find user's best submission for this problem
      const pSubs = userSubmissions.filter((s) => s.problemId === p.id);
      const bestScore = pSubs.length > 0 ? Math.max(...pSubs.map((s) => s.score)) : 0;
      const isSolved = pSubs.some((s) => s.status === 'ACCEPTED');

      return {
        id: p.id,
        roundId: p.roundId,
        title: p.title,
        slug: p.slug,
        description: p.description,
        inputFormat: p.inputFormat,
        outputFormat: p.outputFormat,
        constraints: p.constraints,
        examples: p.examples,
        starterCode: p.starterCode,
        timeLimitMs: p.timeLimitMs,
        memoryLimitMb: p.memoryLimitMb,
        points: p.points,
        difficulty: p.difficulty,
        // Only expose non-hidden sample test cases for testing
        sampleTestCases: p.testCases
          .filter((tc) => !tc.isHidden)
          .map((tc) => ({
            id: tc.id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            explanation: tc.explanation,
          })),
        totalTestCasesCount: p.testCases.length,
        userStats: {
          submissionsCount: pSubs.length,
          bestScore,
          isSolved,
        },
      };
    });

    const orderedProblems = shouldRandomize
      ? deterministicShuffle(sanitized, `${user.id}_${roundId}`)
      : sanitized;

    return res.json({
      round,
      problems: orderedProblems,
      problemType: round.type,
      isRandomized: shouldRandomize,
    });
  }

  if (round.type === 'debugging') {
    const rawProblems = dbStore.getDebuggingProblems(roundId);
    const sanitized = rawProblems.map((p) => {
      const pSubs = userSubmissions.filter((s) => s.problemId === p.id);
      const bestScore = pSubs.length > 0 ? Math.max(...pSubs.map((s) => s.score)) : 0;
      const isSolved = pSubs.some((s) => s.status === 'ACCEPTED');

      return {
        id: p.id,
        roundId: p.roundId,
        title: p.title,
        slug: p.slug,
        description: p.description,
        expectedBehavior: p.expectedBehavior,
        buggyCode: p.buggyCode,
        language: p.language,
        starterCode: p.starterCode,
        timeLimitMs: p.timeLimitMs,
        memoryLimitMb: p.memoryLimitMb,
        points: p.points,
        difficulty: p.difficulty,
        sampleTestCases: p.testCases
          .filter((tc) => !tc.isHidden)
          .map((tc) => ({
            id: tc.id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            explanation: tc.explanation,
          })),
        totalTestCasesCount: p.testCases.length,
        userStats: {
          submissionsCount: pSubs.length,
          bestScore,
          isSolved,
        },
      };
    });

    const orderedProblems = shouldRandomize
      ? deterministicShuffle(sanitized, `${user.id}_${roundId}`)
      : sanitized;

    return res.json({
      round,
      problems: orderedProblems,
      problemType: 'debugging',
      isRandomized: shouldRandomize,
    });
  }

  res.status(400).json({ error: 'Invalid round type for coding endpoints' });
});

// Run Code: Runs against public/sample test cases ONLY
router.post('/run', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { problemId, roundId, language, code, customInput } = req.body;

    if (!problemId || !language || !code) {
      return res.status(400).json({ error: 'Missing required parameters (problemId, language, code)' });
    }

    let problem: any = dbStore.getCodingProblemById(problemId);
    if (!problem) {
      problem = dbStore.getDebuggingProblemById(problemId);
    }
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    let testCasesToRun = problem.testCases.filter((tc: any) => !tc.isHidden);

    // Support optional custom input for user sandbox testing
    if (customInput && typeof customInput === 'string') {
      testCasesToRun = [
        {
          id: 'custom_input_tc',
          problemId: problem.id,
          input: customInput,
          expectedOutput: '',
          isHidden: false,
          explanation: 'Custom Testcase',
        },
      ];
    }

    const executionResult = await executeSandboxedCode(
      {
        language,
        code,
        testCases: testCasesToRun,
        timeLimitMs: problem.timeLimitMs || 2000,
        memoryLimitMb: problem.memoryLimitMb || 128,
      },
      problem.points
    );

    res.json({
      success: true,
      result: executionResult,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Execution error' });
  }
});

// Submit Code: Evaluates against ALL test cases (including hidden), saves submission record
router.post('/submit', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { problemId, roundId, language, code } = req.body;

    if (!problemId || !roundId || !language || !code) {
      return res.status(400).json({ error: 'Missing submission parameters' });
    }

    const round = dbStore.getRoundById(roundId);
    if (!round) {
      return res.status(404).json({ error: 'Round not found' });
    }

    let problem: any = dbStore.getCodingProblemById(problemId);
    let problemType: 'coding' | 'debugging' | 'final' = 'coding';

    if (round.type === 'debugging') {
      problem = dbStore.getDebuggingProblemById(problemId);
      problemType = 'debugging';
    } else if (round.type === 'final') {
      problemType = 'final';
    }

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Execute through isolated sandbox against all test cases
    const execution = await executeSandboxedCode(
      {
        language,
        code,
        testCases: problem.testCases,
        timeLimitMs: problem.timeLimitMs || 2000,
        memoryLimitMb: problem.memoryLimitMb || 128,
      },
      problem.points
    );

    const submission: Submission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      roundId,
      problemId,
      problemType,
      language,
      code,
      status: execution.overallStatus,
      score: execution.score,
      maxScore: execution.maxScore,
      passedTestCases: execution.passedTestCases,
      totalTestCases: execution.totalTestCases,
      testCaseResults: execution.testCaseResults,
      executionTimeMs: execution.maxExecutionTimeMs,
      memoryKb: execution.memoryKb,
      submittedAt: new Date().toISOString(),
    };

    dbStore.addSubmission(submission);

    // Update provisional qualification if score > 0
    if (execution.score > 0) {
      const currentQual = dbStore.getQualifications(user.id, round.id)[0];
      const qual: Qualification = {
        id: currentQual?.id || `qual_${user.id}_${round.id}`,
        userId: user.id,
        roundId: round.id,
        roundNumber: round.roundNumber,
        status: execution.score >= problem.points * 0.5 ? 'QUALIFIED' : 'PENDING',
        roundScore: execution.score,
        cumulativeScore: execution.score,
        evaluatedAt: new Date().toISOString(),
      };
      dbStore.setQualification(qual);
    }

    dbStore.addAuditLog({
      userId: user.id,
      userName: user.fullName,
      action: 'PROBLEM_SUBMISSION',
      details: `Submitted problem "${problem.title}" (${problemType}) in ${language}. Status: ${execution.overallStatus}, Score: ${execution.score}/${execution.maxScore}.`,
    });

    res.json({
      success: true,
      submission: {
        id: submission.id,
        status: submission.status,
        score: submission.score,
        maxScore: submission.maxScore,
        passedTestCases: submission.passedTestCases,
        totalTestCases: submission.totalTestCases,
        executionTimeMs: submission.executionTimeMs,
        memoryKb: submission.memoryKb,
        submittedAt: submission.submittedAt,
        testCaseResults: execution.testCaseResults, // hidden cases do not leak test data
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Submission evaluation failed' });
  }
});

// Get user submissions with filter options
router.get('/submissions', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { roundId, problemId } = req.query;

  const submissions = dbStore.getSubmissions({
    userId: user.id,
    roundId: roundId as string | undefined,
    problemId: problemId as string | undefined,
  });

  // Enrich with problem title
  const enriched = submissions.map((s) => {
    let title = 'Problem';
    const cp = dbStore.getCodingProblemById(s.problemId);
    if (cp) title = cp.title;
    else {
      const dp = dbStore.getDebuggingProblemById(s.problemId);
      if (dp) title = dp.title;
    }

    return {
      id: s.id,
      problemId: s.problemId,
      problemTitle: title,
      roundId: s.roundId,
      problemType: s.problemType,
      language: s.language,
      status: s.status,
      score: s.score,
      maxScore: s.maxScore,
      passedTestCases: s.passedTestCases,
      totalTestCases: s.totalTestCases,
      executionTimeMs: s.executionTimeMs,
      submittedAt: s.submittedAt,
      code: s.code,
    };
  });

  res.json({ submissions: enriched });
});

export default router;
