import { Router } from 'express';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import users from '../repositories/users.js';
import {
  clearSessionCookie,
  setSessionCookie,
} from '../middleware/auth.js';
import {
  createAuthorizationUrl,
  getOAuthProfile,
} from '../services/oauth.js';

const router = Router();
const STATE_COOKIE_AGE = 10 * 60 * 1000;
const providers = ['google', 'github'];

function allowedClientOrigins() {
  return (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getClientOrigin(req) {
  const allowed = allowedClientOrigins();
  const referer = req.get('referer');
  try {
    const origin = new URL(referer).origin;
    if (allowed.includes(origin)) return origin;
    const url = new URL(origin);
    if (
      process.env.NODE_ENV !== 'production' &&
      ['localhost', '127.0.0.1'].includes(url.hostname)
    ) return origin;
  } catch {}
  return allowed[0] || 'http://localhost:5173';
}

function isAllowedClientOrigin(origin) {
  if (allowedClientOrigins().includes(origin)) return true;
  try {
    const url = new URL(origin);
    return process.env.NODE_ENV !== 'production' &&
      ['localhost', '127.0.0.1'].includes(url.hostname);
  } catch {
    return false;
  }
}

function oauthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: STATE_COOKIE_AGE,
    path: '/api/auth',
  };
}

function clearOAuthCookie(res, name) {
  const { maxAge, ...options } = oauthCookieOptions();
  res.clearCookie(name, options);
}

function redirectToLogin(res, origin, message) {
  const url = new URL('/login', origin);
  url.searchParams.set('oauth_error', message);
  return res.redirect(url.toString());
}

function stateMatches(expected, received) {
  if (typeof expected !== 'string' || typeof received !== 'string') return false;
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);
  return (
    expectedBytes.length === receivedBytes.length &&
    timingSafeEqual(expectedBytes, receivedBytes)
  );
}

function usernameFor(profile, provider) {
  const base = (profile.username || profile.email.split('@')[0])
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, '')
    .slice(0, 24) || provider;
  let username = base;
  while (users.findByIdentity(username)) {
    username = `${base}-${randomUUID().slice(0, 6)}`;
  }
  return username;
}

function findOrCreateOAuthUser(provider, profile) {
  const providerUser = users.findByProvider(provider, profile.id);
  if (providerUser) return providerUser;

  const emailUser = users.findByIdentity(profile.email);
  if (emailUser) {
    // Link accounts only when the existing record already has a verified email.
    if (emailUser.emailVerified !== true) {
      throw new Error(
        'This email already has a password account. Sign in with that account first.',
      );
    }

    return users.update(emailUser.id, {
      oauthProviders: { ...emailUser.oauthProviders, [provider]: profile.id },
    });
  }

  const user = {
    id: randomUUID(),
    fullName: profile.fullName,
    username: usernameFor(profile, provider),
    email: profile.email.toLowerCase(),
    emailVerified: true,
    oauthProviders: { [provider]: profile.id },
    createdAt: new Date().toISOString(),
    preferences: { theme: 'dark', notifications: true },
  };
  return users.create(user);
}

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

for (const provider of providers) {
  router.get(`/${provider}`, (req, res) => {
    const origin = getClientOrigin(req);
    const state = randomBytes(32).toString('hex');

    try {
      const authorizationUrl = createAuthorizationUrl(provider, state);
      const options = oauthCookieOptions();
      res.cookie(`lifeos_oauth_${provider}_state`, state, options);
      res.cookie(`lifeos_oauth_${provider}_origin`, origin, options);
      return res.redirect(authorizationUrl);
    } catch (error) {
      return redirectToLogin(res, origin, error.message);
    }
  });

  router.get(`/${provider}/callback`, async (req, res) => {
    const stateCookie = `lifeos_oauth_${provider}_state`;
    const originCookie = `lifeos_oauth_${provider}_origin`;
    const savedState = req.cookies?.[stateCookie];
    const origin = req.cookies?.[originCookie];
    clearOAuthCookie(res, stateCookie);
    clearOAuthCookie(res, originCookie);

    const clientOrigin = isAllowedClientOrigin(origin)
      ? origin
      : getClientOrigin(req);

    if (req.query.error) {
      return redirectToLogin(res, clientOrigin, `${provider} sign-in was cancelled.`);
    }
    if (!stateMatches(savedState, req.query.state)) {
      return redirectToLogin(
        res,
        clientOrigin,
        'Sign-in could not be verified. Please try again.',
      );
    }
    if (typeof req.query.code !== 'string') {
      return redirectToLogin(res, clientOrigin, `${provider} did not return an authorization code.`);
    }

    try {
      const profile = await getOAuthProfile(provider, req.query.code);
      const user = findOrCreateOAuthUser(provider, profile);
      setSessionCookie(res, user.id);
      return res.redirect(new URL('/', clientOrigin).toString());
    } catch (error) {
      return redirectToLogin(res, clientOrigin, error.message);
    }
  });
}

export default router;
