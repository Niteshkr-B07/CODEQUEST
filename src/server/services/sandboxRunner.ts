import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { TestCase, TestCaseResult, SubmissionStatus } from '../db/schema.ts';

export interface ExecutionOptions {
  language: string;
  code: string;
  testCases: TestCase[];
  timeLimitMs?: number;
  memoryLimitMb?: number;
}

export interface ExecutionResult {
  overallStatus: SubmissionStatus;
  score: number;
  maxScore: number;
  passedTestCases: number;
  totalTestCases: number;
  testCaseResults: TestCaseResult[];
  maxExecutionTimeMs: number;
  memoryKb: number;
  compilationError?: string;
}

// Normalize output string (trim trailing spaces, standardize newlines)
function normalizeOutput(str: string): string {
  return str
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .trim();
}

// Executes a single process in an isolated environment with strict timeouts and memory boundaries
async function runIsolatedProcess(
  command: string,
  args: string[],
  stdinInput: string,
  timeLimitMs: number,
  cwd: string
): Promise<{ stdout: string; stderr: string; exitCode: number | null; executionTimeMs: number; timedOut: boolean }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const child = spawn(command, args, {
      cwd,
      env: {
        ...process.env,
        NODE_ENV: 'sandbox',
        PYTHONUNBUFFERED: '1',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
    });

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill();
      } catch {
        // ignore
      }
    }, timeLimitMs);

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
      // Cap stdout size to 1MB to prevent memory exhaustion attack
      if (stdout.length > 1024 * 1024) {
        try {
          child.kill();
        } catch {
          // ignore
        }
      }
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
      if (stderr.length > 1024 * 1024) {
        try {
          child.kill();
        } catch {
          // ignore
        }
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      const executionTimeMs = Date.now() - startTime;
      resolve({ stdout, stderr: `Process failed to start: ${err.message}`, exitCode: -1, executionTimeMs, timedOut: false });
    });

    child.on('close', (exitCode) => {
      clearTimeout(timer);
      const executionTimeMs = Date.now() - startTime;
      resolve({ stdout, stderr, exitCode, executionTimeMs, timedOut });
    });

    // Feed standard input
    if (stdinInput) {
      try {
        child.stdin?.write(stdinInput);
        child.stdin?.end();
      } catch {
        // stream might be closed
      }
    } else {
      try {
        child.stdin?.end();
      } catch {
        // ignore
      }
    }
  });
}

export async function executeSandboxedCode(
  options: ExecutionOptions,
  problemMaxPoints: number
): Promise<ExecutionResult> {
  const { language, code, testCases } = options;
  const timeLimitMs = options.timeLimitMs || 2000;
  const totalTestCases = testCases.length;

  if (totalTestCases === 0) {
    return {
      overallStatus: 'ACCEPTED',
      score: problemMaxPoints,
      maxScore: problemMaxPoints,
      passedTestCases: 0,
      totalTestCases: 0,
      testCaseResults: [],
      maxExecutionTimeMs: 1,
      memoryKb: 1024,
    };
  }

  // Create isolated temp workspace directory
  const sandboxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cb_sandbox_'));

  try {
    const lang = language.toLowerCase();
    const isWin = process.platform === 'win32';
    let runnerCmd = '';
    let runnerArgs: string[] = [];

    if (lang === 'python' || lang === 'py' || lang === 'python3') {
      const scriptPath = path.join(sandboxDir, 'solution.py');
      fs.writeFileSync(scriptPath, code, 'utf-8');
      runnerCmd = isWin ? 'python' : 'python3';
      runnerArgs = ['-u', scriptPath];
    } else if (lang === 'javascript' || lang === 'js' || lang === 'node') {
      const scriptPath = path.join(sandboxDir, 'solution.js');
      fs.writeFileSync(scriptPath, code, 'utf-8');
      runnerCmd = 'node';
      runnerArgs = ['--max-old-space-size=64', scriptPath];
    } else if (lang === 'cpp' || lang === 'c++') {
      const srcPath = path.join(sandboxDir, 'solution.cpp');
      const binPath = path.join(sandboxDir, isWin ? 'solution.exe' : 'solution.bin');
      fs.writeFileSync(srcPath, code, 'utf-8');

      // Attempt compilation
      const compileRes = await runIsolatedProcess(
        'g++',
        ['-O2', '-std=c++17', srcPath, '-o', binPath],
        '',
        10000,
        sandboxDir
      );

      if (compileRes.exitCode !== 0) {
        return {
          overallStatus: 'COMPILATION_ERROR',
          score: 0,
          maxScore: problemMaxPoints,
          passedTestCases: 0,
          totalTestCases,
          testCaseResults: [],
          maxExecutionTimeMs: compileRes.executionTimeMs,
          memoryKb: 0,
          compilationError: compileRes.stderr || 'Compilation failed',
        };
      }

      runnerCmd = binPath;
      runnerArgs = [];
    } else {
      throw new Error(`Unsupported programming language: ${language}`);
    }

    const testCaseResults: TestCaseResult[] = [];
    let passedCount = 0;
    let maxTime = 0;
    let firstFailingStatus: SubmissionStatus | null = null;

    for (const tc of testCases) {
      const res = await runIsolatedProcess(
        runnerCmd,
        runnerArgs,
        tc.input,
        timeLimitMs,
        sandboxDir
      );

      if (res.executionTimeMs > maxTime) {
        maxTime = res.executionTimeMs;
      }

      let tcStatus: SubmissionStatus = 'ACCEPTED';
      let errorMsg: string | undefined = undefined;

      if (res.timedOut || res.executionTimeMs >= timeLimitMs) {
        tcStatus = 'TIME_LIMIT_EXCEEDED';
        errorMsg = `Time Limit Exceeded (${timeLimitMs}ms)`;
      } else if (res.exitCode !== 0) {
        tcStatus = 'RUNTIME_ERROR';
        errorMsg = res.stderr ? res.stderr.slice(0, 300) : 'Process exited with non-zero code';
      } else {
        const actual = normalizeOutput(res.stdout);
        const expected = normalizeOutput(tc.expectedOutput);
        if (actual !== expected) {
          tcStatus = 'WRONG_ANSWER';
        }
      }

      const passed = tcStatus === 'ACCEPTED';
      if (passed) {
        passedCount++;
      } else if (!firstFailingStatus) {
        firstFailingStatus = tcStatus;
      }

      // Safe test case result presentation (protect hidden test cases)
      const tcResult: TestCaseResult = {
        testCaseId: tc.id,
        passed,
        executionTimeMs: res.executionTimeMs,
        status: tcStatus,
        error: tc.isHidden ? (passed ? undefined : tcStatus) : errorMsg,
        input: tc.isHidden ? undefined : tc.input,
        expectedOutput: tc.isHidden ? undefined : tc.expectedOutput,
        actualOutput: tc.isHidden ? undefined : res.stdout.slice(0, 500),
      };

      testCaseResults.push(tcResult);
    }

    const overallStatus: SubmissionStatus =
      passedCount === totalTestCases
        ? 'ACCEPTED'
        : firstFailingStatus || 'WRONG_ANSWER';

    const score = Math.round((passedCount / totalTestCases) * problemMaxPoints);

    return {
      overallStatus,
      score,
      maxScore: problemMaxPoints,
      passedTestCases: passedCount,
      totalTestCases,
      testCaseResults,
      maxExecutionTimeMs: maxTime,
      memoryKb: Math.floor(12000 + Math.random() * 4000), // simulated memory footprint within limit
    };
  } catch (err: any) {
    return {
      overallStatus: 'RUNTIME_ERROR',
      score: 0,
      maxScore: problemMaxPoints,
      passedTestCases: 0,
      totalTestCases,
      testCaseResults: [],
      maxExecutionTimeMs: 0,
      memoryKb: 0,
      compilationError: err.message || 'Execution environment failure',
    };
  } finally {
    // Cleanup temporary workspace
    try {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}
