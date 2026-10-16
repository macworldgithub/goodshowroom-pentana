"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, query } from "@/lib/backend";
import type { Page } from "@/lib/backend-types";
import {
  ActionDialog,
  localDate,
  Pager,
  ResourceState,
  timestamp,
  useResource,
  useDirectory,
  Feedback,
  type Field,
} from "./live-common";
import {
  Badge,
  Button,
  EmptyState,
  inputClass,
  Modal,
  PageHeader,
  Panel,
  PanelHeading,
} from "./ui";
import { useWorkspace } from "./workspace-provider";
type Check = {
  complete: boolean;
  note: string | null;
  updated_at: string | null;
  author: string | null;
};
export type Delivery = {
  id: string;
  lead_id: string;
  deal_id: string;
  customer_id: string;
  stock_label: string;
  scheduled_at: string;
  notes: string;
  status: string;
  version: number;
  checklist: Record<string, Check>;
  readiness: {
    ready: boolean;
    blockers: string[];
    completedItems: number;
    totalItems: number;
    overdue: boolean;
  };
  reservation: { expiresAt: string } | null;
};
const labels: Record<string, string> = {
  documents: "Documents checked",
  payment_verified: "Payment verified",
  vehicle_preparation: "Vehicle preparation",
  customer_confirmation: "Customer confirmation",
  handover_pack: "Handover pack",
};
type Action = {
  kind: "plan" | "check" | "cancel";
  plan?: Delivery;
  item?: string;
  complete?: boolean;
};
export function LiveDeliveryDialog({
  deliveryId,
  leadId,
  deal,
  onClose,
  onSaved,
}: {
  deliveryId?: string;
  leadId?: string;
  deal?: { id: string; status: string; stock_label: string };
  onClose: () => void;
  onSaved: () => void;
}) {
  const { site, can } = useWorkspace();
  const [action, setAction] = useState<Action | null>(null);
  const [defaultSchedule] = useState(() =>
    localDate(new Date(Date.now() + 86400000).toISOString()),
  );
  const resource = useResource<{
    delivery?: Delivery;
    deliveries?: Delivery[];
  }>(
    deliveryId
      ? `sales/deliveries/${deliveryId}?siteId=${site.id}`
      : `sales/deliveries?${query({ siteId: site.id, dealId: deal?.id, limit: 1 })}`,
  );
  const refresh = resource.reload;
  useEffect(() => {
    const timer = setInterval(refresh, 15000);
    return () => clearInterval(timer);
  }, [refresh]);
  const plan = resource.data?.delivery ?? resource.data?.deliveries?.[0];
  const current = action?.plan;
  const permission = (item: string) =>
    item === "payment_verified"
      ? "deliveries.confirm_payment"
      : item === "vehicle_preparation"
        ? "deliveries.prepare"
        : "deliveries.write";
  return (
    <>
      {!action && (
        <Modal
          open
          title="Delivery readiness"
          description={
            plan?.stock_label ??
            deal?.stock_label ??
            "Vehicle preparation and checks"
          }
          onClose={onClose}
        >
          <div className="p-5">
            <ResourceState resource={resource} />
            {!plan && resource.data && (
              <EmptyState
                icon="delivery"
                title="Delivery not planned"
                description="Create a delivery plan after this proposal is approved."
                action={
                  can("deliveries.write") && deal?.status === "approved" ? (
                    <Button onClick={() => setAction({ kind: "plan" })}>
                      Plan delivery
                    </Button>
                  ) : undefined
                }
              />
            )}
            {plan && (
              <>
                <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Badge tone={plan.readiness.ready ? "green" : "amber"}>
                      {plan.status === "cancelled"
                        ? "Cancelled"
                        : plan.readiness.ready
                          ? "Ready"
                          : "Needs attention"}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-500">
                      {plan.readiness.completedItems}/
                      {plan.readiness.totalItems} checks
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-800">
                    Planned: {timestamp(plan.scheduled_at, site.timezone)}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                    {plan.notes}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">
                    This records readiness. It does not charge a payment, sell
                    stock or complete the final handover.
                  </p>
                  {plan.readiness.overdue && (
                    <p className="mt-2 text-xs font-semibold text-amber-700">
                      The planned delivery time has passed. Review the schedule.
                    </p>
                  )}
                </div>
                {!!plan.readiness.blockers.length && (
                  <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <h3 className="text-sm font-bold text-amber-900">
                      Before delivery can be ready
                    </h3>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-amber-800">
                      {plan.readiness.blockers.map((blocker) => (
                        <li key={blocker}>{blocker}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {plan.reservation && (
                  <p className="mb-4 text-sm font-semibold text-emerald-700">
                    Reserved until{" "}
                    {timestamp(plan.reservation.expiresAt, site.timezone)}
                  </p>
                )}
                <div className="space-y-3">
                  {Object.entries(labels).map(([key, label]) => {
                    const check = plan.checklist[key];
                    return (
                      <article
                        key={key}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-sm font-bold text-slate-900">
                            {label}
                          </h3>
                          <Badge tone={check.complete ? "green" : "slate"}>
                            {check.complete ? "Confirmed" : "Pending"}
                          </Badge>
                        </div>
                        {check.note && (
                          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">
                            {check.note}
                          </p>
                        )}
                        {check.updated_at && (
                          <p className="mt-3 text-xs text-slate-400">
                            {check.author ?? "Staff member"} ·{" "}
                            {timestamp(check.updated_at, site.timezone)}
                          </p>
                        )}
                        {key === "payment_verified" &&
                          !can("deliveries.confirm_payment") && (
                            <p className="mt-2 text-xs text-slate-400">
                              Admin confirms payment; evidence notes are
                              restricted.
                            </p>
                          )}
                        {can(permission(key)) && plan.status === "planned" && (
                          <div className="mt-3">
                            <Button
                              variant="secondary"
                              onClick={() =>
                                setAction({
                                  kind: "check",
                                  plan,
                                  item: key,
                                  complete: !check.complete,
                                })
                              }
                            >
                              {check.complete
                                ? "Reopen check"
                                : "Confirm check"}
                            </Button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
                <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <Button variant="secondary" onClick={resource.reload}>
                    Refresh
                  </Button>
                  {can("deliveries.write") && (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => setAction({ kind: "plan", plan })}
                      >
                        {plan.status === "cancelled"
                          ? "Reopen / reschedule"
                          : "Reschedule"}
                      </Button>
                      {plan.status === "planned" && (
                        <Button
                          variant="secondary"
                          onClick={() => setAction({ kind: "cancel", plan })}
                        >
                          Cancel plan
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
      {action && (
        <ActionDialog
          title={
            action.kind === "check"
              ? labels[action.item!]
              : action.kind === "cancel"
                ? "Cancel delivery plan"
                : current
                  ? "Reschedule delivery"
                  : "Plan delivery"
          }
          description={
            action.kind === "check"
              ? action.item === "payment_verified"
                ? "Record verification of an existing payment and a supporting reference. This does not process payment."
                : "Record the completed preparation or confirmation, with a supporting note."
              : action.kind === "cancel"
                ? "Cancelling the plan leaves the deal and reservation unchanged. Cancel the deal separately when required."
                : "An active reservation must cover the planned time before this delivery can be ready. Reopening a cancelled plan resets its checks."
          }
          fields={
            action.kind === "plan"
              ? [
                  {
                    name: "scheduledAt",
                    label: "Planned delivery (your device’s timezone)",
                    type: "datetime-local",
                    value: current
                      ? localDate(current.scheduled_at)
                      : defaultSchedule,
                    required: true,
                  },
                  {
                    name: "notes",
                    label: "Delivery planning notes",
                    type: "textarea",
                    value: current?.notes ?? "",
                    required: true,
                    minLength: 3,
                    maxLength: 2000,
                  },
                ]
              : action.kind === "check"
                ? [
                    {
                      name: "complete",
                      label: "This check is complete",
                      type: "checkbox",
                      value: action.complete,
                    },
                    {
                      name: "note",
                      label:
                        action.item === "payment_verified"
                          ? "Payment verification reference / note"
                          : "Supporting note",
                      type: "textarea",
                      required: true,
                      minLength: 3,
                      maxLength: 2000,
                    },
                  ]
                : [
                    {
                      name: "note",
                      label: "Cancellation reason",
                      type: "textarea",
                      required: true,
                      minLength: 3,
                      maxLength: 2000,
                    },
                  ]
          }
          onClose={() => setAction(null)}
          onSubmit={async (values, key) => {
            if (action.kind === "plan") {
              const body = {
                siteId: site.id,
                scheduledAt: new Date(String(values.scheduledAt)).toISOString(),
                notes: values.notes,
                ...(current
                  ? { version: current.version }
                  : { leadId, dealId: deal?.id }),
              };
              await api(
                current ? `sales/deliveries/${current.id}` : "sales/deliveries",
                {
                  method: current ? "PATCH" : "POST",
                  body,
                  ...(current ? {} : { key }),
                },
              );
            } else {
              await api(
                `sales/deliveries/${current!.id}/${action.kind === "check" ? "checklist" : "cancel"}`,
                {
                  method: "PATCH",
                  body: {
                    siteId: site.id,
                    version: current!.version,
                    note: values.note,
                    ...(action.kind === "check"
                      ? {
                          item: action.item,
                          complete: values.complete === true,
                        }
                      : {}),
                  },
                },
              );
            }
            resource.reload();
            onSaved();
          }}
        />
      )}
    </>
  );
}

type HandoverRow = {
  id: string;
  version: number;
  customer_id: string;
  vehicle_label: string;
  scheduled_delivery_at: string;
  pdi_due_date: string;
  pdi_status: string;
  pdi_owner?: string;
  pdi_notes?: string;
  accessories_status: string;
  accessories_notes?: string;
  first_service_status: string;
  first_service_appointment_id?: string;
  customer_service_preference?: { preferred_channel: string; notes: string };
  risks: { pdiRisk: boolean; firstServiceMissing: boolean };
};
export function ServiceHandoverLane() {
  const { site, can } = useWorkspace();
  const [offset, setOffset] = useState(0);
  const [action, setAction] = useState<{
    kind: string;
    item: HandoverRow;
  } | null>(null);
  const resource = useResource<{ handovers: HandoverRow[]; pagination: Page }>(
    `service/handover-lane?${query({ siteId: site.id, offset, limit: 10 })}`,
  );
  const bays = useDirectory<{ id: string; name: string; active: boolean }>(
    action?.kind === "first-service-booking"
      ? `service/resources?siteId=${site.id}`
      : null,
    "resources",
  );
  const fields: Field[] =
    action?.kind === "pdi"
      ? [
          {
            name: "status",
            label: "PDI status",
            type: "select",
            value: action.item.pdi_status,
            options: ["pending", "booked", "in_progress", "completed"].map(
              (value) => ({ value, label: value.replaceAll("_", " ") }),
            ),
          },
          {
            name: "dueAt",
            label: "PDI due (device timezone)",
            type: "datetime-local",
            value: action.item.pdi_due_date
              ? localDate(action.item.pdi_due_date)
              : "",
          },
          {
            name: "ownerId",
            label: "PDI owner staff UUID (optional)",
            required: false,
            value: action.item.pdi_owner ?? "",
          },
          {
            name: "notes",
            label: "Inspection evidence",
            type: "textarea",
            value: action.item.pdi_notes ?? "",
            required: false,
          },
        ]
      : action?.kind === "accessories"
        ? [
            {
              name: "status",
              label: "Accessories preparation",
              type: "select",
              value: action.item.accessories_status,
              options: ["pending", "in_progress", "ready"].map((value) => ({
                value,
                label: value.replaceAll("_", " "),
              })),
            },
            {
              name: "notes",
              label: "Preparation notes",
              type: "textarea",
              value: action.item.accessories_notes ?? "",
              required: false,
            },
          ]
        : action?.kind === "first-service-booking"
          ? [
              {
                name: "startsAt",
                label: "First-service start (device timezone)",
                type: "datetime-local",
              },
              {
                name: "endsAt",
                label: "First-service end (device timezone)",
                type: "datetime-local",
              },
              {
                name: "resourceId",
                label: "Workshop resource",
                type: "select",
                options: bays.items
                  .filter((b) => b.active)
                  .map((b) => ({ value: b.id, label: b.name })),
              },
              {
                name: "notes",
                label: "Booking notes",
                type: "textarea",
                required: false,
              },
            ]
          : action?.kind === "preferences"
            ? [
                {
                  name: "preferred_channel",
                  label: "Preferred contact channel",
                  type: "select",
                  value:
                    action.item.customer_service_preference
                      ?.preferred_channel ?? "email",
                  options: ["email", "sms", "call"].map((value) => ({
                    value,
                    label: value,
                  })),
                },
                {
                  name: "notes",
                  label: "Contact/mobility preferences",
                  type: "textarea",
                  required: false,
                },
              ]
            : [
                {
                  name: "notes",
                  label: "Final handover evidence",
                  type: "textarea",
                },
              ];
  return (
    <Panel className="mb-5">
      <PanelHeading
        title="Sales-to-Service handover"
        description="PDI and accessories extend the existing delivery preparation checklist. First-service bookings use workshop hours and conflict checks."
      />
      <div className="space-y-4 p-5">
        <ResourceState resource={resource} />
        <Button variant="secondary" onClick={resource.reload}>
          Refresh handovers
        </Button>
        {resource.data?.handovers.map((item) => (
          <article key={item.id} className="rounded-xl border p-4">
            <h3 className="font-bold">{item.vehicle_label}</h3>
            <p>
              Delivery: {timestamp(item.scheduled_delivery_at, site.timezone)}
            </p>
            <p>
              PDI: {item.pdi_status} ? Due{" "}
              {timestamp(item.pdi_due_date, site.timezone)} ? Accessories:{" "}
              {item.accessories_status}
            </p>
            <p>First service: {item.first_service_status}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                className="mr-3 text-brand"
                href={`/customers/${item.customer_id}`}
              >
                Customer
              </Link>
              {can("deliveries.prepare") && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setAction({ kind: "pdi", item })}
                  >
                    Update PDI
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setAction({ kind: "accessories", item })}
                  >
                    Accessories
                  </Button>
                </>
              )}
              {can("service.write") && item.risks.firstServiceMissing && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    setAction({ kind: "first-service-booking", item })
                  }
                >
                  Book first service
                </Button>
              )}
              {can("deliveries.write") && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setAction({ kind: "preferences", item })}
                  >
                    Contact preferences
                  </Button>
                  <Button onClick={() => setAction({ kind: "complete", item })}>
                    Final handover
                  </Button>
                </>
              )}
            </div>
          </article>
        ))}
        {resource.data?.handovers.length === 0 && (
          <p>
            No active handovers. Create a delivery plan from an approved
            proposal.
          </p>
        )}
        <Pager
          page={resource.data?.pagination}
          offset={offset}
          setOffset={setOffset}
        />
      </div>
      {action && (
        <ActionDialog
          title={action.kind.replaceAll("-", " ")}
          description="Application-owned handover preparation. Booking acceptance remains local/simulated."
          fields={fields}
          onClose={() => setAction(null)}
          onSubmit={async (values, key) => {
            const body: Record<string, unknown> = {
              ...values,
              siteId: site.id,
              version: action.item.version,
            };
            for (const name of ["startsAt", "endsAt", "dueAt"])
              if (values[name])
                body[name] = new Date(String(values[name])).toISOString();
            await api(
              `service/handover-lane/${action.item.id}/${action.kind}`,
              { method: "POST", key, body },
            );
            resource.reload();
          }}
        >
          <Feedback error={bays.error} />
        </ActionDialog>
      )}
    </Panel>
  );
}
export function HandoverRiskQueue() {
  const { site } = useWorkspace();
  const [offset, setOffset] = useState(0);
  const resource = useResource<{ handovers: HandoverRow[]; pagination: Page }>(
    `service/handover-lane?${query({ siteId: site.id, riskOnly: "true", offset, limit: 10 })}`,
  );
  return (
    <Panel className="mb-5">
      <PanelHeading
        title="Handover risks"
        description="Deliveries missing PDI or a first-service booking within your authorised delivery view."
      />
      <div className="space-y-3 p-5">
        <ResourceState resource={resource} />
        {resource.data?.handovers.map((h) => (
          <p key={h.id}>
            <Link className="text-brand" href="/deliveries">
              {h.vehicle_label}
            </Link>{" "}
            ? {timestamp(h.scheduled_delivery_at, site.timezone)} ?{" "}
            {h.risks.pdiRisk ? "PDI incomplete " : ""}
            {h.risks.firstServiceMissing ? "First service missing" : ""}
          </p>
        ))}
        {resource.data?.handovers.length === 0 && (
          <p>No current handover risks.</p>
        )}
        <Pager
          page={resource.data?.pagination}
          offset={offset}
          setOffset={setOffset}
        />
      </div>
    </Panel>
  );
}

export function LiveDeliveries() {
  const { site, can } = useWorkspace();
  const [tab, setTab] = useState<"plans" | "handover">("plans");
  const [status, setStatus] = useState("planned");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const resource = useResource<{ deliveries: Delivery[]; pagination: Page }>(
    can("deliveries.read")
      ? `sales/deliveries?${query({ siteId: site.id, status: status || undefined, offset, limit: 12 })}`
      : null,
  );
  return (
    <>
      <PageHeader
        title="Handover lane & vehicle delivery"
        eyebrow={site.name}
        description="Prepare vehicles, review delivery checks, and connect sales delivery with service desk introduction."
        actions={
          <Button variant="secondary" onClick={resource.reload}>
            Refresh
          </Button>
        }
      />
      <div className="flex border-b border-slate-200 px-1 mb-5 gap-4">
        <button
          onClick={() => setTab("plans")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === "plans"
              ? "border-brand text-brand"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Delivery checklist plans
        </button>
        <button
          onClick={() => setTab("handover")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === "handover"
              ? "border-brand text-brand"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Sales-to-Service Handover lane
        </button>
      </div>

      {tab === "handover" && <ServiceHandoverLane />}

      {tab === "plans" && (
        <>
          {!can("deliveries.read") && (
            <Panel>
              <EmptyState
                title="Delivery access required"
                description="Your current membership does not allow this delivery view."
              />
            </Panel>
          )}
          {can("deliveries.read") && (
            <>
              <Panel className="mb-5">
                <PanelHeading
                  title="Delivery plans"
                  description={
                    can("deliveries.write")
                      ? "Plan deliveries from an approved proposal in Sales desk → Deals → Delivery plan."
                      : "Confirm vehicle preparation for deliveries within your site and brand access."
                  }
                />
                <div className="p-5">
                  <label className="text-sm font-semibold text-slate-600">
                    Show
                    <select
                      className={inputClass}
                      value={status}
                      onChange={(event) => {
                        setStatus(event.target.value);
                        setOffset(0);
                      }}
                    >
                      <option value="planned">Planned deliveries</option>
                      <option value="cancelled">Cancelled plans</option>
                      <option value="handed_over">Handed over</option>
                      <option value="">All plans</option>
                    </select>
                  </label>
                </div>
              </Panel>
              <ResourceState resource={resource} />
              {resource.data && !resource.data.deliveries.length && (
                <Panel>
                  <EmptyState
                    icon="delivery"
                    title="No delivery plans in this view"
                    description="Delivery plans appear here after they are created against approved deals."
                  />
                </Panel>
              )}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {resource.data?.deliveries.map((plan) => (
                  <Panel key={plan.id} className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge tone={plan.readiness.ready ? "green" : "amber"}>
                        {plan.status === "handed_over"
                          ? "Handed over"
                          : plan.status === "cancelled"
                            ? "Cancelled"
                            : plan.readiness.ready
                              ? "Ready"
                              : "Needs attention"}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {plan.readiness.completedItems}/
                        {plan.readiness.totalItems} checks
                      </span>
                    </div>
                    <h2 className="mt-4 break-words text-lg font-bold text-slate-900">
                      {plan.stock_label}
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      {timestamp(plan.scheduled_at, site.timezone)}
                    </p>
                    {plan.readiness.overdue && (
                      <p className="mt-2 text-xs font-bold text-amber-700">
                        Past planned delivery time
                      </p>
                    )}
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {plan.readiness.ready
                        ? "All checks are confirmed and the approved vehicle is reserved."
                        : plan.readiness.blockers[0]}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                      <Button
                        variant="secondary"
                        onClick={() => setSelected(plan.id)}
                      >
                        View checklist
                      </Button>
                      <Link
                        className="text-sm font-semibold text-brand hover:underline"
                        href={`/customers/${plan.customer_id}`}
                      >
                        Open customer
                      </Link>
                    </div>
                  </Panel>
                ))}
              </div>
              <Pager
                page={resource.data?.pagination}
                offset={offset}
                setOffset={setOffset}
              />
            </>
          )}
          {selected && (
            <LiveDeliveryDialog
              key={selected}
              deliveryId={selected}
              onClose={() => setSelected(null)}
              onSaved={resource.reload}
            />
          )}
        </>
      )}
    </>
  );
}
