import { Router } from 'express';
import { generateLeaderboard } from '../services/scoringService.ts';

const router = Router();

// Standard REST endpoint for leaderboard
router.get('/', (req, res) => {
  const leaderboardData = generateLeaderboard();
  res.json(leaderboardData);
});

// SSE (Server-Sent Events) endpoint for live real-time leaderboard stream
router.get('/live', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial data immediately
  const initialData = generateLeaderboard();
  res.write(`data: ${JSON.stringify(initialData)}\n\n`);

  // Poll state every 4 seconds and push if client stays connected
  const interval = setInterval(() => {
    try {
      const currentData = generateLeaderboard();
      res.write(`data: ${JSON.stringify(currentData)}\n\n`);
    } catch {
      clearInterval(interval);
    }
  }, 4000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

export default router;
