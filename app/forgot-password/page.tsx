"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { errorMessage } from "@/lib/backend";
import { Button, FormField, inputClass } from "@/components/ui";
import { Feedback, panelClass } from "@/components/live-common";
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
      const { error } = await createClient().auth.resetPasswordForEmail(
        String(form.get("email")).trim(),
        { redirectTo: `${location.origin}/auth/callback?next=/set-password` },
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
    <main className="mx-auto max-w-lg p-6 pt-16">
      <section className={panelClass}>
        <h1 className="mb-4 text-2xl font-black">Reset your password</h1>
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Work email">
            <input name="email" type="email" required className={inputClass} />
          </FormField>
          <Feedback error={error} message={notice} />
          <Button type="submit" disabled={busy || !!notice}>
            Request recovery link
          </Button>
        </form>
        <Link
          className="mt-5 inline-block text-sm text-brand underline"
          href="/login"
        >
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
