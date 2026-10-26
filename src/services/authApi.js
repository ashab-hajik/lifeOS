const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, { method = 'POST', body } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}/auth/${path}`, {
      method,
      credentials: 'include',
      ...(body === undefined
        ? {}
        : {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }),
    });
  } catch {
    throw new Error('LifeOS could not reach the server. Check that the API is running and try again.');
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || 'The server could not complete that request.');
  }
  return payload;
}

export async function register(fullName, username, email, password) {
  const payload = await request('register', {
    body: { fullName, username, email, password },
  });
  return payload.user;
}

export async function login(identity, password) {
  const payload = await request('login', { body: { identity, password } });
  return payload.user;
}

export async function currentUser() {
  const response = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' }).catch(() => {
    throw new Error('LifeOS could not reach the server. Check that the API is running.');
  });

  if (response.status === 401) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || 'Could not verify your session.');
  }
  return payload.user || null;
}

export async function logout() {
  await request('logout');
}

export async function updateProfile(patch) {
  const payload = await request('profile', { method: 'PATCH', body: patch });
  return payload.user;
}

export function beginOAuth(provider) {
  if (!['google', 'github'].includes(provider)) {
    throw new Error('This sign-in provider is not supported.');
  }
  window.location.assign(`${API_BASE}/auth/${provider}`);
}
