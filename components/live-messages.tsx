"use client";
import { useEffect, useState } from "react";
import { api, query } from "@/lib/backend";
import {
  customerName,
  unknownPrivacy,
  type Customer,
  type Message,
  type Page,
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
import { Badge, Button } from "./ui";
type Transport = {
  mode: string;
  simulated: boolean;
  deliveryConfirmation: string;
};
export function CustomerMessages({
  customer,
  integrationMode,
  privacyPending,
  onChanged,
}: {
  customer: Customer;
  integrationMode: string;
  privacyPending: boolean;
  onChanged: () => void;
}) {
  const { site, context, can } = useWorkspace();
  const [offset, setOffset] = useState(0);
  const [drafting, setDrafting] = useState(false);
  const [selected, setSelected] = useState<{
    message: Message;
    action: "edit" | "send" | "cancel" | "delivery" | "resolve" | "recover";
  }>();
  const [notice, setNotice] = useState("");
  const resource = useResource<{
    messages: Message[];
    pagination: Page;
    transport: Transport;
  }>(
    `customers/${customer.id}/messages?${query({ siteId: site.id, offset, limit: 10 })}`,
  );
  const privacy = customer.privacy ?? unknownPrivacy;
  const transport = resource.data?.transport;
  const simulationBlocked =
    transport?.mode === "smtp" &&
    (customer.integration_mode === "simulated" ||
      integrationMode === "simulated");
  const canSend =
    can("messages.send") &&
    !privacy.do_not_contact &&
    privacy.email === "granted" &&
    !!customer.email &&
    !privacyPending &&
    !!transport &&
    ["smtp", "simulated"].includes(transport.mode) &&
    !simulationBlocked;
  const hasSending = resource.data?.messages.some(
    (message) => message.status === "sending",
  );
  const refreshMessages = resource.reload;
  useEffect(() => {
    if (!hasSending) return;
    const timer = setInterval(refreshMessages, 5000);
    return () => clearInterval(timer);
  }, [hasSending, refreshMessages]);
  const changed = () => {
    resource.reload();
    onChanged();
  };
  const draftFields: Field[] = [
    { name: "subject", label: "Subject", required: true, maxLength: 200 },
    {
      name: "body",
      label: "Email body",
      type: "textarea",
      required: true,
      maxLength: 20000,
    },
  ];
  let fields: Field[] = [];
  if (selected?.action === "edit")
    fields = draftFields.map((field) => ({
      ...field,
      value:
        field.name === "subject"
          ? selected.message.subject
          : selected.message.body,
    }));
  if (selected?.action === "send")
    fields = [
      {
        name: "confirmed",
        label: `Send this email to ${customer.email}?`,
        type: "checkbox",
      },
    ];
  if (selected?.action === "delivery")
    fields = [
      {
        name: "status",
        label: "Verified outcome",
        type: "select",
        value: "delivered",
        options: [
          { value: "delivered", label: "Delivered" },
          { value: "bounced", label: "Bounced" },
        ],
      },
      {
        name: "evidence",
        label: "Provider evidence",
        type: "textarea",
        required: true,
        minLength: 5,
        maxLength: 2000,
      },
    ];
  if (selected?.action === "resolve")
    fields = [
      {
        name: "status",
        label: "Verified submission outcome",
        type: "select",
        options: [
          { value: "rejected", label: "Verified rejected / not accepted" },
          { value: "accepted", label: "Verified accepted by provider" },
        ],
      },
      {
        name: "providerId",
        label: "Provider message ID (required for accepted)",
      },
      {
        name: "evidence",
        label: "Evidence after checking the provider",
        type: "textarea",
        required: true,
        minLength: 5,
        maxLength: 2000,
      },
    ];
  if (selected?.action === "recover")
    fields = [
      {
        name: "note",
        label: "Why this interrupted send needs review",
        type: "textarea",
        required: true,
        minLength: 5,
        maxLength: 2000,
      },
    ];
  return (
    <>
      <div className="mb-4 flex flex-wrap justify-between gap-3">
        <div>
          <h2 className="font-bold">Customer email</h2>
          <p className="text-sm text-slate-500">
            Draft first, then send explicitly. Acceptance is separate from
            confirmed delivery.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={resource.reload}>
            Refresh emails
          </Button>
          {can("messages.write") && (
            <Button onClick={() => setDrafting(true)}>New email draft</Button>
          )}
        </div>
      </div>
      <Feedback message={notice} />
      {transport?.mode === "disabled" && (
        <p className="mb-4 text-sm text-amber-800">
          Email sending has not been configured.
        </p>
      )}
      {simulationBlocked && (
        <p className="mb-4 text-sm text-amber-800">
          This customer is simulated. Real email sending is blocked; you can
          still prepare drafts.
        </p>
      )}
      {(privacy.do_not_contact ||
        privacy.email !== "granted" ||
        !customer.email ||
        privacyPending) && (
        <p className="mb-4 text-sm text-amber-800">
          Sending requires a confirmed email address, granted email consent, no
          contact restriction and no unresolved privacy update.
        </p>
      )}
      <ResourceState resource={resource} />
      {resource.data && !resource.data.messages.length && (
        <p className="p-5 text-slate-500">No emails or drafts yet.</p>
      )}
      <div className="space-y-3">
        {resource.data?.messages.map((message) => {
          const owns =
            message.created_by === context.user.id || can("users.manage");
          return (
            <article className={panelClass} key={message.id}>
              <div className="flex flex-wrap justify-between gap-3">
                <h3 className="font-bold">{message.subject}</h3>
                <Badge
                  tone={
                    message.status === "needs_review" ||
                    message.status === "bounced" ||
                    message.status === "rejected"
                      ? "red"
                      : message.status === "delivered"
                        ? "green"
                        : "slate"
                  }
                >
                  {message.status.replaceAll("_", " ")}
                </Badge>
              </div>
              <p className="my-3 whitespace-pre-wrap break-words text-sm">
                {message.body}
              </p>
              <p className="text-xs text-slate-500">
                {timestamp(message.created_at, site.timezone)} ·{" "}
                {message.transport ?? "Draft"}
                {message.to ? ` · To: ${message.to}` : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {message.status === "draft" && owns && (
                  <>
                    {can("messages.write") && (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() =>
                            setSelected({ message, action: "edit" })
                          }
                        >
                          Edit draft
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() =>
                            setSelected({ message, action: "cancel" })
                          }
                        >
                          Discard draft
                        </Button>
                      </>
                    )}
                    <Button
                      disabled={!canSend}
                      onClick={() => setSelected({ message, action: "send" })}
                    >
                      Review and send
                    </Button>
                  </>
                )}
                {can("users.manage") && message.status === "accepted" && (
                  <Button
                    variant="secondary"
                    onClick={() => setSelected({ message, action: "delivery" })}
                  >
                    Record delivery evidence
                  </Button>
                )}
                {can("users.manage") && message.status === "needs_review" && (
                  <Button
                    variant="secondary"
                    onClick={() => setSelected({ message, action: "resolve" })}
                  >
                    Reconcile outcome
                  </Button>
                )}
                {can("users.manage") &&
                  message.status === "sending" &&
                  message.send_started_at && (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setSelected({ message, action: "recover" })
                      }
                    >
                      Recover interrupted send
                    </Button>
                  )}
              </div>
            </article>
          );
        })}
      </div>
      <Pager
        page={resource.data?.pagination}
        offset={offset}
        setOffset={setOffset}
      />
      {drafting && (
        <ActionDialog
          title={`Email ${customerName(customer)}`}
          fields={draftFields}
          submitLabel="Save draft"
          onClose={() => setDrafting(false)}
          onSubmit={async (values, key) => {
            await api(`customers/${customer.id}/messages`, {
              method: "POST",
              key,
              body: { ...values, siteId: site.id, channel: "email" },
            });
            changed();
            setNotice("Draft saved. Nothing has been sent.");
          }}
        />
      )}
      {selected && (
        <ActionDialog
          title={
            {
              edit: "Edit draft",
              send: "Review email before sending",
              cancel: "Discard email draft",
              delivery: "Record verified delivery",
              resolve: "Reconcile uncertain email",
              recover: "Recover interrupted send",
            }[selected.action]
          }
          fields={fields}
          submitLabel={
            selected.action === "send" ? "Send email now" : "Confirm"
          }
          onClose={() => setSelected(undefined)}
          onSubmit={async (values, key) => {
            const { message, action } = selected;
            if (action === "send" && !values.confirmed)
              throw new Error("Confirm the recipient before sending.");
            const body = {
              siteId: site.id,
              version: message.version,
              ...values,
              ...(action === "cancel" ? { cancel: true } : {}),
              ...(action === "delivery"
                ? { providerId: message.provider_id }
                : {}),
            };
            const response = await api<{ message: Message }>(
              `messages/${message.id}${["edit", "cancel"].includes(action) ? "" : "/" + action}`,
              {
                method: ["edit", "cancel"].includes(action) ? "PATCH" : "POST",
                body,
                ...(action === "send" ? { key } : {}),
              },
            );
            changed();
            setNotice(
              `Email status: ${response.message.status.replaceAll("_", " ")}${response.message.status === "accepted" ? " — accepted by the transport; delivery is not yet confirmed." : "."}`,
            );
          }}
        >
          {selected.action === "send" && (
            <div className="rounded-lg bg-slate-50 p-4 text-sm">
              <p className="font-bold">{selected.message.subject}</p>
              <p className="mt-2 whitespace-pre-wrap break-words">
                {selected.message.body}
              </p>
              <p className="mt-3 text-slate-500">
                {transport?.simulated
                  ? "This send uses the development email simulator."
                  : "This action submits a real email using the configured SMTP sender."}
              </p>
            </div>
          )}
          {selected.action === "cancel" && (
            <p>This discards the saved draft. Nothing will be sent.</p>
          )}
        </ActionDialog>
      )}
    </>
  );
}
