This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Invitation and password setup

Set the public Supabase URL/key and backend origin in `.env.local` using
`.env.example`. Start this app on port 3000 and the backend on port 4000.
Configure backend `AUTH_INVITE_REDIRECT_URL=http://localhost:3000/auth/callback`.
In Supabase Auth URL Configuration, allow `http://localhost:3000/auth/callback`
as a redirect URL. Use deployed HTTPS URLs when deploying.

Send invitations through the backend's `/api/admin/invitations/:id/send` route.
The email link opens `/auth/callback`, which supports Supabase session fragments,
PKCE codes, and invite/recovery token hashes. It removes the link credentials from
the address bar and verifies the session before opening `/auth/set-password`.
The user chooses a password of 12–128 characters; passwords are managed by Supabase.
After saving, the app lists invitations using the invited user's token and accepts
their pending invitations before opening the dashboard. A backend failure leaves
a retry button and does not undo the saved password.

Expired or used links offer `/auth/recover`, also linked from login. Recovery
emails return to the same callback. For PKCE recovery, open the latest email in
the same browser where you requested it. Email delivery must be configured in
Supabase. An expired email link does not expire the application's 7-day invitation.

Run auth flow checks with `node --experimental-strip-types --test test/auth-flow.test.mjs`.

Development and builds use Next.js's supported Webpack option because the installed
Turbopack version fails while launching its CSS worker on this Windows setup.

## Getting Started


First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
