'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError('');
    try {
      const { error: authError } = await createClient().auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      window.location.assign('/dashboard');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in. Check your details and try again.');
      setPending(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-brand">
        <div className="brand-lockup"><span className="brand-mark">G</span><span>good showroom</span></div>
        <div className="login-story"><p className="eyebrow">THE DEALERSHIP WORKSPACE</p><h1>Good days start with a clear view.</h1><p>Customer conversations, follow-ups, and the work ahead, together in one place.</p></div>
        <div className="login-footer">A calmer way to run the showroom.</div>
      </section>
      <section className="login-form-side"><div className="login-form-wrap">
        <p className="eyebrow">WELCOME BACK</p><h2>Sign in to Good Showroom</h2><p className="form-intro">Use the staff account invited by your administrator.</p>
        <form onSubmit={signIn} className="form-stack">
          <label>Email address<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@dealership.com" /></label>
          <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary button-wide" type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}<span aria-hidden="true">→</span></button>
        </form>
        <p className="login-help">Need access? Ask your dealership administrator to invite you.</p>
      </div></section>
    </main>
  );
}
