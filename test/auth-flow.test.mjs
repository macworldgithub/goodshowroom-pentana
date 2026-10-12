import { test } from 'node:test';
import assert from 'node:assert/strict';
import { completeEmailCallback, acceptPendingInvitations } from '../lib/auth-flow.ts';

function authStub() {
  const calls = [];
  return { calls, auth: {
    setSession: async value => { calls.push(['session', value]); return { error: null }; },
    exchangeCodeForSession: async value => { calls.push(['code', value]); return { error: null }; },
    verifyOtp: async value => { calls.push(['otp', value]); return { error: null }; },
    getUser: async () => ({ data: { user: { id: 'invited-user' } }, error: null }),
  } };
}

test('email fragments establish a verified session', async () => {
  const { auth, calls } = authStub();
  await completeEmailCallback(auth, 'http://localhost/auth/callback#access_token=test-access&refresh_token=test-refresh&type=invite');
  assert.deepEqual(calls, [['session', { access_token: 'test-access', refresh_token: 'test-refresh' }]]);
});
test('PKCE and token-hash links use their intended verification methods', async () => {
  const { auth, calls } = authStub();
  await completeEmailCallback(auth, 'http://localhost/auth/callback?code=test-code');
  await completeEmailCallback(auth, 'http://localhost/auth/callback?token_hash=test-hash&type=recovery');
  assert.deepEqual(calls, [['code', 'test-code'], ['otp', { token_hash: 'test-hash', type: 'recovery' }]]);
});
test('expired or empty links cannot reuse an existing session', async () => {
  const { auth, calls } = authStub();
  await assert.rejects(completeEmailCallback(auth, 'http://localhost/auth/callback#error=access_denied&error_code=otp_expired'), /expired/);
  await assert.rejects(completeEmailCallback(auth, 'http://localhost/auth/callback'), /no sign-in details/);
  assert.deepEqual(calls, []);
});
test('failed session verification stops onboarding', async () => {
  const { auth } = authStub();
  auth.getUser = async () => ({ data: { user: null }, error: new Error('invalid') });
  await assert.rejects(completeEmailCallback(auth, 'http://localhost/auth/callback?code=test'), /session could not be verified/);
});
test('acceptance uses the invited user token and supports API URLs with a prefix', async () => {
  const calls = [];
  await acceptPendingInvitations('test-user-token', 'http://localhost:4000/api/', async (url, init) => {
    calls.push([url, init]);
    return new Response(JSON.stringify(init.method === 'POST' ? {} : { invitations: [{ id: 'invite-1' }] }), { status: 200 });
  });
  assert.equal(calls[0][0], 'http://localhost:4000/api/auth/invitations');
  assert.equal(calls[1][0], 'http://localhost:4000/api/auth/invitations/invite-1/accept');
  assert.equal(calls[1][1].method, 'POST');
  assert.equal(calls[1][1].headers.Authorization, 'Bearer test-user-token');
});
test('backend failures leave a retryable error instead of reporting success', async () => {
  await assert.rejects(acceptPendingInvitations('test', 'http://localhost:4000', async () => new Response('{}', { status: 401 })), /could not be loaded/);
  await assert.rejects(acceptPendingInvitations('test', 'http://localhost:4000', async (_url, init) => new Response(JSON.stringify({ invitations: [{ id: 'test' }] }), { status: init.method === 'POST' ? 503 : 200 })), /could not be accepted/);
});
