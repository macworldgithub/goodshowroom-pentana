"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthFrame } from "@/components/auth-frame";
import { Feedback } from "@/components/live-common";
import { Button, FormField, Icon, inputClass } from "@/components/ui";
import { api, errorMessage } from "@/lib/backend";
import { createClient } from "@/lib/supabase/client";
export default function Page() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || created) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const values = {
        fullName: String(form.get("fullName") ?? "").trim(),
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
        setupKey: String(form.get("setupKey") ?? ""),
      };
      await api("auth/initial-user", { method: "POST", public: true, body: values });
      setCreated(true);
      const { error } = await createClient().auth.signInWithPassword({ email: values.email, password: values.password });
      if (error) throw error;
      router.replace("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthFrame title="Set up your workspace" description="Create the first administrator account to get your dealership started." eyebrow="First-time setup" icon="settings">
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs leading-5 text-slate-600">
        <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <p>For new installations only. You’ll need the setup key supplied by your system administrator.</p>
      </div>
      <form onSubmit={submit} className="space-y-4" aria-busy={busy}>
        <fieldset disabled={busy || created} className="space-y-4 disabled:opacity-70">
          <FormField label="Full name"><input name="fullName" autoComplete="name" placeholder="Enter your full name" required maxLength={200} className={inputClass} /></FormField>
          <FormField label="Work email"><input name="email" type="email" autoComplete="email" placeholder="you@dealership.com" required className={inputClass} /></FormField>
          <FormField label="Password"><input name="password" type="password" autoComplete="new-password" placeholder="At least 12 characters" minLength={12} maxLength={128} required className={inputClass} /></FormField>
          <FormField label="Setup key"><input name="setupKey" type="password" autoComplete="off" placeholder="Enter your administrator setup key" required className={inputClass} /></FormField>
        </fieldset>
        <Feedback error={error} message={created ? "Your account has been created. If sign in failed, return to sign in and use your new account details." : undefined} />
        <Button type="submit" className="w-full" disabled={busy || created}>
          {busy ? "Creating your account…" : created ? "Account created" : "Create administrator account"}
          {!busy && !created && <Icon name="chevron" className="h-4 w-4" />}
        </Button>
      </form>
    </AuthFrame>
  );
}
