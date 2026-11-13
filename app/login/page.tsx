'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChartNoAxesCombined, KeyRound, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="social-brand-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.3957 6.6092L8.86944 6.60889C8.58125 6.60889 8.34766 6.84245 8.34766 7.13064V9.21548C8.34766 9.50361 8.58125 9.73723 8.86941 9.73723H12.5446C12.1422 10.7816 11.391 11.6563 10.4327 12.212L11.9998 14.9248C14.5136 13.471 15.9998 10.9201 15.9998 8.06451C15.9998 7.65792 15.9698 7.36726 15.9099 7.03998C15.8643 6.79132 15.6485 6.6092 15.3957 6.6092Z" fill="#167EE6" />
      <path d="M7.99985 12.8695C6.20129 12.8695 4.63116 11.8868 3.78788 10.4326L1.0752 11.9962C2.45566 14.3887 5.04173 15.9999 7.99985 15.9999C9.45101 15.9999 10.8203 15.6092 11.9999 14.9283V14.9246L10.4328 12.2117C9.71595 12.6275 8.88645 12.8695 7.99985 12.8695Z" fill="#12B347" />
      <path d="M3.13044 8.00019C3.13044 7.11366 3.37238 6.28425 3.78803 5.56747L1.07534 4.00391C0.390687 5.17975 0 6.54531 0 8.00019C0 9.45506 0.390687 10.8206 1.07534 11.9965L3.78803 10.4329C3.37238 9.71612 3.13044 8.88672 3.13044 8.00019Z" fill="#FFD500" />
      <path d="M7.99985 3.13044C9.1727 3.13044 10.25 3.54719 11.0915 4.24041C11.2991 4.41141 11.6008 4.39906 11.7909 4.20891L13.2681 2.73172C13.4839 2.51597 13.4685 2.16281 13.238 1.96288C11.8282 0.739781 9.99382 0 7.99985 0C5.04173 0 2.45566 1.61116 1.0752 4.00372L3.78788 5.56728C4.63116 4.11312 6.20129 3.13044 7.99985 3.13044Z" fill="#FF4B26" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('error') === 'oauth_callback_failed') {
      setNotice('Google sign-in could not be completed. Please try again.');
    } else if (new URLSearchParams(window.location.search).get('error') === 'auth_callback_failed') {
      setNotice('That sign-in link has expired or could not be verified. Request a new link and try again.');
    }
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    const formData = new FormData(event.currentTarget);

    try {
      const { error } = await createClient().auth.signInWithPassword({
        email: String(formData.get('email')).trim(),
        password: String(formData.get('password')),
      });

      if (error) {
        setNotice(error.code === 'invalid_credentials'
          ? 'Email or password is incorrect. Create an account or reset your password if you need access.'
          : error.code === 'email_not_confirmed'
            ? 'Please confirm your email using the link we sent before signing in.'
            : error.message);
        return;
      }

      router.replace('/');
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    const formData = new FormData(event.currentTarget);

    try {
      const { data, error } = await createClient().auth.signUp({
        email: String(formData.get('email')).trim(),
        password: String(formData.get('password')),
        options: {
          data: { full_name: String(formData.get('name')).trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setNotice(error.code === 'user_already_exists'
          ? 'An account with this email already exists. Sign in or reset your password.'
          : error.message);
        return;
      }

      if (data.session) {
        router.replace('/');
        router.refresh();
      } else {
        setNotice(data.user?.identities?.length === 0
          ? 'If an account exists for this email, sign in or use Forgot password.'
          : 'Check your email to confirm your account, then sign in.');
        setCreatingAccount(false);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to create your account. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    setBusy(true);
    setNotice('');

    try {
      const { data, error } = await createClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });

      if (error) {
        setNotice(error.message);
        setBusy(false);
      } else if (!data.url) {
        setNotice('Google sign-in did not return a sign-in URL. Please try again.');
        setBusy(false);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to start Google sign-in. Please try again.');
      setBusy(false);
    }
  }

  async function sendPasswordReset() {
    if (!email.trim()) {
      setNotice('Enter your email address first, then choose Forgot password.');
      return;
    }

    setBusy(true);
    setNotice('');

    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (error) {
        setNotice(error.message);
        return;
      }

      setNotice('If an account exists for that email, a password reset link is on its way.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to send a password reset email. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-screen">
      <Link className="login-brand" href="/" aria-label="MONTHLY home">
        <span className="login-brand-mark"><ChartNoAxesCombined size={17} /></span>
        <span>MONTHLY<span className="brand-dot">.</span></span>
      </Link>

      <section className="login-card" aria-labelledby="login-title">
        <span className="login-mark"><KeyRound size={18} /></span>
        <p className="login-eyebrow">PERSONAL FINANCE</p>
        <h1 id="login-title">{creatingAccount ? 'Create your account' : 'Sign in with email'}</h1>
        <p className="login-copy">
          {creatingAccount ? 'Start building a clearer picture of your finances.' : 'Welcome back. Your monthly overview is ready.'}
        </p>

        {creatingAccount ? (
          <form onSubmit={createAccount}>
            <div className="login-fields">
              <label htmlFor="account-name">Your name</label>
              <div className="login-input">
                <UserRound size={15} aria-hidden="true" />
                <input id="account-name" name="name" type="text" autoComplete="name" maxLength={80} required disabled={busy} />
              </div>

              <label htmlFor="account-email">Email address</label>
              <div className="login-input">
                <Mail size={15} aria-hidden="true" />
                <input id="account-email" name="email" type="email" autoComplete="email" required disabled={busy} />
              </div>

              <label htmlFor="account-password">Password</label>
              <div className="login-input">
                <LockKeyhole size={15} aria-hidden="true" />
                <input id="account-password" name="password" type="password" autoComplete="new-password" minLength={8} required disabled={busy} />
              </div>
            </div>
            <button className="login-submit" type="submit" disabled={busy}>
              {busy ? 'Creating account…' : 'Create account'} {!busy && <ArrowRight size={16} aria-hidden="true" />}
            </button>
            <p className="login-password-hint">Use at least 8 characters. Check your email to confirm your new account.</p>
          </form>
        ) : (
          <form onSubmit={signIn}>
            <div className="login-fields">
              <label htmlFor="login-email">Email address</label>
              <div className="login-input">
                <Mail size={15} aria-hidden="true" />
                <input id="login-email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={busy} />
              </div>

              <label htmlFor="login-password">Password</label>
              <div className="login-input">
                <LockKeyhole size={15} aria-hidden="true" />
                <input id="login-password" name="password" type="password" autoComplete="current-password" required disabled={busy} />
              </div>
            </div>

            <button className="login-submit" type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'} {!busy && <ArrowRight size={16} aria-hidden="true" />}
            </button>
            <button className="login-forgot" type="button" onClick={sendPasswordReset} disabled={busy}>Forgot password?</button>
          </form>
        )}

        <div className="login-divider"><span>or continue with</span></div>
        <div className="login-social-options">
          <button className="login-social" type="button" onClick={signInWithGoogle} disabled={busy}>
            <GoogleMark />
            Continue with Google
          </button>
        </div>

        {notice && <p className="login-notice" role="status">{notice}</p>}

        <p className="login-auth-switch">
          {creatingAccount ? 'Already have an account?' : 'New to MONTHLY?'}{' '}
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setCreatingAccount(!creatingAccount);
              setNotice('');
            }}
          >
            {creatingAccount ? 'Sign in' : 'Create account'}
          </button>
        </p>

        <p className="login-disclaimer">Your account is secured by Supabase authentication.</p>
      </section>

      <span className="login-footer">YOUR FINANCES, YOUR ACCOUNT</span>
    </main>
  );
}
