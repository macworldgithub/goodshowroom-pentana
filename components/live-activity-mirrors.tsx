"use client";
import { useState } from "react";
import { api, errorMessage, query } from "@/lib/backend";
import type { Page } from "@/lib/backend-types";
import { useWorkspace } from "./workspace-provider";
import {
  ActionDialog,
  Feedback,
  Pager,
  ResourceState,
  useResource,
} from "./live-common";
import { Button, Panel, PanelHeading } from "./ui";
type Mirror = {
  id: string;
  kind: string;
  status: string;
  attempts: number;
  error?: string;
};
export function ActivityMirrorQueue({ customerId }: { customerId: string }) {
  const { site, can } = useWorkspace();
  const [offset, setOffset] = useState(0),
    [selected, setSelected] = useState<Mirror | null>(null),
    [error, setError] = useState("");
  const resource = useResource<{ commands: Mirror[]; pagination: Page }>(
    `customers/${customerId}/activity-mirrors?${query({ siteId: site.id, offset, limit: 10 })}`,
    15000,
  );
  return (
    <Panel className="mt-5">
      <PanelHeading
        title="Simulated activity mirroring"
        description="Internal notes, call records and message outcomes are queued separately. This never sends a customer message or writes to Pentana."
      />
      <div className="space-y-3 p-5">
        <Button variant="secondary" onClick={resource.reload}>
          Refresh mirror status
        </Button>
        <ResourceState resource={resource} />
        <Feedback error={error} />
        {resource.data?.commands.map((c) => (
          <div key={c.id}>
            <p>
              {c.kind} | <strong>{c.status}</strong> | Attempts: {c.attempts}
            </p>
            <Feedback error={c.error} />
            {can("users.manage") &&
              ["queued", "retry_wait"].includes(c.status) && (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await api(`management/activity-mirrors/${c.id}/process`, {
                        method: "POST",
                        body: { siteId: site.id },
                      });
                      resource.reload();
                    } catch (cause) {
                      setError(errorMessage(cause));
                    }
                  }}
                >
                  Process simulation
                </Button>
              )}
            {can("users.manage") &&
              ["failed", "rejected", "needs_review"].includes(c.status) && (
                <Button variant="secondary" onClick={() => setSelected(c)}>
                  Review mirror
                </Button>
              )}
          </div>
        ))}
        {resource.data?.commands.length === 0 && (
          <p>No simulated activity mirrors for this customer.</p>
        )}
        <Pager
          page={resource.data?.pagination}
          offset={offset}
          setOffset={setOffset}
        />
      </div>
      {selected && (
        <ActionDialog
          title="Review activity mirror"
          description="Verify non-application before retrying the simulated source activity."
          fields={[
            {
              name: "note",
              label: "Review evidence",
              type: "textarea",
              minLength: 5,
            },
            {
              name: "confirmedNotApplied",
              label: "Verified not applied",
              type: "checkbox",
            },
          ]}
          onClose={() => setSelected(null)}
          onSubmit={async (values) => {
            await api(`management/activity-mirrors/${selected.id}/retry`, {
              method: "POST",
              body: { siteId: site.id, ...values },
            });
            resource.reload();
          }}
        />
      )}
    </Panel>
  );
}
