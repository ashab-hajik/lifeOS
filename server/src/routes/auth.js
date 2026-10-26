import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import users from '../repositories/users.js';
import {
  clearSessionCookie,
  requireAuth,
  setSessionCookie,
} from '../middleware/auth.js';

const router = Router();
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,32}$/;

function publicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
    preferences: user.preferences,
  };
}

function respondWithError(res, status, message) {
  return res.status(status).json({ error: { message } });
}

router.post('/register', async (req, res, next) => {
  try {
    const { fullName, username, email, password } = req.body || {};
    if (
      typeof fullName !== 'string' ||
      typeof username !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !fullName.trim() ||
      !username.trim() ||
      !email.trim() ||
      !password
    ) {
      return respondWithError(res, 400, 'Complete all required fields.');
    }

    const normalizedName = fullName.trim();
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedName.length > 80) {
      return respondWithError(res, 400, 'Full name must be 80 characters or fewer.');
    }
    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      return respondWithError(
        res,
        400,
        'Username must be 3–32 characters and use letters, numbers, dot, dash, or underscore.',
      );
    }
    if (normalizedEmail.length > 254 || !EMAIL_PATTERN.test(normalizedEmail)) {
      return respondWithError(res, 400, 'Enter a valid email address.');
    }
    if (password.length < 8 || password.length > 128) {
      return respondWithError(res, 400, 'Password must be between 8 and 128 characters.');
    }
    if (users.findByIdentity(normalizedEmail) || users.findByIdentity(normalizedUsername)) {
      return respondWithError(res, 409, 'That username or email is already registered.');
    }

    const user = {
      id: randomUUID(),
      fullName: normalizedName,
      username: normalizedUsername,
      email: normalizedEmail,
      emailVerified: false,
      passwordHash: await bcrypt.hash(password, 12),
      createdAt: new Date().toISOString(),
      preferences: { theme: 'dark', notifications: true },
    };

    users.create(user);
    setSessionCookie(res, user.id);
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { identity, password } = req.body || {};
    if (typeof identity !== 'string' || typeof password !== 'string' || !identity.trim() || !password) {
      return respondWithError(res, 400, 'Username/email and password are required.');
    }

    const user = users.findByIdentity(identity.trim().toLowerCase());
    const validPassword =
      user?.passwordHash && (await bcrypt.compare(password, user.passwordHash));
    if (!validPassword) {
      return respondWithError(res, 401, 'Invalid username/email or password.');
    }

    setSessionCookie(res, user.id);
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', (req, res) => {
  clearSessionCookie(res);
  return res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: publicUser(req.user) });
});

router.patch('/profile', requireAuth, (req, res) => {
  const { fullName, preferences } = req.body || {};
  if (
    fullName !== undefined &&
    (typeof fullName !== 'string' || !fullName.trim() || fullName.trim().length > 80)
  ) {
    return respondWithError(res, 400, 'Name must be between 1 and 80 characters.');
  }

  const patch = {};
  if (fullName !== undefined) patch.fullName = fullName.trim();
  if (preferences && typeof preferences === 'object' && !Array.isArray(preferences)) {
    patch.preferences = { ...req.user.preferences, ...preferences };
  }

  const user = users.update(req.user.id, patch);
  return res.json({ user: publicUser(user) });
});

router.post('/forgot-password', (req, res) =>
  respondWithError(res, 501, 'Password recovery requires a configured email provider.'),
);

export default router;
