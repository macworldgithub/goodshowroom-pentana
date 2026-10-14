"use client";
import { useEffect, useState, type FormEvent } from "react";
import { api, errorMessage } from "@/lib/backend";
import type { Context, Invitation, Page } from "@/lib/backend-types";
import { Button, FormField, inputClass } from "./ui";
export function AccessWelcome({
  context,
  refresh,
  signOut,
}: {
  context: Context;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [offset, setOffset] = useState(0);
  const [page, setPage] = useState<Page>();
  useEffect(() => {
    let active = true;
    api<{ invitations: Invitation[]; pagination: Page }>(
      `auth/invitations?offset=${offset}&limit=20`,
    )
      .then((data) => {
        if (active) {
          setInvitations(data.invitations);
          setPage(data.pagination);
        }
      })
      .catch((cause) => {
        if (active) setError(errorMessage(cause));
      });
    return () => {
      active = false;
    };
  }, [offset]);
  async function setup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api("setup", { method: "POST", body: Object.fromEntries(form) });
      await refresh();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-black">Welcome to Good Showroom</h1>
      <p className="my-3 text-slate-600">
        Signed in as {context.user.email}.{" "}
        {context.needsInitialSetup
          ? "Set up your first organisation and site."
          : "An administrator must grant you site access, or you can accept a pending invitation below."}
      </p>
      {error && (
        <p role="alert" className="my-3 text-red-700">
          {error}
        </p>
      )}
      {context.needsInitialSetup && (
        <form
          onSubmit={setup}
          className="space-y-4 rounded-xl border bg-white p-5"
        >
          <FormField label="Organisation name">
            <input
              name="organisationName"
              required
              minLength={2}
              className={inputClass}
            />
          </FormField>
          <FormField label="First site name">
            <input
              name="siteName"
              required
              minLength={2}
              className={inputClass}
            />
          </FormField>
          <FormField label="Site timezone">
            <input
              name="timezone"
              defaultValue="Australia/Sydney"
              required
              className={inputClass}
            />
          </FormField>
          <FormField label="Setup key">
            <input
              name="setupKey"
              type="password"
              required
              className={inputClass}
              autoComplete="off"
            />
          </FormField>
          <Button type="submit" disabled={busy}>
            Create organisation and first site
          </Button>
        </form>
      )}
      {invitations.map((invite) => (
        <div key={invite.id} className="my-4 rounded-xl border bg-white p-5">
          <p>{invite.roles.join(", ")} invitation</p>
          <p className="text-sm text-slate-500">
            Expires {new Date(invite.expires_at).toLocaleString()}
          </p>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await api(`auth/invitations/${invite.id}/accept`, {
                  method: "POST",
                });
                await refresh();
              } catch (cause) {
                setError(errorMessage(cause));
              } finally {
                setBusy(false);
              }
            }}
          >
            Accept invitation
          </Button>
        </div>
      ))}
      <div className="my-4 flex gap-3">
        <Button
          variant="secondary"
          disabled={!offset}
          onClick={() => setOffset(Math.max(0, offset - 20))}
        >
          Previous invitations
        </Button>
        <Button
          variant="secondary"
          disabled={!page?.hasMore}
          onClick={() => setOffset(offset + 20)}
        >
          Next invitations
        </Button>
      </div>
      <Button variant="secondary" onClick={() => void refresh()}>
        Refresh access
      </Button>
      <button className="ml-4 underline" onClick={() => void signOut()}>
        Sign out
      </button>
    </main>
  );
}
