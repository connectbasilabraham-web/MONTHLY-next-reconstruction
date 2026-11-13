'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, KeyRound, LockKeyhole } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password'));
    const confirmation = String(formData.get('confirmation'));

    if (password !== confirmation) {
      setNotice('The passwords do not match.');
      return;
    }

    setBusy(true);
    setNotice('');

    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) {
        setNotice(error.message);
        return;
      }

      router.replace('/');
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to update your password. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-card" aria-labelledby="reset-title">
        <span className="login-mark"><KeyRound size={18} /></span>
        <p className="login-eyebrow">ACCOUNT SECURITY</p>
        <h1 id="reset-title">Choose a new password</h1>
        <p className="login-copy">Use at least 8 characters for your new password.</p>

        <form onSubmit={updatePassword}>
          <div className="login-fields">
            <label htmlFor="reset-password">New password</label>
            <div className="login-input">
              <LockKeyhole size={15} aria-hidden="true" />
              <input id="reset-password" name="password" type="password" autoComplete="new-password" minLength={8} required disabled={busy} />
            </div>
            <label htmlFor="reset-confirmation">Confirm new password</label>
            <div className="login-input">
              <LockKeyhole size={15} aria-hidden="true" />
              <input id="reset-confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={8} required disabled={busy} />
            </div>
          </div>
          <button className="login-submit" type="submit" disabled={busy}>
            {busy ? 'Updating…' : 'Update password'} {!busy && <ArrowRight size={16} aria-hidden="true" />}
          </button>
        </form>

        {notice && <p className="login-notice" role="status">{notice}</p>}
      </section>
    </main>
  );
}
