import Link from 'next/link';
import type { ReactNode } from 'react';

export default function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return <main className="login-shell">
    <section className="login-brand">
      <div className="brand-lockup"><span className="brand-mark">G</span><span>good showroom</span></div>
      <div className="login-story"><p className="eyebrow">YOUR DEALERSHIP WORKSPACE</p><h1>Welcome to a clearer day.</h1><p>Join your team and keep customer conversations and daily work together.</p></div>
    </section>
    <section className="login-form-side"><div className="login-form-wrap">
      <h2>{title}</h2>{children}
      <p className="login-help"><Link href="/login">Back to sign in</Link></p>
    </div></section>
  </main>;
}
