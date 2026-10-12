'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import AuthShell from '../auth-shell';

export default function RecoveryPage() {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  async function recover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError('');
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/callback` });
      if (error) throw error;
      setSent(true);
    } catch { setError('Unable to send a recovery email. Please try again later or contact your administrator.'); }
    finally { setPending(false); }
  }
  return <AuthShell title="Set or reset your password">
    <p className="form-intro">Use the email address your administrator invited. Open the newest email link in this browser.</p>
    {sent ? <p role="status">If this address has an account, a recovery email has been requested. Check your inbox and spam folder.</p> : <form className="form-stack" onSubmit={recover}>
      <label>Email address<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary button-wide" disabled={pending}>{pending ? 'Sending…' : 'Send recovery email'}</button>
    </form>}
  </AuthShell>;
}
