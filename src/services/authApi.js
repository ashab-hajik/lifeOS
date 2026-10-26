const ACCOUNTS_KEY = 'lifeos_demo_accounts_v1';
const SESSION_KEY = 'lifeos_demo_session_v1';
const HASH_ITERATIONS = 210_000;
const HASH_ALGORITHM = 'PBKDF2-SHA-256';

function readAccounts() {
  const stored = localStorage.getItem(ACCOUNTS_KEY);
  if (!stored) return [];

  try {
    const accounts = JSON.parse(stored);
    if (!Array.isArray(accounts)) throw new Error('Account data has an invalid format.');
    return accounts;
  } catch {
    throw new Error('Local demo accounts could not be read. Existing browser data was left unchanged.');
  }
}

function writeAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function publicUser(account) {
  const { id, fullName, username, email, createdAt, preferences } = account;
  return { id, fullName, username, email, createdAt, preferences };
}

function newId() {
  if (globalThis.crypto.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function toBase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function fromBase64(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function derivePasswordHash(password, salt, iterations = HASH_ITERATIONS) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Password hashing is unavailable in this browser. Use a modern browser over HTTPS or localhost.');
  }

  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  return globalThis.crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    256,
  );
}

async function hashPassword(password) {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePasswordHash(password, salt);
  return {
    passwordAlgorithm: HASH_ALGORITHM,
    passwordIterations: HASH_ITERATIONS,
    passwordSalt: toBase64(salt),
    passwordHash: toBase64(hash),
  };
}

function hashesMatch(actual, expected) {
  if (actual.byteLength !== expected.byteLength) return false;
  let difference = 0;
  const actualBytes = new Uint8Array(actual);
  const expectedBytes = new Uint8Array(expected);
  for (let index = 0; index < actualBytes.length; index += 1) {
    difference |= actualBytes[index] ^ expectedBytes[index];
  }
  return difference === 0;
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

export async function register(fullName, username, email, password) {
  const cleanName = fullName.trim();
  const cleanUsername = normalizeUsername(username);
  const cleanEmail = normalizeEmail(email);

  if (!cleanName || !cleanUsername || !cleanEmail || !password) {
    throw new Error('Complete all required fields.');
  }
  if (!/^[a-z0-9_.-]{3,32}$/.test(cleanUsername)) {
    throw new Error('Username must be 3–32 characters and use letters, numbers, dots, dashes, or underscores.');
  }
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
    throw new Error('Enter a valid email address.');
  }
  if (password.length < 8 || password.length > 128) {
    throw new Error('Password must be between 8 and 128 characters.');
  }

  const accounts = readAccounts();
  if (accounts.some((account) => normalizeUsername(account.username) === cleanUsername)) {
    throw new Error('That username is already registered in this browser.');
  }
  if (accounts.some((account) => normalizeEmail(account.email) === cleanEmail)) {
    throw new Error('That email is already registered in this browser.');
  }

  const account = {
    id: newId(),
    fullName: cleanName,
    username: cleanUsername,
    email: cleanEmail,
    createdAt: new Date().toISOString(),
    preferences: { theme: 'dark', notifications: true },
    ...(await hashPassword(password)),
  };
  writeAccounts([...accounts, account]);
  localStorage.setItem(SESSION_KEY, account.id);
  return publicUser(account);
}

export async function login(identity, password) {
  const normalizedIdentity = identity.trim().toLowerCase();
  if (!normalizedIdentity || !password) throw new Error('Enter your username or email and password.');

  const account = readAccounts().find((entry) =>
    normalizeUsername(entry.username) === normalizedIdentity ||
    normalizeEmail(entry.email) === normalizedIdentity,
  );
  if (!account) throw new Error('No demo account matches those credentials. Register first or check your username/email.');

  try {
    if (account.passwordAlgorithm !== HASH_ALGORITHM) throw new Error('Unsupported password hash.');
    const candidate = await derivePasswordHash(
      password,
      fromBase64(account.passwordSalt),
      account.passwordIterations,
    );
    if (!hashesMatch(candidate, fromBase64(account.passwordHash))) throw new Error('Invalid password.');
  } catch (error) {
    if (error.message === 'Invalid password.' || error.message.startsWith('Password hashing is unavailable')) {
      throw error;
    }
    throw new Error('Invalid username/email or password.');
  }

  localStorage.setItem(SESSION_KEY, account.id);
  return publicUser(account);
}

export async function currentUser() {
  const id = localStorage.getItem(SESSION_KEY);
  if (!id) return null;
  const account = readAccounts().find((entry) => entry.id === id);
  if (!account) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  return publicUser(account);
}

export async function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export async function updateProfile(patch) {
  const id = localStorage.getItem(SESSION_KEY);
  const accounts = readAccounts();
  const index = accounts.findIndex((account) => account.id === id);
  if (index < 0) throw new Error('Your demo session has expired. Please sign in again.');

  const current = accounts[index];
  const fullName = patch.fullName === undefined ? current.fullName : patch.fullName.trim();
  if (!fullName) throw new Error('Display name cannot be empty.');
  const updated = {
    ...current,
    fullName,
    preferences: patch.preferences ? { ...current.preferences, ...patch.preferences } : current.preferences,
  };
  accounts[index] = updated;
  writeAccounts(accounts);
  return publicUser(updated);
}

export function beginOAuth(provider) {
  throw new Error(`${provider} sign-in is unavailable in the local demo. Register or sign in with a demo account.`);
}
