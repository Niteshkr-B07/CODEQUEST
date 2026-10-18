import { Router } from 'express';
import {
  registerUser,
  loginUser,
  requireAuth,
  revokeSession,
  createSession,
  type AuthenticatedRequest,
} from '../services/authService.ts';
import { dbStore } from '../db/store.ts';

const router = Router();

// Register new participant
router.post('/register', (req, res) => {
  try {
    const { fullName, email, password, organization, phoneNumber } = req.body;
    const result = registerUser({ fullName, email, password, organization, phoneNumber });
    res.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role,
        organization: result.user.organization,
        avatarUrl: result.user.avatarUrl,
      },
      token: result.token,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const result = loginUser(email, password);
    res.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role,
        organization: result.user.organization,
        avatarUrl: result.user.avatarUrl,
      },
      token: result.token,
    });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Login failed' });
  }
});

// Quick demo login for hackathon judges & instant testing
router.post('/demo-login', (req, res) => {
  try {
    const { role, userEmail } = req.body;
    let targetUser;

    if (userEmail) {
      targetUser = dbStore.getUserByEmail(userEmail) || dbStore.getUserByEmail(userEmail.replace('@codequest.dev', '@codebattle.dev'));
    } else if (role === 'admin') {
      targetUser = dbStore.getUserByEmail('admin@codequest.dev') || dbStore.getUserByEmail('admin@codebattle.dev');
    } else {
      targetUser = dbStore.getUserByEmail('alex@codequest.dev') || dbStore.getUserByEmail('alex@codebattle.dev') || dbStore.getUserByEmail('rahul@codequest.dev') || dbStore.getUserByEmail('rahul@codebattle.dev');
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'Demo user not found' });
    }

    const token = createSession(targetUser);

    dbStore.addAuditLog({
      userId: targetUser.id,
      userName: targetUser.fullName,
      action: 'DEMO_LOGIN',
      details: `Instant demo login as ${targetUser.role} (${targetUser.email}).`,
    });

    res.json({
      success: true,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        fullName: targetUser.fullName,
        role: targetUser.role,
        organization: targetUser.organization,
        avatarUrl: targetUser.avatarUrl,
      },
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Demo login failed' });
  }
});

// Get current logged-in user profile
router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organization: user.organization,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
      avatarUrl: user.avatarUrl,
    },
  });
});

// Logout
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    revokeSession(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
