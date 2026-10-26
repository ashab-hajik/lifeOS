const API_ORIGIN = process.env.API_ORIGIN || 'http://localhost:4000';

function getProviderConfig(provider) {
  const prefix = provider.toUpperCase();
  const clientId = process.env[`${prefix}_CLIENT_ID`];
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`];
  const callbackUrl =
    process.env[`${prefix}_CALLBACK_URL`] ||
    `${API_ORIGIN}/api/auth/${provider}/callback`;

  if (!clientId || !clientSecret) {
    throw new Error(`${provider} sign-in is not configured on the server.`);
  }

  return { clientId, clientSecret, callbackUrl };
}

async function readJson(response, provider) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${provider} did not complete sign-in. Check provider settings.`);
  }
  return body;
}

export function createAuthorizationUrl(provider, state) {
  const config = getProviderConfig(provider);
  const endpoint =
    provider === 'google'
      ? 'https://accounts.google.com/o/oauth2/v2/auth'
      : 'https://github.com/login/oauth/authorize';
  const url = new URL(endpoint);
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', config.callbackUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', state);
  url.searchParams.set(
    'scope',
    provider === 'google' ? 'openid email profile' : 'read:user user:email',
  );

  return url.toString();
}

async function exchangeGoogleCode(code) {
  const config = getProviderConfig('google');
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.callbackUrl,
      grant_type: 'authorization_code',
    }),
  });
  const token = await readJson(tokenResponse, 'Google');
  if (!token.access_token) throw new Error('Google did not return an access token.');

  const profileResponse = await fetch(
    'https://openidconnect.googleapis.com/v1/userinfo',
    { headers: { Authorization: `Bearer ${token.access_token}` } },
  );
  const profile = await readJson(profileResponse, 'Google');
  if (!profile.sub || !profile.email || profile.email_verified !== true) {
    throw new Error('Google did not provide a verified email address.');
  }

  return {
    id: String(profile.sub),
    email: profile.email.toLowerCase(),
    fullName: profile.name || profile.email.split('@')[0],
    username: profile.email.split('@')[0],
  };
}

async function exchangeGitHubCode(code) {
  const config = getProviderConfig('github');
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.callbackUrl,
    }),
  });
  const token = await readJson(tokenResponse, 'GitHub');
  if (!token.access_token) throw new Error('GitHub did not return an access token.');

  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token.access_token}`,
    'User-Agent': 'LifeOS',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const profileResponse = await fetch('https://api.github.com/user', { headers });
  const profile = await readJson(profileResponse, 'GitHub');
  const emailsResponse = await fetch('https://api.github.com/user/emails', { headers });
  const emails = await readJson(emailsResponse, 'GitHub');
  const verifiedEmail = Array.isArray(emails)
    ? emails.find((entry) => entry.primary && entry.verified) ||
      emails.find((entry) => entry.verified)
    : null;

  if (!profile.id || !verifiedEmail?.email) {
    throw new Error('GitHub needs a verified email. Grant the user:email scope and try again.');
  }

  return {
    id: String(profile.id),
    email: verifiedEmail.email.toLowerCase(),
    fullName: profile.name || profile.login,
    username: profile.login,
  };
}

export function getOAuthProfile(provider, code) {
  if (provider === 'google') return exchangeGoogleCode(code);
  if (provider === 'github') return exchangeGitHubCode(code);
  throw new Error('This sign-in provider is not supported.');
}

