import crypto from 'node:crypto';
import { dbStore } from '../db/store.ts';
import type {
  AuditEvent,
  ProctoringSession,
  ProctoringSnapshot,
  ConsentRecord,
  SimilarityResult,
  ProctoringEventType,
  EventSeverity,
  ProctoringStatus,
} from '../db/schema.ts';

export interface AuditEventPayload {
  participantId: string;
  roundId: string;
  sessionId?: string;
  eventType: ProctoringEventType;
  severity?: EventSeverity;
  metadata?: Record<string, any>;
}

export interface ConsentPayload {
  participantId: string;
  roundId: string;
  cameraGranted: boolean;
  micGranted: boolean;
  fullscreenGranted: boolean;
}

/**
 * Normalizes code for plagiarism/similarity comparison
 * Strips comments, removes extra whitespace, normalizes identifiers and strings
 */
export function normalizeCodeForComparison(code: string): string {
  if (!code) return '';
  return code
    // Remove single line comments
    .replace(/\/\/.*$/gm, '')
    .replace(/#.*$/gm, '')
    // Remove multiline comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Normalize string literals
    .replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '""')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Calculates n-gram Jaccard similarity and longest matching blocks between two code snippets
 */
export function computeCodeSimilarity(
  codeA: string,
  codeB: string,
  n: number = 4
): { similarity: number; matchingSnippets: string[] } {
  const normA = normalizeCodeForComparison(codeA);
  const normB = normalizeCodeForComparison(codeB);

  if (!normA || !normB) {
    return { similarity: 0, matchingSnippets: [] };
  }

  if (normA === normB) {
    return {
      similarity: 100,
      matchingSnippets: [codeA.slice(0, Math.min(200, codeA.length))],
    };
  }

  // Tokenize by space/operators
  const tokensA = normA.split(/([^\w])/).filter((t) => t.trim().length > 0);
  const tokensB = normB.split(/([^\w])/).filter((t) => t.trim().length > 0);

  if (tokensA.length < n || tokensB.length < n) {
    // Fallback to character Levenshtein/overlap
    const commonChars = normA.split('').filter((c) => normB.includes(c)).length;
    const sim = Math.min(100, Math.round((2.0 * commonChars / (normA.length + normB.length)) * 100));
    return { similarity: sim, matchingSnippets: [] };
  }

  // Generate n-grams
  const ngramsA = new Set<string>();
  for (let i = 0; i <= tokensA.length - n; i++) {
    ngramsA.add(tokensA.slice(i, i + n).join(' '));
  }

  const ngramsB = new Set<string>();
  for (let i = 0; i <= tokensB.length - n; i++) {
    ngramsB.add(tokensB.slice(i, i + n).join(' '));
  }

  let intersectionCount = 0;
  const matches: string[] = [];
  ngramsA.forEach((ngram) => {
    if (ngramsB.has(ngram)) {
      intersectionCount++;
      if (matches.length < 5) {
        matches.push(ngram);
      }
    }
  });

  const unionCount = ngramsA.size + ngramsB.size - intersectionCount;
  const jaccard = unionCount > 0 ? (intersectionCount / unionCount) : 0;

  // Scale similarity to 0-100% with weighting
  const similarityScore = Math.min(100, Math.round(jaccard * 100 * 1.35));

  return {
    similarity: similarityScore,
    matchingSnippets: matches,
  };
}

class ProctoringService {
  /**
   * Retrieves or initializes a participant's proctoring session for a round
   */
  public getOrCreateSession(participantId: string, roundId: string): ProctoringSession {
    let session = dbStore.getProctoringSession(participantId, roundId);
    if (session) {
      return session;
    }

    const user = dbStore.getUserById(participantId);
    const round = dbStore.getRoundById(roundId);

    session = {
      id: `psess_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      participantId,
      participantName: user ? user.fullName : 'Participant',
      participantEmail: user?.email || '',
      organization: user?.organization || 'Unknown',
      roundId,
      roundName: round?.name || 'Competition Round',
      startedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      cameraActive: true,
      microphoneActive: true,
      fullscreenActive: true,
      tabSwitchCount: 0,
      copyPasteAttemptCount: 0,
      fullscreenExitCount: 0,
      violationScore: 0,
      status: 'NORMAL',
      isLocked: false,
      autoSubmitted: false,
      flaggedForReview: false,
    };

    dbStore.saveProctoringSession(session);
    return session;
  }

  /**
   * Ingests a proctoring audit event, applies violation weights, updates session status and executes actions
   */
  public recordEvent(payload: AuditEventPayload): {
    event: AuditEvent;
    session: ProctoringSession;
    warningNotice?: string;
  } {
    const session = this.getOrCreateSession(payload.participantId, payload.roundId);
    const round = dbStore.getRoundById(payload.roundId);
    const weights = dbStore.getProctoringWeights();
    const settings = round?.proctoringSettings;

    // Determine event severity if not provided
    let severity: EventSeverity = payload.severity || 'low';
    let violationIncrement = 0;
    let warningNotice: string | undefined;

    switch (payload.eventType) {
      case 'TAB_HIDDEN':
      case 'WINDOW_BLUR':
        session.tabSwitchCount += 1;
        violationIncrement = weights.tabSwitch;
        severity = session.tabSwitchCount >= (settings?.maxTabWarnings || 3) ? 'critical' : 'high';
        warningNotice = `Tab switch detected (${session.tabSwitchCount}/${settings?.maxTabWarnings || 3} warnings)`;
        break;

      case 'TAB_VISIBLE':
      case 'WINDOW_FOCUS':
        severity = 'info';
        break;

      case 'FULLSCREEN_EXIT':
        session.fullscreenExitCount += 1;
        session.fullscreenActive = false;
        violationIncrement = weights.fullscreenExit;
        severity = 'high';
        warningNotice = 'Fullscreen exited. Please re-enter fullscreen mode.';
        break;

      case 'FULLSCREEN_ENTER':
        session.fullscreenActive = true;
        severity = 'info';
        break;

      case 'COPY_ATTEMPT':
        session.copyPasteAttemptCount += 1;
        violationIncrement = weights.copyAttempt;
        severity = 'medium';
        warningNotice = 'Clipboard copy attempt detected.';
        break;

      case 'PASTE_ATTEMPT':
        session.copyPasteAttemptCount += 1;
        violationIncrement = weights.pasteAttempt;
        severity = 'high';
        warningNotice = 'Clipboard paste attempt detected.';
        break;

      case 'CUT_ATTEMPT':
        session.copyPasteAttemptCount += 1;
        violationIncrement = weights.copyAttempt;
        severity = 'medium';
        break;

      case 'CAMERA_DISCONNECTED':
        session.cameraActive = false;
        violationIncrement = weights.cameraLost;
        severity = 'critical';
        warningNotice = 'Camera stream lost. Please reconnect camera.';
        break;

      case 'CAMERA_CONNECTED':
        session.cameraActive = true;
        severity = 'info';
        break;

      case 'MIC_DISCONNECTED':
        session.microphoneActive = false;
        violationIncrement = weights.micLost;
        severity = 'high';
        warningNotice = 'Microphone connection lost.';
        break;

      case 'MIC_CONNECTED':
        session.microphoneActive = true;
        severity = 'info';
        break;

      case 'SUSPICIOUS_SIMILARITY':
        violationIncrement = weights.suspiciousSimilarity;
        severity = 'critical';
        break;

      default:
        severity = payload.severity || 'info';
        break;
    }

    session.violationScore += violationIncrement;
    session.lastActiveAt = new Date().toISOString();

    // Check threshold actions based on round settings
    const maxWarnings = settings?.maxTabWarnings ?? 3;
    const action = settings?.violationAction || 'warning';

    if (session.tabSwitchCount >= maxWarnings || session.violationScore >= 75) {
      if (action === 'temporary_lock') {
        session.isLocked = true;
        session.status = 'SUSPICIOUS';
        warningNotice = 'SESSION LOCKED: Warning limit exceeded. Administrative unlock required.';
      } else if (action === 'auto_submit') {
        session.autoSubmitted = true;
        session.status = 'REVIEW_REQUIRED';
        session.flaggedForReview = true;
        warningNotice = 'Maximum violations reached. Round attempt automatically submitted.';
      } else if (action === 'review_required') {
        session.status = 'REVIEW_REQUIRED';
        session.flaggedForReview = true;
      } else {
        session.status = 'WARNING';
      }
    } else if (session.tabSwitchCount > 0 || session.violationScore > 20) {
      session.status = 'WARNING';
    }

    // Persist event in audit_events
    const event: AuditEvent = {
      id: `ev_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      participantId: payload.participantId,
      roundId: payload.roundId,
      sessionId: session.id,
      eventType: payload.eventType,
      severity,
      timestamp: new Date().toISOString(),
      metadata: payload.metadata || {},
    };

    dbStore.addAuditEvent(event);
    dbStore.saveProctoringSession(session);

    return { event, session, warningNotice };
  }

  /**
   * Saves candidate periodic or violation webcam snapshot
   */
  public saveSnapshot(
    participantId: string,
    roundId: string,
    imageUrl: string,
    metadata?: { faceDetected?: boolean; notes?: string }
  ): ProctoringSnapshot {
    const session = this.getOrCreateSession(participantId, roundId);

    const snapshot: ProctoringSnapshot = {
      id: `snap_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      participantId,
      roundId,
      sessionId: session.id,
      imageUrl,
      status: session.status === 'REVIEW_REQUIRED' ? 'flagged' : 'normal',
      capturedAt: new Date().toISOString(),
      metadata,
    };

    dbStore.addProctoringSnapshot(snapshot);
    return snapshot;
  }

  /**
   * Records participant consent before entering monitored round
   */
  public recordConsent(payload: ConsentPayload): ConsentRecord {
    const record: ConsentRecord = {
      id: `consent_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      participantId: payload.participantId,
      roundId: payload.roundId,
      agreedAt: new Date().toISOString(),
      policyVersion: '2026.1',
      cameraGranted: payload.cameraGranted,
      micGranted: payload.micGranted,
      fullscreenGranted: payload.fullscreenGranted,
    };

    dbStore.saveConsentRecord(record);

    // Also record audit event
    this.recordEvent({
      participantId: payload.participantId,
      roundId: payload.roundId,
      eventType: 'CONSENT_GRANTED',
      severity: 'info',
      metadata: { camera: payload.cameraGranted, mic: payload.micGranted, fullscreen: payload.fullscreenGranted },
    });

    return record;
  }

  /**
   * Runs automated pairwise code similarity & plagiarism scanner across all participant submissions for a round
   */
  public runPlagiarismScan(roundId: string): SimilarityResult[] {
    const submissions = dbStore.getSubmissions({ roundId });
    const round = dbStore.getRoundById(roundId);
    const results: SimilarityResult[] = [];

    // Group submissions by problemId
    const byProblem: Record<string, typeof submissions> = {};
    for (const sub of submissions) {
      if (!byProblem[sub.problemId]) {
        byProblem[sub.problemId] = [];
      }
      byProblem[sub.problemId].push(sub);
    }

    // Compare pairs for each problem
    for (const [problemId, subs] of Object.entries(byProblem)) {
      const problem = dbStore.getCodingProblemById(problemId) || dbStore.getDebuggingProblemById(problemId);
      const problemTitle = problem ? problem.title : 'Problem Solution';

      // Keep only latest submission per user for this problem
      const latestByUser = new Map<string, typeof subs[0]>();
      for (const s of subs) {
        if (!latestByUser.has(s.userId) || new Date(s.submittedAt) > new Date(latestByUser.get(s.userId)!.submittedAt)) {
          latestByUser.set(s.userId, s);
        }
      }

      const userSubmissions = Array.from(latestByUser.values());

      for (let i = 0; i < userSubmissions.length; i++) {
        for (let j = i + 1; j < userSubmissions.length; j++) {
          const sub1 = userSubmissions[i];
          const sub2 = userSubmissions[j];

          if (sub1.userId === sub2.userId) continue;

          const u1 = dbStore.getUserById(sub1.userId);
          const u2 = dbStore.getUserById(sub2.userId);

          const { similarity, matchingSnippets } = computeCodeSimilarity(sub1.code, sub2.code);

          let status: SimilarityResult['status'] = 'NORMAL';
          if (similarity >= 85) {
            status = 'HIGHLY_SUSPICIOUS';
          } else if (similarity >= 70) {
            status = 'SUSPICIOUS';
          } else if (similarity >= 50) {
            status = 'REVIEW';
          }

          if (similarity >= 50) {
            const simResult: SimilarityResult = {
              id: `sim_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
              problemId,
              problemTitle,
              roundId,
              submissionId1: sub1.id,
              participantId1: sub1.userId,
              participantName1: u1?.fullName || 'Participant A',
              submissionId2: sub2.id,
              participantId2: sub2.userId,
              participantName2: u2?.fullName || 'Participant B',
              similarityScore: similarity,
              status,
              matchingSnippets,
              createdAt: new Date().toISOString(),
              reviewedByAdmin: false,
            };

            results.push(simResult);

            // If highly suspicious, flag participants' proctoring sessions
            if (status === 'HIGHLY_SUSPICIOUS') {
              const sess1 = this.getOrCreateSession(sub1.userId, roundId);
              const sess2 = this.getOrCreateSession(sub2.userId, roundId);
              sess1.flaggedForReview = true;
              sess2.flaggedForReview = true;
              sess1.status = 'REVIEW_REQUIRED';
              sess2.status = 'REVIEW_REQUIRED';
              dbStore.saveProctoringSession(sess1);
              dbStore.saveProctoringSession(sess2);
            }
          }
        }
      }
    }

    const existing = dbStore.getSimilarityResults();
    const otherRoundResults = existing.filter((r) => r.roundId !== roundId);
    const combined = [...results, ...otherRoundResults];
    dbStore.saveSimilarityResults(combined.length > 0 ? combined : existing);
    return results.length > 0 ? results : dbStore.getSimilarityResults(roundId);
  }

  /**
   * Admin actions on sessions
   */
  public adminAction(
    action: 'lock' | 'unlock' | 'clear_warnings' | 'flag_review' | 'auto_submit' | 'disqualify',
    sessionId: string,
    notes?: string
  ): ProctoringSession | null {
    const session = dbStore.getProctoringSessionById(sessionId);
    if (!session) return null;

    switch (action) {
      case 'lock':
        session.isLocked = true;
        session.status = 'SUSPICIOUS';
        break;
      case 'unlock':
        session.isLocked = false;
        if (session.status === 'SUSPICIOUS' && session.tabSwitchCount < 3) {
          session.status = 'WARNING';
        }
        break;
      case 'clear_warnings':
        session.tabSwitchCount = 0;
        session.copyPasteAttemptCount = 0;
        session.fullscreenExitCount = 0;
        session.violationScore = 0;
        session.status = 'NORMAL';
        session.isLocked = false;
        break;
      case 'flag_review':
        session.flaggedForReview = true;
        session.status = 'REVIEW_REQUIRED';
        if (notes) session.adminNotes = notes;
        break;
      case 'auto_submit':
        session.autoSubmitted = true;
        session.status = 'REVIEW_REQUIRED';
        break;
      case 'disqualify':
        session.status = 'REVIEW_REQUIRED';
        session.isLocked = true;
        const user = dbStore.getUserById(session.participantId);
        if (user) {
          user.isDisqualified = true;
          dbStore.updateUser(user.id, { isDisqualified: true });
        }
        break;
    }

    session.lastActiveAt = new Date().toISOString();
    if (notes) session.adminNotes = notes;
    dbStore.saveProctoringSession(session);

    dbStore.addAuditLog({
      userId: 'user_admin_01',
      userName: 'Master Admin',
      action: `PROCTOR_${action.toUpperCase()}`,
      details: `Action ${action} performed on session ${session.id} for ${session.participantName}. Notes: ${notes || 'None'}`,
    });

    return session;
  }
}

export const proctoringService = new ProctoringService();
