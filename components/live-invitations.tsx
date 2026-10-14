"use client";
import { useState } from "react";
import { api, errorMessage } from "@/lib/backend";
import type { Invitation, Page } from "@/lib/backend-types";
import { useWorkspace } from "./workspace-provider";
import {
  Feedback,
  Pager,
  panelClass,
  ResourceState,
  timestamp,
  useResource,
} from "./live-common";
import { Button, PageHeader } from "./ui";
export function LiveInvitations() {
  const { refresh, site } = useWorkspace();
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const resource = useResource<{ invitations: Invitation[]; pagination: Page }>(
    `auth/invitations?offset=${offset}&limit=20`,
  );
  return (
    <>
      <PageHeader
        title="Your invitations"
        description="Accept pending site access linked to your verified email."
      />
      <ResourceState resource={resource} />
      <Feedback error={error} />
      {resource.data && !resource.data.invitations.length && (
        <p className={panelClass}>No pending invitations.</p>
      )}
      <div className="space-y-3">
        {resource.data?.invitations.map((invite) => (
          <article className={panelClass} key={invite.id}>
            <h2 className="font-bold">{invite.roles.join(", ")} invitation</h2>
            <p className="my-3 text-sm text-slate-500">
              Expires {timestamp(invite.expires_at, site.timezone)}
            </p>
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await api(`auth/invitations/${invite.id}/accept`, {
                    method: "POST",
                  });
                  await refresh();
                  resource.reload();
                } catch (cause) {
                  setError(errorMessage(cause));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Accept invitation
            </Button>
          </article>
        ))}
      </div>
      <Pager
        page={resource.data?.pagination}
        offset={offset}
        setOffset={setOffset}
      />
    </>
  );
}
