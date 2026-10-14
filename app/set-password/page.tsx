"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { errorMessage } from "@/lib/backend";
import { Button, FormField, inputClass } from "@/components/ui";
import { Feedback, panelClass } from "@/components/live-common";
export default function Page() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    createClient()
      .auth.getUser()
      .then(({ data, error }) => {
        if (active) {
          setReady(!!data.user && !error);
          if (!data.user || error)
            setError(
              "Open a valid recovery or invitation link before setting your password.",
            );
        }
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
    <main className="mx-auto max-w-lg p-6 pt-16">
      <section className={panelClass}>
        <h1 className="mb-4 text-2xl font-black">Set your password</h1>
        <form onSubmit={submit} className="space-y-4">
          <FormField label="New password">
            <input
              name="password"
              type="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              className={inputClass}
            />
          </FormField>
          <FormField label="Confirm new password">
            <input
              name="confirmation"
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              className={inputClass}
            />
          </FormField>
          <Feedback error={error} />
          <Button type="submit" disabled={!ready || busy}>
            Save password
          </Button>
        </form>
      </section>
    </main>
  );
}
