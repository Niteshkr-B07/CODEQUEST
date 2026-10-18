import { Router } from 'express';
import { dbStore } from '../db/store.ts';
import { requireAuth, requireAdmin, type AuthenticatedRequest } from '../services/authService.ts';
import { proctoringService } from '../services/proctoringService.ts';
import type { ProctoringSettings } from '../db/schema.ts';

const router = Router();

// 1. Participant: Get or create proctoring session for a round
router.get('/session/:roundId', requireAuth, (req: AuthenticatedRequest, res) => {
  const { roundId } = req.params;
  const user = req.user!;

  const round = dbStore.getRoundById(roundId);
  if (!round) {
    return res.status(404).json({ error: 'Round not found' });
  }

  const session = proctoringService.getOrCreateSession(user.id, roundId);
  const consent = dbStore.getConsentRecord(user.id, roundId);

  res.json({
    session,
    consent,
    proctoringSettings: round.proctoringSettings,
    roundName: round.name,
    serverTime: new Date().toISOString(),
  });
});

// 2. Participant: Record proctoring consent
router.post('/consent', requireAuth, (req: AuthenticatedRequest, res) => {
  const { roundId, cameraGranted, micGranted, fullscreenGranted } = req.body;
  const user = req.user!;

  if (!roundId) {
    return res.status(400).json({ error: 'roundId is required' });
  }

  const record = proctoringService.recordConsent({
    participantId: user.id,
    roundId,
    cameraGranted: Boolean(cameraGranted),
    micGranted: Boolean(micGranted),
    fullscreenGranted: Boolean(fullscreenGranted),
  });

  res.json({
    success: true,
    consent: record,
  });
});

// 3. Participant: Record system check completion
router.post('/system-check', requireAuth, (req: AuthenticatedRequest, res) => {
  const { roundId, checkDetails } = req.body;
  const user = req.user!;

  if (!roundId) {
    return res.status(400).json({ error: 'roundId is required' });
  }

  const { event, session } = proctoringService.recordEvent({
    participantId: user.id,
    roundId,
    eventType: 'SYSTEM_CHECK_PASSED',
    severity: 'info',
    metadata: checkDetails || {},
  });

  res.json({
    success: true,
    event,
    session,
  });
});

// 4. Participant: Log real-time proctoring audit event
router.post('/events', requireAuth, (req: AuthenticatedRequest, res) => {
  const { roundId, eventType, severity, metadata } = req.body;
  const user = req.user!;

  if (!roundId || !eventType) {
    return res.status(400).json({ error: 'roundId and eventType are required' });
  }

  const result = proctoringService.recordEvent({
    participantId: user.id,
    roundId,
    eventType,
    severity,
    metadata,
  });

  res.json(result);
});

// 5. Participant: Upload webcam snapshot
router.post('/snapshot', requireAuth, (req: AuthenticatedRequest, res) => {
  const { roundId, imageUrl, metadata } = req.body;
  const user = req.user!;

  if (!roundId || !imageUrl) {
    return res.status(400).json({ error: 'roundId and imageUrl are required' });
  }

  const snapshot = proctoringService.saveSnapshot(user.id, roundId, imageUrl, metadata);

  res.json({
    success: true,
    snapshot,
  });
});

// 6. Get snapshots for a round
router.get('/snapshots/:roundId', requireAuth, (req: AuthenticatedRequest, res) => {
  const { roundId } = req.params;
  const user = req.user!;

  const participantId = user.role === 'admin' ? (req.query.participantId as string | undefined) : user.id;
  const snapshots = dbStore.getProctoringSnapshots(roundId, participantId);

  res.json({ snapshots });
});

// ================= ADMIN ENDPOINTS =================

// 7. Admin: Get all proctoring sessions
router.get('/admin/sessions', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { roundId, status } = req.query;
  let sessions = dbStore.getProctoringSessions(roundId as string | undefined);

  if (status && status !== 'ALL') {
    sessions = sessions.filter((s) => s.status === status);
  }

  // Enrich with user disqualified status
  const enriched = sessions.map((s) => {
    const user = dbStore.getUserById(s.participantId);
    return {
      ...s,
      isDisqualified: user?.isDisqualified || false,
    };
  });

  res.json({
    sessions: enriched,
    total: enriched.length,
    warningCount: enriched.filter((s) => s.status === 'WARNING').length,
    suspiciousCount: enriched.filter((s) => s.status === 'SUSPICIOUS').length,
    reviewRequiredCount: enriched.filter((s) => s.status === 'REVIEW_REQUIRED').length,
  });
});

// 8. Admin: Get audit events with filtering
router.get('/admin/audit-events', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { roundId, participantId, eventType, severity, limit } = req.query;

  const events = dbStore.getAuditEvents({
    roundId: roundId as string | undefined,
    participantId: participantId as string | undefined,
    eventType: eventType as any,
    severity: severity as any,
    limit: limit ? parseInt(limit as string, 10) : 100,
  });

  // Enrich event with participant names
  const enriched = events.map((ev) => {
    const user = dbStore.getUserById(ev.participantId);
    const round = dbStore.getRoundById(ev.roundId);
    return {
      ...ev,
      participantName: user?.fullName || 'Unknown Participant',
      participantEmail: user?.email || '',
      organization: user?.organization || 'Unknown',
      roundName: round?.name || 'Round',
    };
  });

  res.json({ events: enriched });
});

// 9. Admin: Perform session action (lock, unlock, reset warnings, flag, auto-submit, disqualify)
router.post('/admin/action', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { action, sessionId, notes } = req.body;

  if (!action || !sessionId) {
    return res.status(400).json({ error: 'action and sessionId are required' });
  }

  const updatedSession = proctoringService.adminAction(action, sessionId, notes);
  if (!updatedSession) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    success: true,
    session: updatedSession,
  });
});

// 10. Admin: Get code similarity / plagiarism results
router.get('/admin/similarity/:roundId', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { roundId } = req.params;
  const results = dbStore.getSimilarityResults(roundId);

  res.json({
    results,
    count: results.length,
    highlySuspiciousCount: results.filter((r) => r.status === 'HIGHLY_SUSPICIOUS').length,
  });
});

// 11. Admin: Run automated plagiarism scan for round
router.post('/admin/similarity/scan/:roundId', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { roundId } = req.params;
  const results = proctoringService.runPlagiarismScan(roundId);

  res.json({
    success: true,
    results,
    count: results.length,
  });
});

// 12. Admin: Update round proctoring configuration
router.put('/admin/round-settings/:roundId', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { roundId } = req.params;
  const updates: Partial<ProctoringSettings> = req.body;

  const round = dbStore.getRoundById(roundId);
  if (!round) {
    return res.status(404).json({ error: 'Round not found' });
  }

  const updatedSettings: ProctoringSettings = {
    ...(round.proctoringSettings || {
      cameraRequired: true,
      microphoneRequired: true,
      fullscreenRequired: true,
      tabMonitoring: true,
      copyRestriction: true,
      pasteRestriction: true,
      cutRestriction: true,
      snapshotsEnabled: true,
      snapshotIntervalSeconds: 60,
      questionRandomization: true,
      codeSimilarityCheck: true,
      maxTabWarnings: 3,
      violationAction: 'warning',
    }),
    ...updates,
  };

  dbStore.updateRound(roundId, { proctoringSettings: updatedSettings });

  res.json({
    success: true,
    proctoringSettings: updatedSettings,
  });
});

export default router;
