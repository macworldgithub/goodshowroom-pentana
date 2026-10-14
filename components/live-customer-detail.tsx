"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, query } from "@/lib/backend";
import {
  customerName,
  unknownPrivacy,
  type Activity,
  type Change,
  type Customer,
  type Integration,
  type Page,
  type Task,
} from "@/lib/backend-types";
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
import { Badge, Button, PageHeader } from "./ui";
import { TaskCard, TaskEditor, useStaff } from "./live-tasks";
import { CustomerMessages } from "./live-messages";
type Profile = {
  customer: Customer;
  assignee: { id: string; fullName: string | null };
  tasks: Task[];
  pagination: Page;
  taskVisibility: string;
  permissions: { canCreateFollowUp: boolean };
  integration: Integration;
};
export function LiveCustomerDetail({ id }: { id: string }) {
  const { site, can } = useWorkspace();
  const [tab, setTab] = useState("activity");
  const [offset, setOffset] = useState(0);
  const [taskOffset, setTaskOffset] = useState(0);
  const [dialog, setDialog] = useState<
    "contact" | "privacy" | "assignment" | "note" | "call" | "task" | null
  >(null);
  const [notice, setNotice] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<Customer>();
  const profile = useResource<Profile>(
    `customers/${id}?${query({ siteId: site.id, offset: taskOffset, limit: 10 })}`,
  );
  const activity = useResource<{ activities: Activity[]; pagination: Page }>(
    tab === "activity"
      ? `customers/${id}/activity?${query({ siteId: site.id, offset, limit: 20 })}`
      : null,
  );
  const changes = useResource<{ changes: Change[]; pagination: Page }>(
    `customers/${id}/changes?${query({ siteId: site.id, offset: 0, limit: 20 })}`,
  );
  const history = useResource<{ changes: Change[]; pagination: Page }>(
    tab === "changes" && offset > 0
      ? `customers/${id}/changes?${query({ siteId: site.id, offset, limit: 20 })}`
      : null,
  );
  const changePage = offset > 0 && tab === "changes" ? history : changes;
  const staff = useStaff();
  const pending =
    changes.data?.changes.some((change) =>
      ["queued", "processing", "retry_wait", "needs_review"].includes(
        change.status,
      ),
    ) ?? false;
  const privacyPending =
    !changes.data ||
    changes.data.changes.some(
      (change) =>
        change.kind === "customer.privacy_update" &&
        ["queued", "processing", "retry_wait", "needs_review"].includes(
          change.status,
        ),
    );
  const reload = () => {
    profile.reload();
    activity.reload();
    changes.reload();
  };
  const refreshProfile = profile.reload;
  const refreshChanges = changes.reload;
  const refreshActivity = activity.reload;
  const latestChange = changes.data?.changes[0];
  const latestChangeKey = latestChange
    ? `${latestChange.id}:${latestChange.status}:${latestChange.updatedAt}`
    : "";
  useEffect(() => {
    if (!latestChangeKey) return;
    void Promise.resolve().then(() => {
      refreshProfile();
      refreshActivity();
    });
  }, [latestChangeKey, refreshProfile, refreshActivity]);
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(() => {
      refreshProfile();
      refreshChanges();
      refreshActivity();
    }, 5000);
    return () => clearInterval(timer);
  }, [pending, refreshProfile, refreshChanges, refreshActivity]);
  const customer = profile.data?.customer;
  if (!customer)
    return (
      <>
        <Link href="/customers" className="text-brand underline">
          Back to customers
        </Link>
        <ResourceState resource={profile} />
      </>
    );
  const privacy = customer.privacy ?? unknownPrivacy;
  const formCustomer = editingCustomer ?? customer;
  const formPrivacy = formCustomer.privacy ?? unknownPrivacy;
  const editableSource =
    can("customers.write") &&
    profile.data?.integration.writesEnabled &&
    !!customer.integration_external_id &&
    !!customer.source_revision &&
    !!changes.data &&
    !pending;
  let fields: Field[] = [];
  if (dialog === "contact")
    fields = [
      {
        name: "firstName",
        label: "First name",
        required: true,
        value: formCustomer.first_name,
        maxLength: 100,
      },
      {
        name: "lastName",
        label: "Last name",
        required: true,
        value: formCustomer.last_name,
        maxLength: 100,
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        value: formCustomer.email ?? "",
      },
      {
        name: "phone",
        label: "Phone",
        type: "tel",
        value: formCustomer.phone ?? "",
        maxLength: 40,
      },
    ];
  if (dialog === "privacy")
    fields = [
      {
        name: "do_not_contact",
        label: "Do not contact",
        type: "checkbox",
        value: formPrivacy.do_not_contact,
      },
      ...(["email", "sms", "call"] as const).map((channel) => ({
        name: channel,
        label: `${channel.toUpperCase()} consent`,
        type: "select" as const,
        value: formPrivacy[channel],
        options: ["unknown", "granted", "denied"].map((value) => ({
          value,
          label: value,
        })),
      })),
    ];
  if (dialog === "assignment")
    fields = [
      {
        name: "assignedTo",
        label: "Assign customer to",
        type: "select",
        required: true,
        value: customer.assigned_to,
        options: [
          {
            value: customer.assigned_to,
            label: profile.data?.assignee.fullName ?? "Current assignee",
          },
          ...(staff.data?.staff
            .filter(
              (item) =>
                item.permissions.includes("customers.read") &&
                item.userId !== customer.assigned_to,
            )
            .map((item) => ({
              value: item.userId,
              label: item.fullName ?? `Staff ${item.userId.slice(0, 8)}`,
            })) ?? []),
        ],
      },
    ];
  if (dialog === "note")
    fields = [
      {
        name: "text",
        label: "Internal note",
        type: "textarea",
        required: true,
        maxLength: 5000,
      },
    ];
  if (dialog === "call")
    fields = [
      {
        name: "summary",
        label: "Call summary",
        type: "textarea",
        required: true,
      },
      {
        name: "direction",
        label: "Direction",
        type: "select",
        options: ["outgoing", "incoming"].map((value) => ({
          value,
          label: value,
        })),
      },
      {
        name: "outcome",
        label: "Outcome",
        type: "select",
        options: [
          "connected",
          "no_answer",
          "voicemail",
          "busy",
          "wrong_number",
        ].map((value) => ({ value, label: value.replaceAll("_", " ") })),
      },
      {
        name: "occurredAt",
        label: "Call time (optional, device’s timezone)",
        type: "datetime-local",
      },
      ...(can("tasks.write")
        ? [
            {
              name: "followUpTitle",
              label: "Promised callback title (optional)",
            },
            {
              name: "followUpDueAt",
              label: "Promised callback due (device’s timezone)",
              type: "datetime-local" as const,
            },
          ]
        : []),
    ];
  return (
    <>
      <Link
        href="/customers"
        className="mb-4 inline-block text-sm text-brand underline"
      >
        Back to customers
      </Link>
      <PageHeader
        title={customerName(customer)}
        eyebrow={site.name}
        description={`Shared customer profile · ${customer.source}`}
        actions={
          <Button variant="secondary" onClick={reload}>
            Refresh
          </Button>
        }
      />
      <Feedback message={notice} error={profile.error} />
      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <section className={panelClass}>
          <h2 className="font-bold">Contact and assignment</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="break-all">{customer.email ?? "Not supplied"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Phone</dt>
              <dd>{customer.phone ?? "Not supplied"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Assigned to</dt>
              <dd>
                {profile.data?.assignee.fullName ??
                  `Staff ${customer.assigned_to.slice(0, 8)}`}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Source reference</dt>
              <dd>{customer.integration_external_id ?? "Local record"}</dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            {can("customers.write") && (
              <Button
                variant="secondary"
                disabled={!editableSource}
                onClick={() => {
                  setEditingCustomer(customer);
                  setDialog("contact");
                }}
              >
                Edit contact
              </Button>
            )}
            {can("customers.assign") && (
              <Button
                variant="secondary"
                onClick={() => setDialog("assignment")}
              >
                Reassign customer
              </Button>
            )}
          </div>
        </section>
        <section className={panelClass}>
          <h2 className="font-bold">Privacy and consent</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone={privacy.do_not_contact ? "red" : "slate"}>
              {privacy.do_not_contact
                ? "Do not contact"
                : "No general restriction"}
            </Badge>
            {(["email", "sms", "call"] as const).map((channel) => (
              <Badge
                key={channel}
                tone={privacy[channel] === "granted" ? "green" : "amber"}
              >
                {channel}: {privacy[channel]}
              </Badge>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Contact restrictions apply to sending. Source-owned changes become
            effective after confirmation.
          </p>
          {can("customers.write") && (
            <Button
              className="mt-4"
              variant="secondary"
              disabled={!editableSource}
              onClick={() => {
                setEditingCustomer(customer);
                setDialog("privacy");
              }}
            >
              Update privacy and consent
            </Button>
          )}
          {pending && (
            <p className="mt-3 text-sm text-amber-800">
              A customer change is unresolved. Check Changes before submitting
              another.
            </p>
          )}
        </section>
      </div>
      <div className="mb-5 flex flex-wrap gap-3">
        {can("customers.write") && (
          <>
            <Button onClick={() => setDialog("note")}>Add internal note</Button>
            <Button variant="secondary" onClick={() => setDialog("call")}>
              Log call
            </Button>
          </>
        )}
        {profile.data?.permissions.canCreateFollowUp && (
          <Button variant="secondary" onClick={() => setDialog("task")}>
            Create follow-up
          </Button>
        )}
      </div>
      <div className="mb-4 flex flex-wrap gap-2" role="tablist">
        {[
          "activity",
          "tasks",
          "changes",
          ...(can("messages.read") ? ["email"] : []),
        ].map((item) => (
          <Button
            role="tab"
            aria-selected={tab === item}
            key={item}
            variant={tab === item ? "primary" : "secondary"}
            onClick={() => {
              setTab(item);
              setOffset(0);
            }}
          >
            {item === "activity"
              ? "Shared thread"
              : item === "tasks"
                ? "Follow-ups"
                : item === "changes"
                  ? "Changes"
                  : "Email"}
          </Button>
        ))}
      </div>
      <section className={panelClass}>
        {tab === "activity" && (
          <>
            <ResourceState resource={activity} />
            {activity.data && !activity.data.activities.length && (
              <p className="text-slate-500">No activity yet.</p>
            )}
            <ol className="space-y-5">
              {activity.data?.activities.map((event) => (
                <li key={event.id} className="border-l-2 border-slate-200 pl-4">
                  <h3 className="font-semibold">{event.summary}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {timestamp(event.occurredAt, site.timezone)} ·{" "}
                    {event.author.fullName ??
                      `Staff ${event.author.id.slice(0, 8)}`}
                  </p>
                  {event.recordedAt !== event.occurredAt && (
                    <p className="text-xs text-slate-400">
                      Recorded {timestamp(event.recordedAt, site.timezone)}
                    </p>
                  )}
                  {event.journal && (
                    <>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm">
                        {event.journal.text}
                      </p>
                      {event.journal.outcome && (
                        <p className="mt-1 text-xs text-slate-500">
                          {event.journal.direction} ·{" "}
                          {event.journal.outcome.replaceAll("_", " ")}
                        </p>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ol>
            <Pager
              page={activity.data?.pagination}
              offset={offset}
              setOffset={setOffset}
            />
          </>
        )}
        {tab === "tasks" && (
          <>
            <p className="mb-4 text-sm text-slate-500">
              {profile.data?.taskVisibility === "team"
                ? "Team follow-ups"
                : "Your follow-ups"}{" "}
              · {site.timezone}
            </p>
            <div className="space-y-3">
              {profile.data?.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  customerLink={false}
                  onSaved={reload}
                />
              ))}
            </div>
            {!profile.data?.tasks.length && (
              <p className="text-slate-500">No visible follow-ups.</p>
            )}
            <Pager
              page={profile.data?.pagination}
              offset={taskOffset}
              setOffset={setTaskOffset}
            />
          </>
        )}
        {tab === "changes" && (
          <>
            <ResourceState resource={changePage} />
            <div className="space-y-4">
              {changePage.data?.changes.map((change) => (
                <div
                  key={change.id}
                  className="flex flex-wrap justify-between gap-3 border-b pb-3"
                >
                  <div>
                    <p className="font-semibold">
                      {change.kind === "customer.privacy_update"
                        ? "Privacy update"
                        : "Contact update"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {timestamp(change.updatedAt, site.timezone)}
                    </p>
                  </div>
                  <Badge
                    tone={
                      change.state === "confirmed"
                        ? "green"
                        : change.state === "pending"
                          ? "amber"
                          : "red"
                    }
                  >
                    {change.state.replaceAll("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
            {changePage.data && !changePage.data.changes.length && (
              <p className="text-slate-500">No customer change requests yet.</p>
            )}
            <Pager
              page={changePage.data?.pagination}
              offset={offset}
              setOffset={setOffset}
            />
          </>
        )}
        {tab === "email" && (
          <CustomerMessages
            customer={customer}
            integrationMode={profile.data!.integration.mode}
            privacyPending={privacyPending}
            onChanged={reload}
          />
        )}
      </section>
      {dialog === "task" && (
        <TaskEditor
          customerId={id}
          onClose={() => setDialog(null)}
          onSaved={reload}
        />
      )}
      {dialog && dialog !== "task" && (
        <ActionDialog
          title={
            {
              contact: "Edit customer contact",
              privacy: "Update privacy and consent",
              assignment: "Reassign customer",
              note: "Add internal note",
              call: "Record customer call",
            }[dialog]
          }
          description={
            ["contact", "privacy"].includes(dialog)
              ? "Confirmed customer data stays unchanged until the source accepts this update."
              : dialog === "call"
                ? "Record an actual or attempted call. This does not dial the customer."
                : undefined
          }
          fields={fields}
          onClose={() => setDialog(null)}
          onSubmit={async (values, key) => {
            let body: Record<string, unknown> = { ...values, siteId: site.id };
            let path = `customers/${id}`;
            let method: "POST" | "PATCH" = "PATCH";
            if (dialog === "privacy") {
              path += "/privacy";
              body = {
                siteId: site.id,
                privacy: values,
                expectedRevision: editingCustomer!.source_revision,
              };
            }
            if (dialog === "contact") {
              const baseline = editingCustomer!;
              const mapping = {
                firstName: baseline.first_name,
                lastName: baseline.last_name,
                email: baseline.email ?? "",
                phone: baseline.phone ?? "",
              };
              const patch = Object.fromEntries(
                Object.entries(mapping)
                  .filter(([key, value]) => values[key] !== value)
                  .map(([key]) => [key, values[key]]),
              );
              if (!Object.keys(patch).length)
                throw new Error("Change a contact field before submitting.");
              body = {
                ...patch,
                siteId: site.id,
                expectedRevision: baseline.source_revision,
              };
            }
            if (dialog === "assignment") path += "/assignment";
            if (dialog === "note") {
              path += "/notes";
              method = "POST";
            }
            if (dialog === "call") {
              path += "/calls";
              method = "POST";
              body = {
                siteId: site.id,
                summary: values.summary,
                direction: values.direction,
                outcome: values.outcome,
                ...(values.occurredAt
                  ? {
                      occurredAt: new Date(
                        String(values.occurredAt),
                      ).toISOString(),
                    }
                  : {}),
                ...(values.followUpTitle || values.followUpDueAt
                  ? {
                      followUp: {
                        title: values.followUpTitle,
                        dueAt: new Date(
                          String(values.followUpDueAt),
                        ).toISOString(),
                      },
                    }
                  : {}),
              };
            }
            await api(path, {
              method,
              body,
              ...(dialog === "assignment" ? {} : { key }),
            });
            setNotice(
              ["contact", "privacy"].includes(dialog)
                ? "Update submitted. Track confirmation in Changes."
                : "Saved to the shared customer record.",
            );
            reload();
          }}
        >
          {dialog === "assignment" && (
            <>
              <Feedback error={staff.error} />
              <Pager
                page={staff.data?.pagination}
                offset={staff.offset}
                setOffset={staff.setOffset}
              />
            </>
          )}
        </ActionDialog>
      )}
    </>
  );
}
