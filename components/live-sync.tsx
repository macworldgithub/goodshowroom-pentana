"use client";
import { useState } from "react";
import { api, errorMessage, query } from "@/lib/backend";
import type { Command, Integration, Page } from "@/lib/backend-types";
import { useWorkspace } from "./workspace-provider";
import {
  ActionDialog,
  Feedback,
  Pager,
  panelClass,
  ResourceState,
  timestamp,
  useResource,
  type Field,
} from "./live-common";
import { Badge, Button, inputClass, PageHeader } from "./ui";
type Selected = {
  command: Command;
  action: "process" | "retry" | "resolve" | "attempts";
};
export function LiveSync() {
  const { site, can } = useWorkspace();
  const [status, setStatus] = useState("");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<Selected>();
  const [action, setAction] = useState<
    "sync" | "behavior" | "recover" | "import" | null
  >(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const integration = useResource<Integration>("integration/status");
  const commands = useResource<{ commands: Command[]; pagination: Page }>(
    can("users.manage")
      ? `admin/integration/commands?${query({ organisationId: site.organisation_id, status: status || undefined, offset, limit: 20 })}`
      : null,
  );
  const [attemptOffset, setAttemptOffset] = useState(0);
  const attempts = useResource<{
    attempts: {
      id: string;
      attempt: number;
      created_at: string;
      outcome_status?: string;
      response?: { outcome?: string };
    }[];
    pagination: Page;
  }>(
    selected?.action === "attempts"
      ? `admin/integration/commands/${selected.command.id}/attempts?offset=${attemptOffset}&limit=10`
      : null,
  );
  let fields: Field[] = [];
  if (selected?.action === "retry")
    fields = [
      {
        name: "note",
        label: "Reason after checking the source",
        type: "textarea",
        required: true,
        minLength: 5,
        maxLength: 1000,
      },
      ...(selected.command.status === "needs_review"
        ? [
            {
              name: "confirmedNotApplied",
              label: "I verified that no source write was applied",
              type: "checkbox" as const,
            },
          ]
        : []),
    ];
  if (selected?.action === "resolve")
    fields = [
      {
        name: "outcome",
        label: "Verified source outcome",
        type: "select",
        options: [
          { value: "rejected", label: "Rejected" },
          {
            value: "succeeded",
            label: "Succeeded with verified source record",
          },
        ],
      },
      {
        name: "note",
        label: "Reconciliation evidence",
        type: "textarea",
        required: true,
        minLength: 5,
        maxLength: 1000,
      },
      {
        name: "customer",
        label: "Verified normalized customer JSON (required for succeeded)",
        type: "textarea",
        maxLength: 20000,
        hint: "Use only verified source observations, including privacy for contact/consent updates.",
      },
    ];
  const mode = integration.data?.mode;
  if (!can("users.manage")) return <p>Administrator access is required.</p>;
  return (
    <>
      <PageHeader
        title="Sync operations"
        eyebrow={site.name}
        description="Inspect confirmed writes, failures and source reconciliation. Real scraping will be connected in the final step."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              integration.reload();
              commands.reload();
            }}
          >
            Refresh
          </Button>
        }
      />
      <ResourceState resource={integration} />
      <Feedback error={error} message={notice} />
      {integration.data && (
        <div className={`${panelClass} mb-5`}>
          <h2 className="font-bold">
            {mode === "simulated"
              ? "Development simulator"
              : mode === "scraping"
                ? "External scraping runner"
                : "Source writes disabled"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {mode === "simulated"
              ? "Simulator records and commands are labelled separately from real source data."
              : mode === "scraping"
                ? "The backend receives observations and outcomes from your authorized runner."
                : "Existing records remain readable; source changes cannot be submitted."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {mode === "simulated" && (
              <>
                <Button variant="secondary" onClick={() => setAction("sync")}>
                  Load simulator customers
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setAction("behavior")}
                >
                  Set simulator outcome
                </Button>
              </>
            )}
            <Button variant="secondary" onClick={() => setAction("recover")}>
              Recover expired commands
            </Button>
            {mode === "scraping" && (
              <Button variant="secondary" onClick={() => setAction("import")}>
                Import verified source observations
              </Button>
            )}
          </div>
        </div>
      )}
      <label className="mb-5 block max-w-sm text-sm font-bold">
        Command status
        <select
          className={inputClass}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setOffset(0);
          }}
        >
          <option value="">All states</option>
          {[
            "queued",
            "processing",
            "retry_wait",
            "succeeded",
            "rejected",
            "failed",
            "needs_review",
          ].map((item) => (
            <option key={item} value={item}>
              {item.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <ResourceState resource={commands} />
      <div className="space-y-3">
        {commands.data?.commands.map((command) => (
          <article key={command.id} className={panelClass}>
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="font-bold">
                  {command.payload.first_name} {command.payload.last_name} ·{" "}
                  {command.kind.replace("customer.", "").replaceAll("_", " ")}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {command.mode} · Attempt {command.attempts} ·{" "}
                  {timestamp(command.created_at, site.timezone)}
                </p>
              </div>
              <Badge
                tone={
                  command.status === "succeeded"
                    ? "green"
                    : ["failed", "rejected", "needs_review"].includes(
                          command.status,
                        )
                      ? "red"
                      : "amber"
                }
              >
                {command.status.replaceAll("_", " ")}
              </Badge>
            </div>
            {command.error && (
              <p className="mt-3 break-words text-sm text-red-700">
                {command.error.message}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setAttemptOffset(0);
                  setSelected({ command, action: "attempts" });
                }}
              >
                View attempts
              </Button>
              {mode === "simulated" &&
                command.mode === mode &&
                ["queued", "retry_wait"].includes(command.status) && (
                  <Button
                    onClick={() => setSelected({ command, action: "process" })}
                  >
                    Process in simulator
                  </Button>
                )}
              {command.mode === mode &&
                ["failed", "needs_review"].includes(command.status) && (
                  <Button
                    variant="secondary"
                    onClick={() => setSelected({ command, action: "retry" })}
                  >
                    Authorize retry
                  </Button>
                )}
              {command.mode === mode && command.status === "needs_review" && (
                <Button
                  variant="secondary"
                  onClick={() => setSelected({ command, action: "resolve" })}
                >
                  Reconcile source outcome
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
      {commands.data && !commands.data.commands.length && (
        <p className="p-6 text-slate-500">No commands match this filter.</p>
      )}
      <Pager
        page={commands.data?.pagination}
        offset={offset}
        setOffset={setOffset}
      />
      {selected && selected.action !== "attempts" && (
        <ActionDialog
          title={
            {
              process: "Process development command",
              retry: "Authorize a checked retry",
              resolve: "Reconcile source outcome",
            }[selected.action]
          }
          fields={fields}
          onClose={() => setSelected(undefined)}
          onSubmit={async (values) => {
            if (
              selected.action === "retry" &&
              selected.command.status === "needs_review" &&
              !values.confirmedNotApplied
            )
              throw new Error(
                "Verify non-application before authorizing another write.",
              );
            let body: Record<string, unknown> = { ...values };
            if (selected.action === "resolve")
              body = {
                outcome: values.outcome,
                note: values.note,
                ...(values.outcome === "succeeded"
                  ? { customer: JSON.parse(String(values.customer)) }
                  : {
                      code: "OPERATOR_VERIFIED_REJECTION",
                      message: values.note,
                    }),
              };
            await api(
              `admin/integration/commands/${selected.command.id}/${selected.action}`,
              { method: "POST", body },
            );
            commands.reload();
            setNotice("Command state updated.");
          }}
        >
          {selected.action === "process" && (
            <p>
              This executes the pending command in the development simulator. It
              does not contact Pentana.
            </p>
          )}
        </ActionDialog>
      )}
      {selected?.action === "attempts" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Command attempts"
            className="max-h-[85vh] w-full max-w-xl overflow-auto rounded-xl bg-white p-6"
          >
            <h2 className="text-xl font-bold">Command attempts</h2>
            <ResourceState resource={attempts} />
            {attempts.data?.attempts.map((attempt) => (
              <p key={attempt.id} className="border-b py-4 text-sm">
                Attempt {attempt.attempt} ·{" "}
                {attempt.outcome_status ??
                  attempt.response?.outcome ??
                  "Processing"}{" "}
                · {timestamp(attempt.created_at, site.timezone)}
              </p>
            ))}
            <Pager
              page={attempts.data?.pagination}
              offset={attemptOffset}
              setOffset={setAttemptOffset}
            />
            <Button className="mt-4" onClick={() => setSelected(undefined)}>
              Close
            </Button>
          </section>
        </div>
      )}
      {action && (
        <ActionDialog
          title={
            {
              sync: "Load development customers",
              behavior: "Set next simulator outcome",
              recover: "Recover expired command leases",
              import: "Import verified source observations",
            }[action]
          }
          fields={
            action === "behavior"
              ? [
                  {
                    name: "behavior",
                    label: "Outcome",
                    type: "select",
                    options: ["accept", "reject", "outage", "unknown"].map(
                      (value) => ({ value, label: value }),
                    ),
                  },
                  {
                    name: "count",
                    label: "Next command count",
                    type: "number",
                    required: true,
                    value: 1,
                  },
                ]
              : action === "import"
                ? [
                    {
                      name: "customers",
                      label: "Normalized customer observations JSON array",
                      type: "textarea",
                      required: true,
                      maxLength: 100000,
                    },
                  ]
                : []
          }
          onClose={() => setAction(null)}
          onSubmit={async (values) => {
            setError("");
            try {
              const path = {
                sync: "simulator/sync",
                behavior: "simulator/behavior",
                recover: "recover",
                import: "customers/import",
              }[action];
              await api(`admin/integration/${path}`, {
                method: "POST",
                body:
                  action === "recover"
                    ? { organisationId: site.organisation_id }
                    : {
                        siteId: site.id,
                        ...(action === "behavior"
                          ? {
                              behavior: values.behavior,
                              count: Number(values.count),
                            }
                          : action === "import"
                            ? {
                                customers: JSON.parse(String(values.customers)),
                              }
                            : {}),
                      },
              });
              commands.reload();
              setNotice(
                "Source operation completed. Refresh Customer 360 to see confirmed records.",
              );
            } catch (cause) {
              setError(errorMessage(cause));
              throw cause;
            }
          }}
        >
          {action === "sync" && (
            <p>
              Load or refresh labelled simulation customers for {site.name}.
            </p>
          )}
          {action === "recover" && (
            <p>
              Recover expired commands for this organisation. Uncertain real
              writes will require reconciliation before retry.
            </p>
          )}
        </ActionDialog>
      )}
    </>
  );
}
