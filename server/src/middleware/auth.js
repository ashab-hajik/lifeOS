import { createHmac, timingSafeEqual } from 'node:crypto';
import users from '../repositories/users.js';

const COOKIE_NAME = 'lifeos_session';
export const SESSION_LENGTH_MS = 7 * 24 * 60 * 60 * 1000;

function getSigningSecret() {
  return process.env.SESSION_SECRET || 'local-development-only-change-this-secret';
}

function signPayload(payload) {
  return createHmac('sha256', getSigningSecret())
    .update(payload)
    .digest();
}

export function createSessionToken(userId) {
  const session = {
    id: userId,
    exp: Date.now() + SESSION_LENGTH_MS,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = signPayload(payload).toString('base64url');

  return `${payload}.${signature}`;
}

export function setSessionCookie(res, userId) {
  res.cookie(COOKIE_NAME, createSessionToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_LENGTH_MS,
    path: '/',
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

function hasValidSignature(payload, encodedSignature) {
  if (!/^[\w-]+$/.test(payload) || !/^[\w-]+$/.test(encodedSignature)) {
    return false;
  }

  const expected = signPayload(payload);
  const actual = Buffer.from(encodedSignature, 'base64url');

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function getSessionUserId(token) {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  if (!hasValidSignature(payload, signature)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const isValidSession =
      typeof session.id === 'string' &&
      Number.isFinite(session.exp) &&
      session.exp > Date.now();

    return isValidSession ? session.id : null;
  } catch {
    return null;
  }
}

function sendUnauthorized(res) {
  return res.status(401).json({
    error: { message: 'Please sign in to continue.' },
  });
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return sendUnauthorized(res);

  const userId = getSessionUserId(token);
  if (!userId) return sendUnauthorized(res);

  const user = users.findById(userId);
  if (!user) return sendUnauthorized(res);

  req.user = user;
  return next();
}
