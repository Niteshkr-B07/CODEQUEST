import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { dbStore, generateSalt, hashPassword } from '../db/store.ts';
import type { User, UserRole } from '../db/schema.ts';

// In-memory token session mapping for ultra-fast, stateless and secure authentication
interface SessionData {
  userId: string;
  role: UserRole;
  email: string;
  fullName: string;
  expiresAt: number;
}

const sessions = new Map<string, SessionData>();

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function createSession(user: User): string {
  const token = `cbt_${crypto.randomBytes(32).toString('hex')}`;
  sessions.set(token, {
    userId: user.id,
    role: user.role,
    email: user.email,
    fullName: user.fullName,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return token;
}

export function verifySession(token: string): SessionData | null {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function revokeSession(token: string) {
  sessions.delete(token);
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.substring(7).trim();
  const session = verifySession(token);
  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }

  const user = dbStore.getUserById(session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User account not found.' });
  }

  if (user.isDisqualified) {
    return res.status(403).json({ error: 'Your account has been disqualified from the competition.' });
  }

  req.user = user;
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Administrative privilege required.' });
    }
    next();
  });
}

export function registerUser(params: {
  fullName: string;
  email: string;
  password: string;
  organization: string;
  phoneNumber?: string;
}): { user: User; token: string } {
  const { fullName, email, password, organization, phoneNumber } = params;

  if (!fullName || !email || !password || !organization) {
    throw new Error('All required fields (full name, email, password, organization) must be filled.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Please provide a valid email address.');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const existing = dbStore.getUserByEmail(email);
  if (existing) {
    throw new Error('An account with this email address already exists.');
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  const newUser: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    email: email.trim().toLowerCase(),
    passwordHash,
    salt,
    fullName: fullName.trim(),
    role: 'participant',
    organization: organization.trim(),
    phoneNumber: phoneNumber?.trim(),
    createdAt: new Date().toISOString(),
    avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`,
  };

  dbStore.addUser(newUser);

  dbStore.addAuditLog({
    userId: newUser.id,
    userName: newUser.fullName,
    action: 'USER_REGISTER',
    details: `New participant registered from ${organization}.`,
  });

  const token = createSession(newUser);
  return { user: newUser, token };
}

export function loginUser(email: string, password: string): { user: User; token: string } {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const user = dbStore.getUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const computedHash = hashPassword(password, user.salt);
  if (computedHash !== user.passwordHash) {
    throw new Error('Invalid email or password.');
  }

  if (user.isDisqualified) {
    throw new Error('This account has been disqualified from CODEQUEST.');
  }

  const token = createSession(user);

  dbStore.addAuditLog({
    userId: user.id,
    userName: user.fullName,
    action: 'USER_LOGIN',
    details: `User logged in (${user.role}).`,
  });

  return { user, token };
}
