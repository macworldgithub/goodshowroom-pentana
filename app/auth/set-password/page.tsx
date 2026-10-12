'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { acceptPendingInvitations } from '@/lib/auth-flow';
import AuthShell from '../auth-shell';

export default function PasswordPage() {
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await createClient().auth.getUser();
        if (active && !error && data.user) { setReady(true); setEmail(data.user.email ?? ''); }
      } finally { if (active) setChecked(true); }
    })().catch(() => { if (active) setError('Unable to check your session. Request a fresh recovery link.'); });
    return () => { active = false; };
  }, []);
  async function finish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (!saved && (password.length < 12 || password.length > 128 || password !== confirm)) {
      setError('Use 12–128 characters and make sure both passwords match.'); return;
    }
    setPending(true);
    try {
      const supabase = createClient();
      if (!saved) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw new Error(error.message);
        setSaved(true); setPassword(''); setConfirm('');
      }
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) throw new Error('Your session expired. Sign in with your new password to continue.');
      await acceptPendingInvitations(data.session.access_token, process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
      window.location.replace('/dashboard');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to finish setup. Please retry.'); setPending(false); }
  }
  return <AuthShell title={saved ? 'Join your showroom' : 'Choose your password'}>
    {!checked ? <p role="status">Checking your session…</p> : !ready ? <><p className="form-error" role="alert">{error || 'A valid email link is required to set your password.'}</p><Link className="button button-primary" href="/auth/recover">Request recovery email</Link></> : <>
      <p className="form-intro">{email}. Saving your password will accept your pending showroom invitations and open your workspace.</p>
      <form className="form-stack" onSubmit={finish}>
        {!saved && <><label>New password<input type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} /></label>
        <label>Confirm password<input type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} /></label></>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary button-wide" disabled={pending}>{pending ? 'Finishing setup…' : saved ? 'Retry joining showroom' : 'Save password and join showroom'}</button>
      </form>
    </>}
  </AuthShell>;
}
