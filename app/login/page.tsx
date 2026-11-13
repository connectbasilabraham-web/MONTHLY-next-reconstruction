'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, ChartNoAxesCombined, KeyRound, LockKeyhole, Mail, UserRound } from 'lucide-react';

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="social-brand-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#google-icon-clip)">
        <path d="M15.3957 6.6092L8.86944 6.60889C8.58125 6.60889 8.34766 6.84245 8.34766 7.13064V9.21548C8.34766 9.50361 8.58125 9.73723 8.86941 9.73723H12.5446C12.1422 10.7816 11.391 11.6563 10.4327 12.212L11.9998 14.9248C14.5136 13.471 15.9998 10.9201 15.9998 8.06451C15.9998 7.65792 15.9698 7.36726 15.9099 7.03998C15.8643 6.79132 15.6485 6.6092 15.3957 6.6092Z" fill="#167EE6" />
        <path d="M7.99985 12.8695C6.20129 12.8695 4.63116 11.8868 3.78788 10.4326L1.0752 11.9962C2.45566 14.3887 5.04173 15.9999 7.99985 15.9999C9.45101 15.9999 10.8203 15.6092 11.9999 14.9283V14.9246L10.4328 12.2117C9.71595 12.6275 8.88645 12.8695 7.99985 12.8695Z" fill="#12B347" />
        <path d="M12 14.9284V14.9247L10.4329 12.2119C9.71609 12.6276 8.88666 12.8696 8 12.8696V16.0001C9.45116 16.0001 10.8205 15.6094 12 14.9284Z" fill="#0F993E" />
        <path d="M3.13044 8.00019C3.13044 7.11366 3.37238 6.28425 3.78803 5.56747L1.07534 4.00391C0.390687 5.17975 0 6.54531 0 8.00019C0 9.45506 0.390687 10.8206 1.07534 11.9965L3.78803 10.4329C3.37238 9.71612 3.13044 8.88672 3.13044 8.00019Z" fill="#FFD500" />
        <path d="M7.99985 3.13044C9.1727 3.13044 10.25 3.54719 11.0915 4.24041C11.2991 4.41141 11.6008 4.39906 11.7909 4.20891L13.2681 2.73172C13.4839 2.51597 13.4685 2.16281 13.238 1.96288C11.8282 0.739781 9.99382 0 7.99985 0C5.04173 0 2.45566 1.61116 1.0752 4.00372L3.78788 5.56728C4.63116 4.11312 6.20129 3.13044 7.99985 3.13044Z" fill="#FF4B26" />
        <path d="M11.0916 4.24041C11.2992 4.41141 11.601 4.39906 11.7911 4.20891L13.2683 2.73172C13.484 2.51597 13.4686 2.16281 13.2382 1.96288C11.8283 0.73975 9.99397 0 8 0V3.13044C9.17281 3.13044 10.2502 3.54719 11.0916 4.24041Z" fill="#D93F21" />
      </g>
      <defs>
        <clipPath id="google-icon-clip"><rect width="16" height="16" fill="white" /></clipPath>
      </defs>
    </svg>
  );
}

function AppleMark() {
  return (
    <svg aria-hidden="true" className="social-brand-icon apple-brand-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.0788 0C11.1161 0 11.1533 0 11.1926 0C11.284 1.12835 10.8533 1.97146 10.3299 2.582C9.81627 3.18834 9.11298 3.7764 7.97549 3.68717C7.89961 2.57498 8.331 1.79441 8.85373 1.18526C9.33851 0.617573 10.2273 0.112414 11.0788 0Z" fill="black" />
      <path d="M14.5222 11.7446C14.5222 11.7558 14.5222 11.7657 14.5222 11.7762C14.2026 12.7444 13.7466 13.5741 13.1901 14.3442C12.6822 15.0432 12.0597 15.984 10.9482 15.984C9.98775 15.984 9.34981 15.3664 8.36548 15.3496C7.32425 15.3327 6.75164 15.866 5.79964 16.0001C5.69074 16.0001 5.58183 16.0001 5.47504 16.0001C4.77597 15.899 4.21179 15.3453 3.80078 14.8465C2.58882 13.3725 1.65227 11.4685 1.47803 9.03189C1.47803 8.79302 1.47803 8.55484 1.47803 8.31596C1.5518 6.57214 2.39912 5.15432 3.52536 4.46719C4.11975 4.10185 4.93686 3.7906 5.84671 3.92971C6.23664 3.99013 6.63501 4.12363 6.9842 4.25571C7.31511 4.38288 7.72894 4.60841 8.12098 4.59647C8.38656 4.58874 8.65073 4.45033 8.91842 4.35267C9.7025 4.06953 10.4711 3.74493 11.4843 3.89739C12.7018 4.08147 13.566 4.62246 14.1 5.45714C13.07 6.11265 12.2557 7.10049 12.3948 8.7874C12.5185 10.3197 13.4093 11.2162 14.5222 11.7446Z" fill="black" />
    </svg>
  );
}

export default function LoginPage() {
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [notice, setNotice] = useState('');

  function showSocialPreview(provider: string) {
    setNotice(`${provider} sign-in is not connected in this preview.`);
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
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setNotice('Account creation is not connected in this preview.');
            }}
          >
            <div className="login-fields">
              <label htmlFor="account-name">Your name</label>
              <div className="login-input">
                <UserRound size={15} aria-hidden="true" />
                <input id="account-name" type="text" autoComplete="name" required />
              </div>

              <label htmlFor="account-email">Email address</label>
              <div className="login-input">
                <Mail size={15} aria-hidden="true" />
                <input id="account-email" type="email" autoComplete="email" required />
              </div>

              <label htmlFor="account-password">Password</label>
              <div className="login-input">
                <LockKeyhole size={15} aria-hidden="true" />
                <input id="account-password" type="password" autoComplete="new-password" required />
              </div>
            </div>
            <button className="login-submit" type="submit">
              Create account <ArrowRight size={16} aria-hidden="true" />
            </button>
          </form>
        ) : (
          <>
            <div className="login-fields">
              <label htmlFor="login-username">Username or email</label>
              <div className="login-input">
                <Mail size={15} aria-hidden="true" />
                <input id="login-username" type="text" defaultValue="admin" autoComplete="username" />
              </div>

              <label htmlFor="login-password">Password</label>
              <div className="login-input">
                <LockKeyhole size={15} aria-hidden="true" />
                <input id="login-password" type="password" defaultValue="admin" autoComplete="current-password" />
              </div>
            </div>

            <p className="login-demo">Demo preview credentials: <strong>admin / admin</strong></p>
            <Link className="login-submit" href="/">
              Sign in <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </>
        )}

        <div className="login-divider"><span>or continue with</span></div>
        <div className="login-social-options">
          <button className="login-social" type="button" onClick={() => showSocialPreview('Google')}>
            <GoogleMark />
            Google
          </button>
          <button className="login-social" type="button" onClick={() => showSocialPreview('Apple')}>
            <AppleMark />
            Apple
          </button>
        </div>

        {notice && <p className="login-notice" role="status">{notice}</p>}

        <p className="login-auth-switch">
          {creatingAccount ? 'Already have an account?' : 'New to MONTHLY?'}{' '}
          <button
            type="button"
            onClick={() => {
              setCreatingAccount(!creatingAccount);
              setNotice('');
            }}
          >
            {creatingAccount ? 'Sign in' : 'Create account'}
          </button>
        </p>

        <p className="login-disclaimer">Preview only. Accounts and social sign-in are not connected, and this page does not protect financial data.</p>
      </section>

      <span className="login-footer">YOUR FINANCES, ON YOUR DEVICE</span>
    </main>
  );
}
