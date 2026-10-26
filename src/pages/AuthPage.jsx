import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Command,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useLife } from '../context/LifeContext.jsx';
import { Field, PasswordField, Strength } from '../components/common/FormControls.jsx';
import { beginOAuth, login, register } from '../services/authApi.js';

export function AuthPage({ register: isRegister = false }) {
  const { initializeUser, notify, authError } = useLife();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
    remember: true,
  });

  useEffect(() => {
    const oauthError = new URLSearchParams(location.search).get('oauth_error');
    if (oauthError) setError(oauthError);
    else if (authError) setError(authError);
  }, [location.search, authError]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (isRegister) {
      if (!form.fullName.trim() || !form.username.trim() || !form.email.trim() || !form.password) {
        setError('Complete all required fields.');
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(form.email)) {
        setError('Enter a valid email address.');
        return;
      }
      if (form.password.length < 8) {
        setError('Use at least 8 characters for your password.');
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError('Your passwords do not match.');
        return;
      }
      if (!form.acceptedTerms) {
        setError('Please accept the terms to continue.');
        return;
      }
    }

    setBusy(true);
    try {
      const user = isRegister
        ? await register(
            form.fullName.trim(),
            form.username.trim(),
            form.email.trim(),
            form.password,
          )
        : await login(form.email.trim(), form.password);

      initializeUser(user);
      navigate('/', { replace: true });
      notify(isRegister ? 'Your LifeOS account is ready.' : 'Welcome back.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function startOAuth(provider) {
    setError('');
    try {
      beginOAuth(provider);
    } catch (providerError) {
      setError(providerError.message);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-brand">
          <div className="brand-icon"><Command size={19} /></div>
          <span>life<span className="accent">os</span></span>
          <small className="brand-tagline">One dashboard. Your entire life.</small>
        </div>
        <div className="auth-copy">
          <div className="eyebrow"><Sparkles size={14} /> YOUR LIFE, IN SYNC</div>
          <h1>Make space for<br /><span className="gradient-text">what matters.</span></h1>
          <p>Less juggling. More living. Your goals, habits, and everyday plans finally working together.</p>
          <div className="preview-card">
            <div className="preview-top"><span>YOUR WEEK AT A GLANCE</span><span className="live-dot">LIVE</span></div>
            <div className="preview-bars">
              {[36, 61, 47, 82, 55, 92, 64].map((height, index) => (
                <div className="preview-day" key={`${height}-${index}`}>
                  <div className="preview-bar-wrap"><i style={{ height: `${height}%`, opacity: index === 5 ? 1 : 0.45 }} /></div>
                  <small>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</small>
                </div>
              ))}
            </div>
            <div className="preview-foot"><span><i className="purple-dot" />Focus time</span><b>Weekly preview <ArrowUpRight size={13} /></b></div>
          </div>
          <div className="auth-proof">
            <div className="avatar-stack"><span>A</span><span>M</span><span>J</span><span>+</span></div>
            <span>Join people building better days</span>
          </div>
        </div>
        <div className="auth-orb orb-one" />
        <div className="auth-orb orb-two" />
      </div>

      <div className="auth-form-side">
        <div className="mobile-brand"><div className="brand-icon"><Command size={18} /></div>life<span className="accent">os</span></div>
        <div className="auth-form-box">
          <div className="form-kicker">{isRegister ? 'GET STARTED' : 'WELCOME BACK'}</div>
          <h2>{isRegister ? 'Create your account' : 'Sign in to LifeOS'}</h2>
          <p className="auth-lede">{isRegister ? 'Your more intentional life starts here.' : 'Pick up where you left off.'}</p>
          <div className="demo-auth-notice" role="note">
            <b>DEMO ONLY</b> Accounts are stored in this browser. This is not secure authentication; do not use a real password.
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {isRegister && <>
              <Field label="Full name" value={form.fullName} onChange={(value) => updateField('fullName', value)} placeholder="Alex Morgan" autoComplete="name" />
              <div className="form-row">
                <Field label="Username" value={form.username} onChange={(value) => updateField('username', value)} placeholder="alexm" autoComplete="username" />
                <Field label="Email" value={form.email} onChange={(value) => updateField('email', value)} placeholder="you@example.com" type="email" autoComplete="email" />
              </div>
            </>}

            {!isRegister && <Field label="Email or username" value={form.email} onChange={(value) => updateField('email', value)} placeholder="you@example.com" autoComplete="username" />}

            <PasswordField
              show={showPassword}
              setShow={setShowPassword}
              value={form.password}
              onChange={(value) => updateField('password', value)}
              label={isRegister ? 'Password' : undefined}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
            {isRegister && <>
              <Strength password={form.password} />
              <Field label="Confirm password" value={form.confirmPassword} onChange={(value) => updateField('confirmPassword', value)} type="password" placeholder="Repeat password" autoComplete="new-password" />
            </>}

            {error && <div className="form-error" role="alert">{error}</div>}

            {isRegister ? (
              <label className="terms-check">
                <input type="checkbox" checked={form.acceptedTerms} onChange={(event) => updateField('acceptedTerms', event.target.checked)} />
                <span>I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a></span>
              </label>
            ) : (
              <div className="form-options">
                <label className="remember"><input type="checkbox" checked={form.remember} onChange={(event) => updateField('remember', event.target.checked)} /> Remember me</label>
                <button type="button" className="text-link" onClick={() => notify('Password recovery is not available in this browser-only demo.')}>Forgot password?</button>
              </div>
            )}

            <button className="primary-btn auth-submit" disabled={busy}>
              {busy ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
              <ArrowRight size={17} />
            </button>
          </form>

          <div className="auth-divider"><span />or continue with<span /></div>
          <div className="social-row">
            <button type="button" onClick={() => startOAuth('google')}><b className="google-mark">G</b>Google</button>
            <button type="button" onClick={() => startOAuth('github')}><b className="github-mark">GH</b>GitHub</button>
          </div>
          <div className="auth-switch">
            {isRegister ? 'Already have an account?' : 'New to LifeOS?'}{' '}
            <NavLink to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</NavLink>
          </div>
          <div className="auth-security"><ShieldCheck size={14} /> Demo data stays in this browser</div>
        </div>
      </div>
    </div>
  );
}
