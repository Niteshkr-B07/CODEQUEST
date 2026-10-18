import { Router } from 'express';
import { dbStore } from '../db/store.ts';
import { requireAuth, type AuthenticatedRequest } from '../services/authService.ts';
import { getParticipantPerformance } from '../services/scoringService.ts';

const router = Router();

// Participant performance analytics for logged in user
router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const performance = getParticipantPerformance(user.id);
    res.json(performance);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to compute performance analytics' });
  }
});

// Participant performance analytics by ID
router.get('/participant/:userId', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const performance = getParticipantPerformance(req.params.userId);
    res.json(performance);
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'Participant not found' });
  }
});

// In-app announcements feed
router.get('/announcements', (req, res) => {
  const announcements = dbStore.getAnnouncements();
  res.json({ announcements });
});

export default router;
