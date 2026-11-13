'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, LogOut, RotateCcw, ShieldCheck, SlidersHorizontal, Upload, UserRound } from 'lucide-react';
import { useStore } from '@/components/Store';
import { createClient } from '@/lib/supabase/client';

const goals = [
  ['weight', 'Weight / food choices'],
  ['save5000', 'Save ₹5,000'],
  ['lessDelivery', 'Reduce food delivery'],
  ['emergency', 'Emergency buffer'],
  ['shopping', 'Mindful shopping'],
];
const maxAvatarBytes = 2 * 1024 * 1024;

export default function Page() {
  const { d, S, user, restoreData, resetData } = useStore();
  const router = useRouter();
  const avatarInput = useRef<HTMLInputElement>(null);
  const backupInput = useRef<HTMLInputElement>(null);
  const metadata = user?.user_metadata ?? {};
  const accountName = typeof metadata.full_name === 'string'
    ? metadata.full_name
    : typeof metadata.name === 'string'
      ? metadata.name
      : user?.email?.split('@')[0] ?? '';
  const accountAvatar = typeof metadata.avatar_url === 'string'
    ? metadata.avatar_url
    : typeof metadata.picture === 'string'
      ? metadata.picture
      : '';
  const [profileName, setProfileName] = useState(accountName);
  const [avatarUrl, setAvatarUrl] = useState(accountAvatar);
  const [message, setMessage] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);
  const [legacyDataAvailable, setLegacyDataAvailable] = useState(false);

  useEffect(() => {
    setProfileName(accountName);
    setAvatarUrl(accountAvatar);
  }, [accountName, accountAvatar]);

  useEffect(() => {
    try {
      setLegacyDataAvailable(localStorage.getItem('monthly:data:v3') !== null);
    } catch {
      setMessage('Could not check for finance data saved before account sign-in.');
    }
  }, []);

  function download() {
    const anchor = document.createElement('a');
    const url = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }));
    anchor.href = url;
    anchor.download = 'monthly-backup.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function restore(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      restoreData(JSON.parse(await file.text()));
      setMessage('Backup restored successfully.');
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown validation error';
      setMessage(`Backup not restored: ${detail}. Your current data was not changed.`);
    } finally {
      input.value = '';
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = profileName.trim();
    if (!name) {
      setProfileMessage('Enter your name before saving.');
      return;
    }

    setProfileBusy(true);
    setProfileMessage('');
    try {
      const { error } = await createClient().auth.updateUser({
        data: { ...user?.user_metadata, full_name: name },
      });
      if (error) {
        setProfileMessage(`Profile was not saved: ${error.message}`);
        return;
      }
      setProfileMessage('Profile saved.');
    } catch (error) {
      setProfileMessage(`Profile was not saved: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProfileBusy(false);
    }
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !user) return;

    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const extension = extensions[file.type];
    if (!extension) {
      setProfileMessage('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > maxAvatarBytes) {
      setProfileMessage('Choose an image smaller than 2 MB.');
      return;
    }

    setProfileBusy(true);
    setProfileMessage('');
    const supabase = createClient();
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;

    try {
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) {
        const detail = uploadError.message.includes('Bucket not found')
          ? 'Avatar storage is not configured. Apply the Supabase avatar setup migration, then try again.'
          : uploadError.message;
        setProfileMessage(`Photo was not uploaded: ${detail}`);
        return;
      }

      const publicUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
      const { error: profileError } = await supabase.auth.updateUser({
        data: { ...user.user_metadata, avatar_url: publicUrl, avatar_path: path },
      });
      if (profileError) {
        const { error: cleanupError } = await supabase.storage.from('avatars').remove([path]);
        setProfileMessage(cleanupError
          ? `Photo was not saved: ${profileError.message}. Uploaded file cleanup also failed: ${cleanupError.message}`
          : `Photo was not saved: ${profileError.message}`);
        return;
      }

      setAvatarUrl(publicUrl);
      const oldPath = user.user_metadata.avatar_path;
      if (typeof oldPath === 'string' && oldPath !== path) {
        const { error: cleanupError } = await supabase.storage.from('avatars').remove([oldPath]);
        setProfileMessage(cleanupError
          ? `Profile photo updated, but the previous photo could not be removed: ${cleanupError.message}`
          : 'Profile photo updated.');
      } else {
        setProfileMessage('Profile photo updated.');
      }
    } catch (error) {
      setProfileMessage(`Photo was not uploaded: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProfileBusy(false);
    }
  }

  async function signOut() {
    setProfileBusy(true);
    setProfileMessage('');
    try {
      const { error } = await createClient().auth.signOut();
      if (error) {
        setProfileMessage(`Could not sign out: ${error.message}`);
        return;
      }
      router.replace('/login');
      router.refresh();
    } catch (error) {
      setProfileMessage(`Could not sign out: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProfileBusy(false);
    }
  }

  function reset() {
    if (!confirm('Replace this account’s data with demo data?')) return;
    try {
      resetData();
      setMessage('This account’s data was reset.');
    } catch (error) {
      setMessage(`Could not reset data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  function importLegacyData() {
    if (!confirm('Import the old browser data into this account? It will replace this account’s current finance data. Continue only if the old data belongs to you.')) return;
    try {
      const raw = localStorage.getItem('monthly:data:v3');
      if (raw === null) {
        setLegacyDataAvailable(false);
        setMessage('No older browser data was found.');
        return;
      }

      restoreData(JSON.parse(raw));
      setLegacyDataAvailable(false);
      try {
        localStorage.removeItem('monthly:data:v3');
        setMessage('Older browser data was imported into this account.');
      } catch {
        setMessage('Data was imported, but the shared older copy could not be removed from this browser. Sign out only on a device you control.');
      }
    } catch (error) {
      setMessage(`Older data was not imported: ${error instanceof Error ? error.message : 'Unknown validation error'}`);
    }
  }

  return (
    <>
      <header className="page-header">
        <div><span className="eyebrow">YOUR ACCOUNT</span><h1>Settings</h1><p>Profile, preferences, and your financial data.</p></div>
      </header>

      <section className="page-card">
        <div className="page-card-heading">
          <div><span className="eyebrow">ACCOUNT PROFILE</span><h2>Your account</h2></div>
          <UserRound size={19} color="var(--purple)" />
        </div>
        <div className="account-profile">
          <button className="profile-avatar-button" type="button" onClick={() => avatarInput.current?.click()} disabled={profileBusy} aria-label="Upload a profile photo">
            {avatarUrl ? <img src={avatarUrl} alt="" /> : <UserRound size={30} aria-hidden="true" />}
          </button>
          <div className="account-profile-details">
            <strong>{profileName || accountName || 'Your account'}</strong>
            <span>{user?.email}</span>
            <button className="button button-secondary" type="button" onClick={() => avatarInput.current?.click()} disabled={profileBusy}>
              <Upload size={15} />{profileBusy ? 'Please wait…' : 'Upload profile photo'}
            </button>
          </div>
          <input ref={avatarInput} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadAvatar} />
        </div>
        <form className="form-grid profile-form" onSubmit={saveProfile}>
          <label className="form-field">Display name
            <input value={profileName} onChange={(event) => setProfileName(event.target.value)} maxLength={80} required disabled={profileBusy} />
          </label>
          <label className="form-field">Email address
            <input value={user?.email ?? ''} readOnly aria-readonly="true" />
          </label>
          <div className="profile-actions">
            <button className="button button-purple" type="submit" disabled={profileBusy}>Save profile</button>
            <button className="button button-secondary" type="button" onClick={signOut} disabled={profileBusy}><LogOut size={15} />Sign out</button>
          </div>
        </form>
        {profileMessage && <p className={`inline-status ${profileMessage.startsWith('Could not') || profileMessage.includes('not saved') || profileMessage.includes('not uploaded') ? 'error' : ''}`} role="status">{profileMessage}</p>}
      </section>

      <section className="page-card">
        <div className="page-card-heading"><div><span className="eyebrow">PERSONAL FINANCE</span><h2>Your details</h2></div><UserRound size={19} color="var(--purple)" /></div>
        <div className="form-grid">
          <label className="form-field">Finance profile name<input value={d.name} onChange={(event) => S((current) => ({ ...current, name: event.target.value }))} /></label>
          <label className="form-field">Default monthly salary<input type="number" min="0" step="0.01" value={d.salary} onChange={(event) => S((current) => ({ ...current, salary: Math.max(0, Number(event.target.value) || 0) }))} /></label>
          <span className="table-muted">Currency is fixed to INR (Indian Rupee).</span>
        </div>
      </section>

      <section className="page-card">
        <div className="page-card-heading"><div><span className="eyebrow">MONTHLY INTENTIONS</span><h2>What matters to you?</h2></div><SlidersHorizontal size={18} color="var(--purple)" /></div>
        {goals.map(([id, title]) => (
          <label className="check-row" key={id}>
            <span>{title}</span>
            <input type="checkbox" checked={d.goals.includes(id)} onChange={(event) => S((current) => ({ ...current, goals: event.target.checked ? [...current.goals, id] : current.goals.filter((value) => value !== id) }))} />
          </label>
        ))}
      </section>

      <section className="page-card">
        <div className="page-card-heading"><div><span className="eyebrow">PORTABLE BY DESIGN</span><h2>Backup & restore</h2></div><ShieldCheck size={19} color="var(--purple)" /></div>
        <p style={{ maxWidth: 680, color: 'var(--muted)', fontSize: 13 }}>Financial data syncs to your signed-in account and is isolated from other users. Download a JSON backup for an extra copy or to move data between accounts.</p>
        <div className="backup-actions">
          <button className="button button-purple" onClick={download}><Download size={15} />Download full backup</button>
          <button className="button button-secondary" onClick={() => backupInput.current?.click()}><Upload size={15} />Restore from JSON</button>
          {legacyDataAvailable && <button className="button button-secondary" onClick={importLegacyData}><Upload size={15} />Import older browser data</button>}
        </div>
        <input ref={backupInput} hidden type="file" accept=".json,application/json" onChange={restore} />
        <p className={`inline-status ${message.includes('not restored') || message.includes('Could not') ? 'error' : ''}`} role="status">{message}</p>
        <p className="table-muted">Compatible older backups may omit budgets, total budgets, goals, Food funding, opening overrides, or chat; these default to empty values. An omitted version defaults to version 1. Missing transaction accounts default to Others. Invalid backups leave current data unchanged.</p>
        <button className="icon-button danger reset-button" onClick={reset}><RotateCcw size={14} />Reset this account’s data</button>
      </section>
    </>
  );
}
