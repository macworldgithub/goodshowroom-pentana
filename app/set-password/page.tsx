"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { errorMessage } from "@/lib/backend";
import { Button, FormField, inputClass } from "@/components/ui";
import { Feedback } from "@/components/live-common";
import { AuthFrame } from "@/components/auth-frame";
export default function Page() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => createClient().auth.getUser())
      .then(({ data, error }) => {
        if (active) {
          setReady(!!data.user && !error);
          if (!data.user || error)
            setError(
              "Open a valid recovery or invitation link before setting your password.",
            );
        }
      })
      .catch((cause) => {
        if (active) setError(errorMessage(cause));
      });
    return () => {
      active = false;
    };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    if (password !== form.get("confirmation"))
      return setError("Passwords do not match.");
    setBusy(true);
    setError("");
    try {
      const { error } = await createClient().auth.updateUser({ password });
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
    <AuthFrame title="Set a new password" description="Choose a strong password to keep your workspace account protected." eyebrow="Account security">
        <form onSubmit={submit} className="space-y-5" aria-busy={busy}>
          <FormField label="New password">
            <input
              name="password"
              type="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              placeholder="At least 12 characters"
              className={inputClass}
            />
          </FormField>
          <FormField label="Confirm new password">
            <input
              name="confirmation"
              type="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              className={inputClass}
            />
          </FormField>
          <Feedback error={error} />
          <Button type="submit" className="w-full" disabled={!ready || busy}>
            {busy ? "Saving password…" : "Save password"}
          </Button>
        </form>
        <p className="mt-6 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500">Use 12–128 characters. A mix of words, numbers and symbols makes your password harder to guess.</p>
    </AuthFrame>
  );
}
