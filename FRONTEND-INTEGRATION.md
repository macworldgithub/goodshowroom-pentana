# Frontend and backend integration through Step 3

The active workspace now uses real backend data. My Day, Customer 360, dealership
settings, invitations and Sync operations no longer show demo records or simulated
local saves. Existing styling is retained. Sales/Service desks and reporting are
clearly deferred until their later implementation steps.

## Local configuration

The frontend `.env.local` contains public Supabase settings and the server-side
backend address:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-key
BACKEND_API_URL=http://localhost:4000/api
```

The backend and frontend must use the same Supabase project. Never copy the backend
service-role key, MongoDB URI, setup key or SMTP password into public frontend vars.
The `/api/backend/...` route forwards the current user's bearer token and stable
write keys to the configured backend, without forwarding browser cookies or server
secrets. Its upstream URL is server-configured; clients cannot choose a destination.
Missing/expired sessions, authorization errors and backend outages are surfaced.

Start the backend on port 4000 and frontend with `npm run dev` on port 3000.
Production frontend: `npm run build`, then `npm start`. The build uses Next.js's
supported Webpack compiler because Turbopack's CSS worker failed on this machine.

The local backend was restored after Atlas DNS failures using
`pnpm run start:local:dns` (run `pnpm run build` first). This optional development
command resolves Atlas through public DNS for that Node process, without modifying
Windows network settings, credentials, hostname/SNI or TLS certificate validation.
It refuses NODE_ENV=production. Normal start commands remain available when the
system resolver works. The backend's development simulator worker is now enabled
to confirm queued simulation commands automatically.

## Connected workflows

- Sign-in, session refresh, sign-out and current `/auth/me` context. Workspace roles
  come only from memberships, and the site selector contains accessible sites.
  Selecting a role cannot grant new permissions. Site changes discard the prior
  site's local view state. Focus/refresh rechecks access; backend checks every action.
- First administrator account creation with a manually supplied setup key, followed
  by initial organisation/site setup. Existing accounts sign in instead of recreating
  identities. Accounts without site access can accept their pending invitations.
- Staff creation, site/brand scopes, membership permissions, suspension/restoration,
  invitation creation/revocation and explicit invitation email submission, audit
  history, site creation/editing/brand mappings, and brand creation/renaming.
- Sync mode/status, paginated command states and attempts, simulator read-sync/
  behavior/process, expired-lease recovery, checked retries and verified reconciliation.
  Normalized imports appear only in scraping mode. Browser scraping remains external
  and is not implemented by this frontend integration.
- Customer search/pagination, queued creation and confirmation, detail, source/site/
  assignment, queued contact/privacy editing and confirmed-change history.
- Shared thread with internal notes, call records, promised callbacks and readable
  authors/timezones. Customer and task lifecycle events persist across page reloads.
- Follow-up creation, editing, rescheduling, cancellation and completion. Versions
  protect against stale edits. Assignment selects active same-site staff when the
  user has assignment permission; unauthorized users cannot enumerate this directory.
- Personal/team My Day with site-local date, overdue/today/call filtering, pagination,
  full counts and contact restrictions. Completed/cancelled tasks leave open queues.
- Email drafts, edits/discard, explicit reviewed sends, consent checks, outcomes and
  admin evidence/recovery/reconciliation controls. Sending records are refreshed;
  SMTP acceptance is never presented as delivery. Drafting sends nothing.

Password recovery and password-setting screens use Supabase Auth. The callback
checks exchange errors and only accepts the permitted post-auth destination.
Configure Supabase redirect URLs for the app's auth callback, including the recovery
destination, and configure Supabase Auth email delivery separately from backend SMTP.
Creating a new password is a user action; no credentials were changed during testing.

## Messaging and external limits

Gmail SMTP is configured only on the backend. INTEGRATION_MODE remains simulated,
so real SMTP sends are blocked for simulation data. Email drafts remain usable.
For a disposable email simulation test, use MESSAGE_TRANSPORT=simulated with explicit
development opt-in; do not send live email to fabricated records. Real customer
email requires confirmed consent, no contact restriction and verified real data.
SMS needs a separate provider. Automated delivery/bounce tracking requires a provider
integration; the current generic SMTP workflow records verified ADMIN evidence.
Live invitation/recovery/customer email delivery remains a separate acceptance test.
Actual Pentana/eraPower read/write scraping remains the final stage.

## Verification

Frontend tests cover token forwarding, request keys, one-time session refresh,
same-origin writes, path safety, missing configuration, transport errors, consent
errors and aborted requests. Backend tests cover access/transactions/source writes,
task versions, consent, SMTP behavior and the sanitized paginated assignee directory.

A real Sales browser session verified a labelled `Frontend Verification` simulator
customer: creation confirmation, a shared note, simulated call log/promised callback,
contact and privacy confirmation, email draft persistence/disabled send, My Day
inclusion, task rescheduling/edit persistence after reload, cancellation removal,
completion and shared lifecycle history. Direct access to Settings was denied.
The test customer/history/draft remain labelled in the development database; no
customer email or actual call was sent/placed. Administrator account changes and
live email delivery were not exercised against real identities during this walkthrough.
