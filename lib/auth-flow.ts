import type { SupabaseClient } from '@supabase/supabase-js';

export async function completeEmailCallback(auth: SupabaseClient['auth'], href: string) {
  const url = new URL(href);
  const hash = new URLSearchParams(url.hash.slice(1));
  const failure = hash.get('error') || url.searchParams.get('error');
  if (failure) throw new Error('This email link is invalid, expired, or already used. Request a new recovery email below.');
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  if (hash.has('access_token') && hash.has('refresh_token')) {
    const { error } = await auth.setSession({ access_token: hash.get('access_token')!, refresh_token: hash.get('refresh_token')! });
    if (error) throw new Error('Unable to verify this link. Request a new recovery email.');
  } else if (code) {
    const { error } = await auth.exchangeCodeForSession(code);
    if (error) throw new Error('Unable to verify this link. Open the newest recovery email in the browser where you requested it.');
  } else if (tokenHash && (type === 'invite' || type === 'recovery')) {
    const { error } = await auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) throw new Error('Unable to verify this link. Request a new recovery email.');
  } else {
    throw new Error('This link has no sign-in details. Request a new recovery email.');
  }
  const { data, error } = await auth.getUser();
  if (error || !data.user) throw new Error('Your session could not be verified. Request a new recovery email.');
}

export async function acceptPendingInvitations(accessToken: string, apiUrl: string, send: typeof fetch = fetch) {
  const base = apiUrl.replace(/\/$/, '').replace(/\/api$/, '') + '/api';
  const headers = { Authorization: `Bearer ${accessToken}` };
  const response = await send(`${base}/auth/invitations`, { headers, cache: 'no-store' });
  if (!response.ok) throw new Error('Your password was saved, but invitations could not be loaded. Retry joining your showroom.');
  const data = await response.json() as { invitations: { id: string }[] };
  for (const invitation of data.invitations) {
    const accepted = await send(`${base}/auth/invitations/${encodeURIComponent(invitation.id)}/accept`, { method: 'POST', headers });
    if (!accepted.ok) throw new Error('Your password was saved, but an invitation could not be accepted. Retry or ask your administrator to check your access.');
  }
}
