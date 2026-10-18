export type UserRole = 'participant' | 'admin';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  fullName: string;
  role: UserRole;
  organization: string;
  phoneNumber?: string;
  createdAt: string;
  avatarUrl?: string;
  isDisqualified?: boolean;
}

export type RoundType = 'quiz' | 'coding' | 'debugging' | 'final';

export type RoundStatus = 'upcoming' | 'active' | 'paused' | 'closed';

export type QualificationRuleType = 'top_n' | 'min_score' | 'percentage';

export interface QualificationRule {
  type: QualificationRuleType;
  value: number; // e.g. 50 for top 50, 60 for 60% or 60 points
}

export interface ProctoringSettings {
  cameraRequired: boolean;
  microphoneRequired: boolean;
  fullscreenRequired: boolean;
  tabMonitoring: boolean;
  copyRestriction: boolean;
  pasteRestriction: boolean;
  cutRestriction: boolean;
  snapshotsEnabled: boolean;
  snapshotIntervalSeconds: number; // e.g. 60
  questionRandomization: boolean;
  codeSimilarityCheck: boolean;
  maxTabWarnings: number; // e.g. 3
  violationAction: 'warning' | 'temporary_lock' | 'auto_submit' | 'review_required';
}

export interface Round {
  id: string;
  roundNumber: number;
  name: string;
  type: RoundType;
  description: string;
  instructions?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  maxScore: number;
  status: RoundStatus;
  qualificationRule: QualificationRule;
  proctoringSettings?: ProctoringSettings;
  isResultsPublished?: boolean;
}

export interface QuestionOption {
  id: string;
  questionId: string;
  optionKey: 'A' | 'B' | 'C' | 'D';
  optionText: string;
}

export interface QuizQuestion {
  id: string;
  roundId: string;
  questionText: string;
  options: QuestionOption[];
  correctOptionKey: 'A' | 'B' | 'C' | 'D';
  points: number;
  negativeMarking: number;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
  category?: string;
}

export interface TestCase {
  id: string;
  problemId: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  explanation?: string;
}

export interface CodingProblem {
  id: string;
  roundId: string;
  title: string;
  slug: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  starterCode: {
    python: string;
    javascript: string;
    cpp: string;
  };
  timeLimitMs: number;
  memoryLimitMb: number;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  testCases: TestCase[];
}

export interface DebuggingProblem {
  id: string;
  roundId: string;
  title: string;
  slug: string;
  description: string;
  expectedBehavior: string;
  buggyCode: string;
  language: string;
  starterCode: {
    python: string;
    javascript: string;
  };
  timeLimitMs: number;
  memoryLimitMb: number;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  testCases: TestCase[];
}

export type SubmissionStatus =
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT_EXCEEDED'
  | 'COMPILATION_ERROR'
  | 'RUNTIME_ERROR'
  | 'PENDING';

export interface TestCaseResult {
  testCaseId: string;
  passed: boolean;
  input?: string; // only if public
  expectedOutput?: string; // only if public
  actualOutput?: string; // only if public
  executionTimeMs: number;
  status: SubmissionStatus;
  error?: string;
}

export interface Submission {
  id: string;
  userId: string;
  roundId: string;
  problemId: string;
  problemType: 'coding' | 'debugging' | 'final';
  language: string;
  code: string;
  status: SubmissionStatus;
  score: number;
  maxScore: number;
  passedTestCases: number;
  totalTestCases: number;
  testCaseResults: TestCaseResult[];
  executionTimeMs: number;
  memoryKb: number;
  submittedAt: string;
}

export interface QuizAnswer {
  questionId: string;
  selectedOptionKey: 'A' | 'B' | 'C' | 'D' | null;
  isCorrect?: boolean;
  pointsAwarded: number;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  roundId: string;
  startedAt: string;
  submittedAt?: string;
  isSubmitted: boolean;
  answers: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
  evaluatedAnswers?: QuizAnswer[];
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  score: number;
  accuracy: number;
  timeTakenSeconds: number;
  questionOrder?: string[];
  optionsOrder?: Record<string, ('A' | 'B' | 'C' | 'D')[]>;
}

export interface Qualification {
  id: string;
  userId: string;
  roundId: string;
  roundNumber: number;
  status: 'QUALIFIED' | 'ELIMINATED' | 'PENDING';
  roundScore: number;
  cumulativeScore: number;
  evaluatedAt: string;
  notes?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  fullName: string;
  organization: string;
  avatarUrl?: string;
  round1Score: number;
  round2Score: number;
  round3Score: number;
  round4Score: number;
  totalScore: number;
  currentRoundNumber: number;
  qualificationStatus: 'QUALIFIED' | 'ELIMINATED' | 'PENDING' | 'WINNER';
  lastSubmissionTime: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  createdAt: string;
  createdBy: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export type ProctoringEventType =
  | 'SESSION_START'
  | 'TAB_HIDDEN'
  | 'TAB_VISIBLE'
  | 'WINDOW_BLUR'
  | 'WINDOW_FOCUS'
  | 'FULLSCREEN_ENTER'
  | 'FULLSCREEN_EXIT'
  | 'COPY_ATTEMPT'
  | 'PASTE_ATTEMPT'
  | 'CUT_ATTEMPT'
  | 'CONTEXT_MENU_ATTEMPT'
  | 'CAMERA_CONNECTED'
  | 'CAMERA_DISCONNECTED'
  | 'MIC_CONNECTED'
  | 'MIC_DISCONNECTED'
  | 'SUSPICIOUS_SIMILARITY'
  | 'PERIODIC_SNAPSHOT'
  | 'SYSTEM_CHECK_PASSED'
  | 'CONSENT_GRANTED'
  | 'VIOLATION_THRESHOLD_REACHED';

export type EventSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface AuditEvent {
  id: string;
  participantId: string;
  roundId: string;
  sessionId: string;
  eventType: ProctoringEventType;
  severity: EventSeverity;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ProctoringSnapshot {
  id: string;
  participantId: string;
  roundId: string;
  sessionId: string;
  imageUrl: string;
  status: 'normal' | 'review' | 'flagged';
  capturedAt: string;
  metadata?: {
    faceDetected?: boolean;
    notes?: string;
  };
}

export type ProctoringStatus = 'NORMAL' | 'WARNING' | 'SUSPICIOUS' | 'REVIEW_REQUIRED';

export interface ProctoringSession {
  id: string;
  participantId: string;
  participantName: string;
  participantEmail: string;
  organization: string;
  roundId: string;
  roundName: string;
  startedAt: string;
  lastActiveAt: string;
  cameraActive: boolean;
  microphoneActive: boolean;
  fullscreenActive: boolean;
  tabSwitchCount: number;
  copyPasteAttemptCount: number;
  fullscreenExitCount: number;
  violationScore: number;
  status: ProctoringStatus;
  isLocked: boolean;
  autoSubmitted: boolean;
  flaggedForReview: boolean;
  adminNotes?: string;
}

export interface SimilarityResult {
  id: string;
  problemId: string;
  problemTitle: string;
  roundId: string;
  submissionId1: string;
  participantId1: string;
  participantName1: string;
  submissionId2: string;
  participantId2: string;
  participantName2: string;
  similarityScore: number; // 0 - 100
  status: 'NORMAL' | 'REVIEW' | 'SUSPICIOUS' | 'HIGHLY_SUSPICIOUS';
  matchingSnippets?: string[];
  createdAt: string;
  reviewedByAdmin?: boolean;
}

export interface ConsentRecord {
  id: string;
  participantId: string;
  roundId: string;
  agreedAt: string;
  policyVersion: string;
  cameraGranted: boolean;
  micGranted: boolean;
  fullscreenGranted: boolean;
}

export interface AIConfig {
  enabled: boolean;
  model: string;
  allowInCompetition: boolean;
  defaultMode: 'practice' | 'competition';
  apiKey?: string;
  systemPrompt?: string;
}


