"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { roles, type UserRole } from "@/lib/roles";
import { Icon } from "@/components/ui";

const roleCopy: Record<UserRole, string> = {
  Sales: "Leads, follow-ups, pipeline, stock matching and delivery checklists",
  Service:
    "Diary, check-in, repair orders, customer updates and handovers",
  Admin: "Users, site and brand access, sync failures, permissions and audit",
};

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("Sales");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    window.localStorage.setItem("goodshowroom-role", role);
    try {
      const { error: authError } = await createClient().auth.signInWithPassword(
        { email, password },
      );
      if (authError) throw authError;
      router.push(role === "Service" ? "/service" : "/dashboard");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to sign in. Check your details and try again.",
      );
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-[100dvh] place-items-center border-t-2 border-brand bg-[radial-gradient(circle_at_50%_35%,#fff_0%,#f8f6f7_42%,#f5f7fa_100%)] p-3 min-[400px]:p-4 sm:p-8">
      <div className="w-full max-w-lg">
        <header className="mb-5 text-center sm:mb-6">
          <span className="inline-flex max-w-full rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-[10px] font-black uppercase tracking-[.12em] text-brand min-[400px]:px-6 min-[400px]:text-[11px] min-[400px]:tracking-[.16em]">
            Good Showroom · Pentana operating layer
          </span>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#0b111c] text-sm font-black text-white">
              GS
            </span>
            <strong className="text-lg font-black uppercase leading-5 tracking-tight text-[#0b111c] min-[400px]:text-xl">
              Good Showroom
            </strong>
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-[#0d1930]">
            Sales &amp; Service Operating Workspace
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Run the customer day in one place while Pentana remains the system of record
          </p>
        </header>
        <section className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_16px_45px_rgba(15,23,42,.10)] min-[400px]:p-6 sm:rounded-[22px] sm:p-8">
          <div className="mb-6 rounded-xl border-2 border-[#0b111c] px-2 py-2 text-center text-xs font-black uppercase tracking-wide text-[#0b111c]">
            Secure staff sign in
          </div>
          <form onSubmit={signIn} className="space-y-5">
            <fieldset>
              <legend className="text-xs font-black uppercase tracking-wider text-slate-600">
                Select your authorised role
              </legend>
              <div className="mt-2 grid gap-2 min-[440px]:grid-cols-3">
                {roles.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRole(item)}
                    className={`min-h-[72px] rounded-xl border-2 p-3 text-left transition min-[440px]:min-h-[86px] ${role === item ? "border-brand bg-brand-soft" : "border-slate-200 bg-white hover:border-slate-300"}`}
                  >
                    <span className="flex items-center gap-2 text-sm font-black text-[#162039]">
                      <span
                        className={`h-2 w-2 rounded-full ${role === item ? "bg-brand" : "bg-slate-300"}`}
                      />
                      {item}
                    </span>
                    <span className="mt-1.5 block text-[11px] leading-4 text-slate-500">
                      {roleCopy[item]}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
              Work email address
              <span className="relative mt-2 block">
                <input
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 pr-10 text-sm font-medium text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={`${role.toLowerCase()}@dealership.com`}
                />
                <Icon
                  name="mail"
                  className="absolute right-3 top-3 h-4 w-4 text-slate-400"
                />
              </span>
            </label>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
              Password
              <span className="relative mt-2 block">
                <input
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 pr-10 text-sm text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1.5 rounded-md p-2 text-slate-400 hover:bg-slate-50"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <Icon name="search" className="h-4 w-4" />
                </button>
              </span>
            </label>
            {error && (
              <p
                className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                role="alert"
              >
                {error}
              </p>
            )}
            <button
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-black text-white shadow-[0_6px_14px_rgba(201,24,30,.24)] transition hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"
              type="submit"
              disabled={pending}
            >
              {pending ? "Signing in…" : `Sign in to ${role}`}
              <Icon name="chevron" className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-5 text-[11px] font-semibold text-slate-500 min-[440px]:flex-row min-[440px]:items-center min-[440px]:justify-between">
            <span className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              Pentana connected · writes are audited
            </span>
            <span>One customer · One thread</span>
          </div>
        </section>
      </div>
    </main>
  );
}
