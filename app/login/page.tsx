'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { roles, type UserRole } from '@/lib/roles';
import { Icon } from '@/components/ui';

const roleCopy: Record<UserRole, string> = {
  Sales: 'Leads, follow-ups, pipeline, stock matching and delivery checklists',
  Service: 'Imported appointments and repair orders, customer updates and booking requests',
  Admin: 'Users, site access, CSV imports, permissions and audit history',
};

export default function LoginPage() {
  const router = useRouter(); const [role, setRole] = useState<UserRole>('Sales');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [pending, setPending] = useState(false); const [showPassword, setShowPassword] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(''); window.localStorage.setItem('goodshowroom-role', role);
    try { const { error: authError } = await createClient().auth.signInWithPassword({ email, password }); if (authError) throw authError; router.push(role === 'Service' ? '/service' : '/dashboard'); router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to sign in. Check your details and try again.'); setPending(false); }
  }

  return <main className="grid min-h-screen place-items-center border-t-2 border-[#0b111c] bg-[radial-gradient(circle_at_50%_35%,#fff_0%,#f8f6f7_42%,#f5f7fa_100%)] p-4 sm:p-8">
    <div className="w-full max-w-lg">
      <header className="mb-6 text-center"><span className="inline-flex rounded-full border border-red-300 bg-red-50 px-6 py-1 text-[11px] font-black uppercase tracking-[.16em] text-red-600">Good Showroom · CRM-first workspace</span><div className="mt-4 flex items-center justify-center gap-2"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[#0b111c] text-sm font-black text-white">GS</span><strong className="text-xl font-black uppercase leading-5 tracking-tight text-[#0b111c]">Good Showroom</strong></div><h1 className="mt-3 text-2xl font-black tracking-tight text-[#0d1930]">Customer Relationship Portal</h1><p className="mt-1 text-sm text-slate-600">Manage CRM-owned customer activity alongside imported Pentana snapshots</p></header>
      <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,.10)] sm:p-8"><div className="mb-6 rounded-xl border-2 border-[#0b111c] py-2 text-center text-xs font-black uppercase tracking-wide text-[#0b111c]">Secure staff sign in</div><form onSubmit={signIn} className="space-y-5">
        <fieldset><legend className="text-xs font-black uppercase tracking-wider text-slate-600">Select your authorised role</legend><div className="mt-2 grid gap-2 sm:grid-cols-3">{roles.map((item) => <button key={item} type="button" onClick={() => setRole(item)} className={`min-h-[86px] rounded-xl border-2 p-3 text-left transition ${role === item ? 'border-red-500 bg-red-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}><span className="flex items-center gap-2 text-sm font-black text-[#162039]"><span className={`h-2 w-2 rounded-full ${role === item ? 'bg-red-500' : 'bg-slate-300'}`}/>{item}</span><span className="mt-1.5 block text-[11px] leading-4 text-slate-500">{roleCopy[item]}</span></button>)}</div></fieldset>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-600">Work email address<span className="relative mt-2 block"><input className="h-11 w-full rounded-xl border border-slate-300 px-3 pr-10 text-sm font-medium text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder={`${role.toLowerCase()}@dealership.com`}/><Icon name="mail" className="absolute right-3 top-3 h-4 w-4 text-slate-400"/></span></label>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-600">Password<span className="relative mt-2 block"><input className="h-11 w-full rounded-xl border border-slate-300 px-3 pr-10 text-sm text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password"/><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1.5 rounded-md p-2 text-slate-400 hover:bg-slate-50" aria-label={showPassword ? 'Hide password' : 'Show password'}><Icon name="search" className="h-4 w-4"/></button></span></label>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700" role="alert">{error}</p>}
        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ed1c24] px-4 text-sm font-black text-white shadow-[0_6px_14px_rgba(237,28,36,.2)] transition hover:bg-[#c9141b] disabled:cursor-wait disabled:opacity-60" type="submit" disabled={pending}>{pending ? 'Signing in…' : `Sign in to ${role}`}<Icon name="chevron" className="h-4 w-4"/></button>
      </form><div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5 text-[11px] font-semibold text-slate-500"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500"/>Pentana data shown as imported snapshots</span><span>CRM-first release · Multi-site</span></div></section>
    </div>
  </main>;
}
