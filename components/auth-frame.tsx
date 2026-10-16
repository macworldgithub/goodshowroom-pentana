import type { ReactNode } from "react";
import { BackButton } from "./back-button";
import { Icon } from "./ui";

export function AuthFrame({
  title,
  description,
  eyebrow = "Account access",
  icon = "lock",
  login = false,
  children,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  icon?: string;
  login?: boolean;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f3f5f8] p-4 sm:p-8 lg:p-12">
      <div className="w-full min-w-0 max-w-[1080px]">
        <div className={`mb-5 items-center gap-4 ${login ? "hidden justify-end sm:flex" : "flex justify-between"}`}>
          {!login && <BackButton href="/login" label="Back to sign in" />}
          <span className="hidden text-[11px] font-semibold tracking-wide text-slate-500 sm:inline">GOOD SHOWROOM / WORKSPACE</span>
        </div>
        <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_70px_-25px_rgba(15,23,42,.2)] lg:grid-cols-[.85fr_1fr]">
          <aside className="relative flex flex-col justify-between overflow-hidden bg-[#101b2d] p-7 text-white sm:p-10 lg:p-11">
            <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full border border-white/5" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-20 -left-12 h-72 w-72 rounded-full border border-white/5" aria-hidden="true" />
            <div className="relative flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-sm font-bold tracking-tight shadow-lg">GS</span>
              <div><p className="text-base font-bold tracking-tight">Good Showroom</p><p className="mt-0.5 text-xs text-slate-400">Sales &amp; service workspace</p></div>
            </div>
            <div className="relative hidden py-16 lg:block">
              <span className="mb-6 block h-1 w-9 rounded-full bg-brand" />
              <h2 className="max-w-xs text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">A clearer view of<br />your dealership.</h2>
              <p className="mt-4 max-w-xs text-sm leading-7 text-slate-400">Your customers, your team and the day ahead. Connected in one workspace.</p>
              <div className="mt-8 hidden space-y-4 lg:block">
                {[["customers", "Customer relationships"], ["pipeline", "Sales coordination"], ["service", "Service operations"]].map(([name, text]) => (
                  <div key={name} className="flex items-center gap-3 text-sm text-slate-300"><span className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5"><Icon name={name} className="h-4 w-4" /></span>{text}</div>
                ))}
              </div>
            </div>
            <p className="relative hidden border-t border-white/10 pt-5 text-xs text-slate-400 lg:block">Good Showroom · Pentana operating layer</p>
          </aside>
          <section className="flex min-w-0 flex-col justify-center p-6 sm:p-10 lg:p-12" aria-labelledby="auth-title">
            <span className="mb-5 grid h-11 w-11 place-items-center rounded-xl border border-brand/10 bg-brand-soft text-brand"><Icon name={icon} /></span>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">{eyebrow}</p>
            <h1 id="auth-title" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
            <p className="mb-7 mt-3 text-sm leading-6 text-slate-500">{description}</p>
            {children}
          </section>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">Good Showroom · Built around your working day</p>
      </div>
    </main>
  );
}
