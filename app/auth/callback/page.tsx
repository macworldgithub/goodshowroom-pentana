'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { completeEmailCallback } from '@/lib/auth-flow';
import AuthShell from '../auth-shell';

// Keep one-time token exchanges single-use even when React replays effects.
let callback: Promise<void> | undefined;

export default function CallbackPage() {
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    callback ??= (async () => {
      const href = window.location.href;
      window.history.replaceState(null, '', '/auth/callback');
      await completeEmailCallback(createClient().auth, href);
    })();
    callback.then(() => { if (active) window.location.replace('/auth/set-password'); })
      .catch(() => { if (active) setError('This email link could not be verified. It may be expired or already used. Request a new recovery email and open it in this browser.'); });
    return () => { active = false; };
  }, []);
  return <AuthShell title={error ? 'Let’s get you a new link' : 'Verifying your email'}>
    {error ? <><p className="form-error" role="alert">{error}</p><Link className="button button-primary" href="/auth/recover">Request recovery email</Link></> : <p role="status">Verifying your email link…</p>}
  </AuthShell>;
}
