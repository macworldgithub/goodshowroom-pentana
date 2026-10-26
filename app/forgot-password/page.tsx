"use client";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";
import { errorMessage } from "@/lib/backend";
import { Button, FormField, inputClass } from "@/components/ui";
import { Feedback } from "@/components/live-common";
import { AuthFrame } from "@/components/auth-frame";
export default function Page() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const { error } = await authClient.resetPasswordForEmail(
        String(form.get("email")).trim(),
      );
      if (error) throw error;
      setNotice(
        "If this address has an account, check its inbox for a recovery link.",
      );
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthFrame title="Forgot your password?" description="Enter your work email and we'll send you a link to reset your password." icon="mail" eyebrow="Password recovery">
        <form onSubmit={submit} className="space-y-5" aria-busy={busy}>
          <FormField label="Work email">
            <input name="email" type="email" autoComplete="email" placeholder="you@dealership.com" required className={inputClass} />
          </FormField>
          <Feedback error={error} message={notice} />
          <Button type="submit" className="w-full" disabled={busy || !!notice}>
            {busy ? "Sending recovery link…" : notice ? "Recovery link requested" : "Send recovery link"}
          </Button>
        </form>
        <p className="mt-6 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500">Check your spam folder if the email doesn't arrive. For further help, contact your dealership administrator.</p>
    </AuthFrame>
  );
}
