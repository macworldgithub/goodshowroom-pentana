"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { authClient } from "@/lib/auth/client";
import { roles, type UserRole } from "@/lib/roles";
import { Icon, inputClass } from "@/components/ui";
import { AuthFrame } from "@/components/auth-frame";

const roleCopy: Record<UserRole, string> = {
  Sales: "Customers, shared notes, calls, email and personal follow-ups",
  Service:
    "Customers, shared activity, scheduled calls and personal follow-ups",
  Admin: "Staff access, sites, brands, team queues and source command management",
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
    try {
      const { error: authError } = await authClient.signInWithPassword(
        { email, password },
      );
      if (authError) throw authError;
      router.push('/dashboard');
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
    <AuthFrame login title="Welcome back" description="Sign in with your work account to continue to your dealership workspace." eyebrow="Staff sign in">
          <form onSubmit={signIn} className="space-y-5">
            <fieldset>
              <legend className="text-sm font-semibold text-slate-700">
                Choose your workspace
              </legend>
              <div className="mt-2 grid gap-2 min-[440px]:grid-cols-3">
                {roles.map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={role === item}
                    onClick={() => setRole(item)}
                    className={`min-h-11 rounded-xl border p-3 text-left transition ${role === item ? "border-brand bg-brand-soft" : "border-slate-200 bg-white hover:border-slate-300"}`}
                  >
                    <span className="flex items-center gap-2 text-sm font-black text-[#162039]">
                      <span
                        className={`h-2 w-2 rounded-full ${role === item ? "bg-brand" : "bg-slate-300"}`}
                      />
                      {item}
                    </span>
                    <span className="sr-only">
                      {roleCopy[item]}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block text-sm font-semibold text-slate-700">
              Work email address
              <span className="relative mt-2 block">
                <input
                  className={`${inputClass} pr-10`}
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
            <label className="block text-sm font-semibold text-slate-700">
              Password
              <span className="relative mt-2 block">
                <input
                  className={`${inputClass} pr-10`}
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
                  <Icon name="eye" className="h-4 w-4" />
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
          <div className="mt-4 flex flex-wrap justify-between gap-3 text-sm"><Link className="font-semibold text-brand hover:underline" href="/forgot-password">Forgot password?</Link><Link className="text-slate-500 hover:text-slate-900 hover:underline" href="/initial-setup">First-time administrator setup</Link></div>
          <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-5 text-[11px] font-semibold text-slate-500 min-[440px]:flex-row min-[440px]:items-center min-[440px]:justify-between">
            <span className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              Access is verified after sign in
            </span>
            <span>One customer · One thread</span>
          </div>
    </AuthFrame>
  );
}
