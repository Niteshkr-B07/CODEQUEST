import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import authRoutes from './src/server/routes/authRoutes.ts';
import roundRoutes from './src/server/routes/roundRoutes.ts';
import quizRoutes from './src/server/routes/quizRoutes.ts';
import codingRoutes from './src/server/routes/codingRoutes.ts';
import leaderboardRoutes from './src/server/routes/leaderboardRoutes.ts';
import analyticsRoutes from './src/server/routes/analyticsRoutes.ts';
import adminRoutes from './src/server/routes/adminRoutes.ts';
import proctoringRoutes from './src/server/routes/proctoringRoutes.ts';
import aiRoutes from './src/server/routes/aiRoutes.ts';

const app = express();
const PORT = 3000;

// Body parsing with safe size limits
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Request logging in development
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    const start = Date.now();
    res.on('finish', () => {
      console.log(`[API] ${req.method} ${req.url} - ${res.statusCode} (${Date.now() - start}ms)`);
    });
  }
  next();
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/rounds', roundRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/proctoring', proctoringRoutes);
app.use('/api/ai', aiRoutes);

// Server health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CODEQUEST Engine',
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const distDir = path.resolve(process.cwd(), 'dist');

  if (isProduction && fs.existsSync(distDir)) {
    // Serve production static assets
    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    // Mount Vite middleware in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CODEQUEST Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
