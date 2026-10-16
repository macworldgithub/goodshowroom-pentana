"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, errorMessage, query } from "@/lib/backend";
import type { Page, LoanCar } from "@/lib/backend-types";
import { useWorkspace } from "./workspace-provider";
import {
  ActionDialog,
  Feedback,
  localDate,
  Pager,
  ResourceState,
  timestamp,
  useResource,
  type Field,
} from "./live-common";
import {
  Badge,
  Button,
  inputClass,
  PageHeader,
  Panel,
  PanelHeading,
} from "./ui";

const states = [
  "waiting_authority",
  "in_workshop",
  "waiting_parts",
  "ready",
  "invoiced",
];
const label = (value: string) => value.replaceAll("_", " ");
type RO = {
  id: string;
  number: string;
  external_id: string;
  customer_id: string;
  appointment_id: string;
  brand_id: string;
  vehicle: string;
  vehicle_external_id: string | null;
  assigned_to: string;
  status: string;
  source_status: string;
  operations_summary: string;
  promised_at: string;
  version: number;
  integration_mode: string;
  created_at: string;
  updated_at: string;
  ready_at: string | null;
  invoiced_at: string | null;
  authority_notes: { text: string; recorded_at: string; recorded_by: string }[];
  allowedTransitions: string[];
  status_history: {
    from: string;
    to: string;
    note: string;
    recorded_at: string;
    recorded_by: string;
  }[];
  stage?: string;
  technician_name?: string | null;
  technician_notes?: string | null;
  road_test_status?: string | null;
  check_in?: {
    arrived_at: string;
    mileage_in?: number;
    loan_car_rego?: string | null;
    fuel_level?: string;
    customer_signature?: string;
    loan_car_id?: string;
    notes?: string;
  } | null;
  authority_request?: {
    requested_at: string;
    amount?: number;
    response_note?: string;
    description: string;
    status: "pending" | "approved" | "declined";
    decided_at?: string;
    decision_notes?: string;
  } | null;
  collection?: {
    collected_at: string;
    payment_status: "paid" | "on_account" | "warranty";
    key_released: boolean;
    collected_by_staff_id: string;
    notes?: string;
  } | null;
};
type Command = {
  id: string;
  repair_order_id: string;
  kind: string;
  status: string;
  attempts: number;
  error?: string;
  created_at: string;
};
type Capabilities = {
  mode: string;
  simulated: boolean;
  writesEnabled: boolean;
  blocker: string | null;
};
type List = { repairOrders: RO[]; pagination: Page; integration: Capabilities };
type Detail = {
  driveOpportunities?: {
    title: string;
    vehicle_interest: string | null;
    status: string;
  }[];
  repairOrder: RO;
  commands: Command[];
  integration: Capabilities;
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    mobile_phone?: string;
    email?: string;
  } | null;
  appointment: {
    id: string;
    status: string;
    starts_at: string;
    ends_at: string;
  } | null;
  advisor: { id: string; fullName: string | null };
};

function OrderCard({ row, timezone }: { row: RO; timezone: string }) {
  const [now] = useState(() => Date.now());
  const isOverdue =
    new Date(row.promised_at).getTime() < now &&
    row.status !== "ready" &&
    row.status !== "invoiced";
  const isUrgent =
    !isOverdue &&
    new Date(row.promised_at).getTime() - now < 30 * 60 * 1000 &&
    row.status !== "ready" &&
    row.status !== "invoiced";

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <Link
          className="break-all font-semibold text-brand hover:underline"
          href={`/service/repair-orders/${row.id}`}
        >
          {row.number}
        </Link>
        {row.stage && <Badge tone="slate">{label(row.stage)}</Badge>}
      </div>
      <p className="mt-2 text-sm font-medium text-slate-900">{row.vehicle}</p>
      <p className="mt-1 text-sm text-slate-500 line-clamp-2">
        {row.operations_summary}
      </p>
      {row.technician_name && (
        <p className="mt-1 text-xs text-slate-600">
          Tech: {row.technician_name}
        </p>
      )}
      <div className="my-2 flex flex-wrap items-center gap-1.5">
        <p className="text-xs text-slate-500">
          Promised: {timestamp(row.promised_at, timezone)}
        </p>
        {isOverdue && <Badge tone="red">Overdue</Badge>}
        {isUrgent && <Badge tone="amber">&lt; 30m</Badge>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge
          tone={
            row.status === "ready"
              ? "green"
              : row.status === "invoiced"
                ? "slate"
                : "amber"
          }
        >
          {label(row.status)}
        </Badge>
        {row.check_in && <Badge tone="green">Checked In</Badge>}
        {row.authority_request?.status === "pending" && (
          <Badge tone="amber">
            Auth Pending (${row.authority_request.amount})
          </Badge>
        )}
        {row.collection && <Badge tone="slate">Collected</Badge>}
        <Badge tone="slate">
          {row.integration_mode === "simulated" ? "Simulated" : "Source record"}
        </Badge>
      </div>
      <Link
        className="mt-3 block text-sm text-brand hover:underline"
        href={`/customers/${row.customer_id}`}
      >
        Open customer
      </Link>
    </article>
  );
}

type RecoveryItem = {
  kind: string;
  entityId: string;
  customerId: string;
  customerName: string;
  title: string;
  dueAt: string;
  fingerprint: string;
  repairOrderId?: string;
};
export function ServiceRecoveryQueues() {
  const { site, can } = useWorkspace();
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<RecoveryItem | null>(null);
  const resource = useResource<{
    items: RecoveryItem[];
    pagination: Page;
    total: number;
  }>(`service/recovery?${query({ siteId: site.id, offset, limit: 10 })}`);
  return (
    <Panel className="mb-5">
      <PanelHeading
        title="Customer recovery"
        description="Unconfirmed and missed bookings, unanswered calls, authority, declined work and missed promises."
      />
      <div className="space-y-3 p-5">
        <ResourceState resource={resource} />
        <Button variant="secondary" onClick={resource.reload}>
          Refresh recovery queue
        </Button>
        {resource.data?.items.map((item) => (
          <article
            key={`${item.kind}:${item.entityId}`}
            className="rounded-lg border p-3"
          >
            <Badge tone="amber">{label(item.kind)}</Badge>
            <p className="mt-2 font-semibold">
              {item.customerName} ? {item.title}
            </p>
            <p className="text-xs text-slate-500">
              {timestamp(item.dueAt, site.timezone)}
            </p>
            <Link
              href={`/customers/${item.customerId}`}
              className="mr-4 text-sm text-brand"
            >
              Open customer
            </Link>
            {item.repairOrderId && (
              <Link
                className="mr-4 text-sm text-brand"
                href={`/service/repair-orders/${item.repairOrderId}`}
              >
                Open RO
              </Link>
            )}
            {can("service.write") && (
              <Button variant="secondary" onClick={() => setSelected(item)}>
                Resolve / follow up
              </Button>
            )}
          </article>
        ))}
        {resource.data?.items.length === 0 && (
          <p>No outstanding recovery items.</p>
        )}
        <Pager
          page={resource.data?.pagination}
          offset={offset}
          setOffset={setOffset}
        />
      </div>
      {selected && (
        <ActionDialog
          title="Resolve recovery item"
          description="Record the contact outcome. An optional follow-up is assigned to you and appears in My Day."
          fields={[
            {
              name: "note",
              label: "Outcome and resolution evidence",
              type: "textarea",
              minLength: 3,
              maxLength: 2000,
            },
            {
              name: "followUpAt",
              label: "Optional follow-up (your device timezone)",
              type: "datetime-local",
              required: false,
            },
          ]}
          onClose={() => setSelected(null)}
          onSubmit={async (values) => {
            await api(
              `service/recovery/${selected.kind}/${selected.entityId}/resolve`,
              {
                method: "POST",
                body: {
                  siteId: site.id,
                  fingerprint: selected.fingerprint,
                  note: values.note,
                  ...(values.followUpAt
                    ? {
                        followUpAt: new Date(
                          String(values.followUpAt),
                        ).toISOString(),
                      }
                    : {}),
                },
              },
            );
            resource.reload();
          }}
        />
      )}
    </Panel>
  );
}
export function LoanCarsFleetManager() {
  const { site, can } = useWorkspace();
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const resource = useResource<{ loanCars: LoanCar[]; pagination: Page }>(
    `service/repair-orders/loan-cars?${query({ siteId: site.id, offset, limit: 10 })}`,
  );
  return (
    <Panel className="mb-5">
      <PanelHeading
        title="Loan cars"
        description="Simulated loan-car availability. Allocation is accepted with vehicle check-in; collection requires an explicit return."
      />
      <div className="space-y-3 p-5">
        <ResourceState resource={resource} />
        {can("users.manage") && (
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Add simulated loan-car fixture
          </Button>
        )}
        {resource.data?.loanCars.map((car) => (
          <p key={car.id}>
            {car.registration} ? {car.make} {car.model} ?{" "}
            <strong>{car.status}</strong>
          </p>
        ))}
        <Pager
          page={resource.data?.pagination}
          offset={offset}
          setOffset={setOffset}
        />
      </div>
      {open && (
        <ActionDialog
          title="Simulated loan-car fixture"
          fields={[
            {
              name: "brandId",
              label: "Brand",
              type: "select",
              options: site.brands.map((b) => ({ value: b.id, label: b.name })),
            },
            { name: "make", label: "Make" },
            { name: "model", label: "Model" },
            { name: "year", label: "Year", type: "number" },
            { name: "registration", label: "Registration" },
          ]}
          onClose={() => setOpen(false)}
          onSubmit={async (values, key) => {
            await api("service/repair-orders/loan-cars", {
              method: "POST",
              key,
              body: { ...values, siteId: site.id, year: Number(values.year) },
            });
            resource.reload();
          }}
        />
      )}
    </Panel>
  );
}

export function RepairOrderList({
  customerId,
  appointmentId,
  queue = false,
  date,
}: {
  customerId?: string;
  appointmentId?: string;
  queue?: boolean;
  date?: string;
}) {
  const { site, can } = useWorkspace();
  const [activeTab, setActiveTab] = useState<
    "orders" | "recovery" | "loan_cars"
  >("orders");
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [board, setBoard] = useState(false);
  const [view, setView] = useState("own");
  const resource = useResource<List>(
    `service/repair-orders${queue ? "/my-day" : ""}?${query({
      siteId: site.id,
      customerId,
      appointmentId,
      offset,
      limit: 20,
      ...(queue
        ? {
            view: can("service.view_team") ? view : "own",
            date: date || undefined,
          }
        : { status: status || undefined, search: search || undefined }),
    })}`,
  );
  return (
    <Panel className="mb-6">
      <PanelHeading
        title={queue ? "Repair-order exceptions" : "Repair orders"}
        description={
          queue
            ? "Authority, waiting parts, ready vehicles and promised work. This queue has its own paging and Service permissions."
            : "Confirmed repair orders linked to the appointment and customer. The board groups the current page."
        }
      />
      {!queue && !customerId && !appointmentId && (
        <div className="flex border-b border-slate-200 px-5 mb-4 gap-4">
          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "orders"
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Active repair orders
          </button>
          <button
            onClick={() => setActiveTab("recovery")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "recovery"
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Service recovery queues
          </button>
          <button
            onClick={() => setActiveTab("loan_cars")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "loan_cars"
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Loan cars fleet
          </button>
        </div>
      )}

      {activeTab === "recovery" && <ServiceRecoveryQueues />}
      {activeTab === "loan_cars" && <LoanCarsFleetManager />}

      {activeTab === "orders" && (
        <>
          <div className="flex flex-wrap gap-3 px-5 pb-4">
            {!queue && (
              <>
                <input
                  aria-label="Search repair orders"
                  className={inputClass}
                  placeholder="RO number, vehicle or operation"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setOffset(0);
                  }}
                />
                <select
                  aria-label="Repair order status"
                  className={inputClass}
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setOffset(0);
                  }}
                >
                  <option value="">All statuses</option>
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {label(s)}
                    </option>
                  ))}
                </select>
                <Button
                  variant="secondary"
                  onClick={() => setBoard((value) => !value)}
                >
                  {board ? "Show list" : "Show board"}
                </Button>
              </>
            )}
            {queue && can("service.view_team") && (
              <select
                aria-label="Repair order queue"
                className={inputClass}
                value={view}
                onChange={(e) => {
                  setView(e.target.value);
                  setOffset(0);
                }}
              >
                <option value="own">My repair orders</option>
                <option value="team">Team repair orders</option>
              </select>
            )}
            <Button variant="secondary" onClick={resource.reload}>
              Refresh repair orders
            </Button>
          </div>
          <ResourceState resource={resource} />
          {resource.data?.integration?.blocker && (
            <p className="px-5 pb-3 text-sm text-amber-800">
              {resource.data.integration.blocker}
            </p>
          )}
          {resource.data?.repairOrders.length === 0 && (
            <p className="px-5 pb-5 text-sm text-slate-500">
              No matching repair orders.
            </p>
          )}
          {board ? (
            <div className="grid gap-4 overflow-x-auto p-5 lg:grid-cols-5">
              {states.map((s) => (
                <section key={s} className="min-w-48 space-y-3">
                  <h3 className="font-semibold capitalize">{label(s)}</h3>
                  {resource.data?.repairOrders
                    .filter((row) => row.status === s)
                    .map((row) => (
                      <OrderCard
                        key={row.id}
                        row={row}
                        timezone={site.timezone}
                      />
                    ))}
                </section>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2 xl:grid-cols-3">
              {resource.data?.repairOrders.map((row) => (
                <OrderCard key={row.id} row={row} timezone={site.timezone} />
              ))}
            </div>
          )}
          <div className="px-5 pb-5">
            <Pager
              page={resource.data?.pagination}
              offset={offset}
              setOffset={setOffset}
            />
          </div>
        </>
      )}
    </Panel>
  );
}

export function LiveRepairOrders({
  appointmentId,
}: {
  appointmentId?: string;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Service desk"
        title="Repair orders"
        description="Authority, workshop progress and readiness on the shared customer thread."
      />
      <Link
        href="/service"
        className="mb-5 inline-block text-sm font-semibold text-brand"
      >
        Back to diary and appointments
      </Link>
      <RepairOrderList appointmentId={appointmentId} />
      <RepairOrderCommandQueue />
    </>
  );
}

function RepairOrderCommandQueue() {
  const { site, can } = useWorkspace();
  const [offset, setOffset] = useState(0);
  const [retry, setRetry] = useState<Command | null>(null);
  const [error, setError] = useState("");
  const resource = useResource<{ commands: Command[]; pagination: Page }>(
    `service/repair-orders/commands?${query({ siteId: site.id, offset, limit: 10 })}`,
  );
  const pending = resource.data?.commands.some((c) =>
    ["queued", "retry_wait"].includes(c.status),
  );
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(resource.reload, 3000);
    return () => clearInterval(timer);
  }, [pending, resource.reload]);
  return (
    <Panel>
      <PanelHeading
        title="Repair-order command queue"
        description="Recent requests, including simulated record preparation. Refresh after acceptance to update the board."
      />
      <div className="space-y-3 p-5">
        <Button variant="secondary" onClick={resource.reload}>
          Refresh commands
        </Button>
        <ResourceState resource={resource} />
        <Feedback error={error} />
        {resource.data?.commands.map((c) => (
          <article
            key={c.id}
            className="rounded-lg border border-slate-200 p-3"
          >
            <p>
              {label(c.kind.replace("repair_order.", ""))} ·{" "}
              <strong>{c.status}</strong> · Attempts: {c.attempts}
            </p>
            <p className="text-xs text-slate-500">
              {timestamp(c.created_at, site.timezone)}
            </p>
            <Feedback error={c.error} />
            {c.status === "succeeded" && (
              <Link
                className="text-sm font-semibold text-brand"
                href={`/service/repair-orders/${c.repair_order_id}`}
              >
                Open repair order
              </Link>
            )}
            {can("users.manage") &&
              ["queued", "retry_wait"].includes(c.status) && (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      setError("");
                      await api(
                        `service/repair-orders/commands/${c.id}/process-simulated`,
                        { method: "POST", body: { siteId: site.id } },
                      );
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
                <Button variant="secondary" onClick={() => setRetry(c)}>
                  Review and retry
                </Button>
              )}
          </article>
        ))}
        <Pager
          page={resource.data?.pagination}
          offset={offset}
          setOffset={setOffset}
        />
      </div>
      {retry && (
        <ActionDialog
          title="Review simulated command"
          description="Verify that the requested change was not applied before retrying. A stale version will still be rejected; submit a fresh change from the repair order in that case."
          fields={[
            {
              name: "note",
              label: "Review evidence",
              type: "textarea",
              minLength: 5,
              maxLength: 2000,
            },
            {
              name: "confirmedNotApplied",
              label: "I verified that this simulated command was not applied",
              type: "checkbox",
            },
          ]}
          onClose={() => setRetry(null)}
          onSubmit={async (values) => {
            await api(`service/repair-orders/commands/${retry.id}/retry`, {
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

export function SimulateRepairOrder({
  appointmentId,
  promisedAt,
  customerId,
}: {
  appointmentId: string;
  promisedAt: string;
  customerId?: string;
}) {
  const { site, can } = useWorkspace();
  const vehicles = useResource<{
    vehicles: {
      id: string;
      make: string;
      model: string;
      registration: string;
      ownership?: string;
    }[];
  }>(
    customerId
      ? `customers/${customerId}/vehicles?siteId=${site.id}&limit=100`
      : null,
  );
  const [open, setOpen] = useState(false);
  const [commandId, setCommandId] = useState<string>();
  const command = useResource<{ command: Command }>(
    commandId
      ? `service/repair-orders/commands/${commandId}?siteId=${site.id}`
      : null,
  );
  const pending =
    commandId &&
    (!command.data ||
      ["queued", "retry_wait"].includes(command.data.command.status));
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(command.reload, 2000);
    return () => clearInterval(timer);
  }, [pending, command.reload]);
  if (!can("service.write")) return null;
  return (
    <div className="mt-3">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Prepare simulated RO
      </Button>
      {commandId && (
        <>
          <ResourceState resource={command} />
          <p className="mt-2 text-sm">
            Simulation command: {command.data?.command.status ?? "queued"}
          </p>
          <Feedback error={command.data?.command.error} />
          {command.data?.command.status === "succeeded" && (
            <Link
              className="text-sm font-semibold text-brand"
              href={`/service/repair-orders/${command.data.command.repair_order_id}`}
            >
              Open simulated repair order
            </Link>
          )}
        </>
      )}
      {open && (
        <ActionDialog
          title="Prepare simulated repair order"
          description="Development simulation only. This queues a simulated source record from this appointment; it does not create an RO in Pentana. Existing ROs remain accessible from the repair-order board."
          fields={[
            {
              name: "customerVehicleId",
              label: "Owned customer vehicle (optional)",
              type: "select",
              required: false,
              options: [
                { value: "", label: "Appointment description only" },
                ...(vehicles.data?.vehicles
                  .filter((v) => v.ownership !== "previous")
                  .map((v) => ({
                    value: v.id,
                    label: `${v.make} ${v.model} ${v.registration}`,
                  })) ?? []),
              ],
            },
            {
              name: "promisedAt",
              label: "Promised completion (your browser timezone)",
              type: "datetime-local",
              value: localDate(promisedAt),
            },
          ]}
          onClose={() => setOpen(false)}
          onSubmit={async (values, key) => {
            const result = await api<{ command: Command }>(
              "service/repair-orders/simulate-from-appointment",
              {
                method: "POST",
                key,
                body: {
                  siteId: site.id,
                  appointmentId,
                  ...(values.customerVehicleId
                    ? { customerVehicleId: values.customerVehicleId }
                    : {}),
                  promisedAt: new Date(String(values.promisedAt)).toISOString(),
                },
              },
            );
            setCommandId(result.command.id);
          }}
        />
      )}
    </div>
  );
}

type WorkflowAction =
  | "check-in"
  | "progress"
  | "request-authority"
  | "respond-authority"
  | "collect"
  | "reassign"
  | "promise"
  | "add-operation"
  | "task"
  | "message"
  | "note"
  | "transition";
export function LiveRepairOrderDetail({ id }: { id: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const { site, can } = useWorkspace();
  const [action, setAction] = useState<WorkflowAction | null>(null),
    [notice, setNotice] = useState("");
  const resource = useResource<Detail>(
    `service/repair-orders/${id}?siteId=${site.id}`,
    15000,
  );
  const loans = useResource<{ loanCars: LoanCar[] }>(
    action === "check-in"
      ? `service/repair-orders/loan-cars?siteId=${site.id}&limit=100`
      : null,
  );
  const staff = useResource<{
    staff: { userId: string; fullName: string | null; permissions: string[] }[];
  }>(action === "reassign" ? `sites/${site.id}/staff?limit=100` : null);
  const row = resource.data?.repairOrder,
    data = resource.data;
  const pending = data?.commands.some((c) =>
    ["queued", "retry_wait"].includes(c.status),
  );
  const refresh = resource.reload;
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(refresh, 2000);
    return () => clearInterval(timer);
  }, [pending, refresh]);
  const locked =
    pending ||
    data?.commands.some((c) => c.status === "needs_review") ||
    !data?.integration.writesEnabled ||
    !!row?.collection;
  const fields: Field[] =
    action === "check-in"
      ? [
          { name: "mileageIn", label: "Odometer (km)", type: "number" },
          { name: "fuelLevel", label: "Fuel / charge level" },
          {
            name: "signatureConfirmed",
            label: "Customer check-in acknowledged",
            type: "checkbox",
          },
          {
            name: "loanCarId",
            label: "Loan car (optional)",
            type: "select",
            required: false,
            options: [
              { value: "", label: "No loan car" },
              ...(loans.data?.loanCars
                .filter(
                  (c) =>
                    c.status === "available" && c.brand_id === row?.brand_id,
                )
                .map((c) => ({ value: c.id, label: c.registration })) ?? []),
            ],
          },
          {
            name: "notes",
            label: "Arrival notes",
            type: "textarea",
            required: false,
          },
        ]
      : action === "progress"
        ? [
            {
              name: "stage",
              label: "Workshop stage",
              type: "select",
              value: row?.stage ?? "in_progress",
              options: [
                "in_progress",
                "waiting_parts",
                "road_test_ready",
                "road_test_completed",
                "wash_clean",
                "completed",
              ].map((v) => ({ value: v, label: label(v) })),
            },
            {
              name: "technicianName",
              label: "Technician (status only)",
              value: row?.technician_name ?? "",
              required: false,
            },
            {
              name: "roadTestStatus",
              label: "Road test",
              type: "select",
              value: row?.road_test_status ?? "not_required",
              options: [
                "not_required",
                "pending",
                "in_progress",
                "passed",
                "failed",
              ].map((v) => ({ value: v, label: label(v) })),
            },
            {
              name: "technicianNotes",
              label: "Progress notes",
              type: "textarea",
              required: false,
            },
            {
              name: "markReady",
              label: "Mark ready for collection",
              type: "checkbox",
            },
          ]
        : action === "request-authority"
          ? [
              {
                name: "description",
                label:
                  "Work needing authority (reference source operations; no local estimate)",
                type: "textarea",
              },
            ]
          : action === "respond-authority"
            ? [
                {
                  name: "approved",
                  label: "Customer approved this work",
                  type: "checkbox",
                },
                {
                  name: "responseNote",
                  label: "Customer decision and contact evidence",
                  type: "textarea",
                },
              ]
            : action === "collect"
              ? [
                  {
                    name: "keysReturned",
                    label: "Keys and vehicle handed to the customer",
                    type: "checkbox",
                  },
                  {
                    name: "loanReturned",
                    label: "Allocated loan car returned and checked",
                    type: "checkbox",
                    required: false,
                  },
                  {
                    name: "notes",
                    label: "Collection notes",
                    type: "textarea",
                    required: false,
                  },
                ]
              : action === "reassign"
                ? [
                    {
                      name: "assignedTo",
                      label: "Advisor",
                      type: "select",
                      options:
                        staff.data?.staff
                          .filter((s) =>
                            s.permissions.includes("service.write"),
                          )
                          .map((s) => ({
                            value: s.userId,
                            label: s.fullName ?? s.userId,
                          })) ?? [],
                    },
                    {
                      name: "reason",
                      label: "Assignment reason",
                      type: "textarea",
                    },
                  ]
                : action === "promise"
                  ? [
                      {
                        name: "promisedAt",
                        label: "Promised completion (device timezone)",
                        type: "datetime-local",
                        value: row ? localDate(row.promised_at) : "",
                      },
                      {
                        name: "note",
                        label: "Reason for promise change",
                        type: "textarea",
                      },
                    ]
                  : action === "add-operation"
                    ? [
                        {
                          name: "description",
                          label: "Supported simulated source operation",
                          type: "textarea",
                        },
                        {
                          name: "note",
                          label: "Authority / source operation reference",
                          type: "textarea",
                        },
                      ]
                    : action === "task"
                      ? [
                          {
                            name: "title",
                            label: "Follow-up title",
                            value: row ? `Follow up ${row.number}` : "",
                          },
                          {
                            name: "dueAt",
                            label: "Due (device timezone)",
                            type: "datetime-local",
                          },
                        ]
                      : action === "message"
                        ? [
                            {
                              name: "channel",
                              label: "Channel",
                              type: "select",
                              options: [
                                { value: "email", label: "Email" },
                                { value: "sms", label: "SMS simulator" },
                              ],
                            },
                            {
                              name: "subject",
                              label: "Subject",
                              value: "Vehicle service update",
                            },
                            {
                              name: "body",
                              label: "Customer message ? review before saving",
                              type: "textarea",
                              value:
                                row?.status === "ready"
                                  ? `Your ${row.vehicle} is recorded ready for collection at ${site.name}. Please contact us to arrange collection.`
                                  : `The current recorded status of your ${row?.vehicle ?? "vehicle"} is ${label(row?.status ?? "pending")}. Please contact your advisor for further details.`,
                            },
                          ]
                        : action === "transition"
                          ? [
                              {
                                name: "status",
                                label: "Permitted next status",
                                type: "select",
                                options:
                                  row?.allowedTransitions.map((v) => ({
                                    value: v,
                                    label: label(v),
                                  })) ?? [],
                              },
                              {
                                name: "note",
                                label:
                                  "Transition reason / customer authority evidence",
                                type: "textarea",
                              },
                            ]
                          : [
                              {
                                name: "note",
                                label: "Customer authority note",
                                type: "textarea",
                              },
                            ];
  return (
    <>
      <PageHeader
        eyebrow="Service desk"
        title={row?.number ?? "Repair order"}
        description="Simulated service workflow. Source changes remain pending until acknowledged."
        actions={
          <Button variant="secondary" onClick={refresh}>
            Refresh
          </Button>
        }
      />
      <Link
        href="/service/repair-orders"
        className="mb-4 inline-block text-brand"
      >
        All repair orders
      </Link>
      <ResourceState resource={resource} />
      <Feedback message={notice} />
      {row && data && (
        <>
          <Panel className="mb-5">
            <div className="space-y-3 p-5">
              <Badge tone="amber">
                {row.integration_mode === "simulated"
                  ? "Simulated record ? no Pentana acceptance"
                  : "Source record"}
              </Badge>
              <h2 className="font-bold">{row.vehicle}</h2>
              <p>
                {label(row.status)} {row.collection ? "? Collected" : ""} ?{" "}
                {label(row.stage ?? "awaiting arrival")}
              </p>
              <p>
                Customer:{" "}
                <Link
                  className="text-brand"
                  href={`/customers/${row.customer_id}`}
                >
                  {data.customer
                    ? `${data.customer.first_name} ${data.customer.last_name}`
                    : "Open customer"}
                </Link>
              </p>
              <p>Advisor: {data.advisor.fullName ?? row.assigned_to}</p>
              {!!data.driveOpportunities?.length && (
                <p className="rounded bg-sky-50 p-3 text-sm">
                  Open sales opportunities for this customer in the drive:{" "}
                  {data.driveOpportunities.map((o) => o.title).join(", ")}
                </p>
              )}
              <p>
                Appointment:{" "}
                {data.appointment
                  ? timestamp(data.appointment.starts_at, site.timezone)
                  : "Unavailable"}
              </p>
              <p>Promised: {timestamp(row.promised_at, site.timezone)}</p>
              {!row.collection &&
                row.status !== "ready" &&
                Date.parse(row.promised_at) < now && (
                  <p className="text-rose-700">
                    Promised completion is overdue ? review and contact the
                    customer.
                  </p>
                )}
              <p>
                Arrival:{" "}
                {row.check_in
                  ? timestamp(row.check_in.arrived_at, site.timezone)
                  : "Not checked in"}
              </p>
              <p>
                Ready:{" "}
                {row.ready_at
                  ? timestamp(row.ready_at, site.timezone)
                  : "Pending"}{" "}
                ? Collected:{" "}
                {row.collection
                  ? timestamp(row.collection.collected_at, site.timezone)
                  : "Pending"}
              </p>
              <p className="whitespace-pre-wrap">
                Operations summary (read only): {row.operations_summary}
              </p>
              <p className="text-sm text-slate-500">
                Invoice, payment and parts context is source-owned and
                unavailable. Collection does not invoice or record payment.
              </p>
              <p className="break-all text-xs text-slate-500">
                External ID: {row.external_id} ? Customer vehicle ID:{" "}
                {row.vehicle_external_id ?? "not linked"}
              </p>
              {can("service.write") && !locked && (
                <div className="flex flex-wrap gap-2">
                  {!row.check_in && (
                    <Button onClick={() => setAction("check-in")}>
                      Check in
                    </Button>
                  )}
                  {row.check_in && (
                    <Button onClick={() => setAction("progress")}>
                      Workshop progress
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => setAction("request-authority")}
                  >
                    Request authority
                  </Button>
                  {row.authority_request?.status === "pending" && (
                    <Button onClick={() => setAction("respond-authority")}>
                      Record authority decision
                    </Button>
                  )}
                  {row.status === "ready" && (
                    <Button onClick={() => setAction("collect")}>
                      Collect vehicle
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => setAction("promise")}
                  >
                    Change promise
                  </Button>
                  <Button variant="secondary" onClick={() => setAction("note")}>
                    Authority note
                  </Button>
                  {!!row.allowedTransitions.length && (
                    <Button
                      variant="secondary"
                      onClick={() => setAction("transition")}
                    >
                      Source status
                    </Button>
                  )}
                  {can("service.assign_work") && (
                    <Button
                      variant="secondary"
                      onClick={() => setAction("reassign")}
                    >
                      Reassign advisor
                    </Button>
                  )}
                  {row.authority_request?.status === "approved" && (
                    <Button
                      variant="secondary"
                      onClick={() => setAction("add-operation")}
                    >
                      Add simulated operation
                    </Button>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                {can("messages.write") && (
                  <Button
                    variant="secondary"
                    onClick={() => setAction("message")}
                  >
                    Draft customer update
                  </Button>
                )}
                {can("tasks.write") && (
                  <Button variant="secondary" onClick={() => setAction("task")}>
                    Create RO follow-up
                  </Button>
                )}
              </div>
              {row.check_in && (
                <p className="text-sm">
                  Arrival odometer: {row.check_in.mileage_in} km ? Fuel:{" "}
                  {row.check_in.fuel_level} ? Loan car:{" "}
                  {row.check_in.loan_car_rego ?? "None"}
                </p>
              )}
              <p className="text-sm">
                Road test: {label(row.road_test_status ?? "not_required")} ?
                Technician: {row.technician_name ?? "Unassigned"}
              </p>
              {row.technician_notes && (
                <p className="whitespace-pre-wrap">{row.technician_notes}</p>
              )}
              {row.authority_request && (
                <p>
                  Authority: {row.authority_request.status} ?{" "}
                  {row.authority_request.description} ?{" "}
                  {row.authority_request.response_note ?? ""}
                </p>
              )}
              {row.collection && (
                <p>
                  Collected by staff {row.collection.collected_by_staff_id}.{" "}
                  {row.collection.notes}
                </p>
              )}
            </div>
          </Panel>
          <Panel className="mb-5">
            <PanelHeading title="Authority and status history" />
            <div className="space-y-3 p-5">
              {row.authority_notes.map((n, i) => (
                <p key={`n${i}`} className="whitespace-pre-wrap">
                  {n.text} ? {timestamp(n.recorded_at, site.timezone)} ?{" "}
                  {n.recorded_by}
                </p>
              ))}
              {row.status_history.map((h, i) => (
                <p key={`h${i}`} className="whitespace-pre-wrap">
                  {label(h.from)} ? {label(h.to)}: {h.note} ?{" "}
                  {timestamp(h.recorded_at, site.timezone)}
                </p>
              ))}
            </div>
          </Panel>
          <Panel>
            <PanelHeading
              title="Source command history"
              description="Pending and rejected writes remain visible; use the board command queue for administrator review."
            />
            <div className="space-y-3 p-5">
              {data.commands.map((c) => (
                <div key={c.id}>
                  <strong>
                    {c.kind} ? {c.status}
                  </strong>
                  <Feedback error={c.error} />
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}
      {action && row && (
        <ActionDialog
          title={label(action.replaceAll("-", "_"))}
          description={
            action === "message"
              ? "Save a draft only. Review and explicitly send from the customer thread."
              : "Changes to source-owned fields use the simulated command queue."
          }
          fields={fields}
          onClose={() => setAction(null)}
          onSubmit={async (values, key) => {
            if (action === "message") {
              await api(`customers/${row.customer_id}/messages`, {
                method: "POST",
                key,
                body: {
                  siteId: site.id,
                  repairOrderId: id,
                  appointmentId: row.appointment_id,
                  ...values,
                },
              });
              setNotice(
                "Draft saved. Open the customer thread to review and explicitly send it.",
              );
              return;
            }
            if (action === "task") {
              await api(`service/repair-orders/${id}/tasks`, {
                method: "POST",
                body: {
                  siteId: site.id,
                  title: values.title,
                  dueAt: new Date(String(values.dueAt)).toISOString(),
                },
              });
              setNotice("RO follow-up created in My Day.");
              return;
            }
            const body: Record<string, unknown> = {
              siteId: site.id,
              version: row.version,
              ...values,
            };
            if (action === "check-in")
              body.mileageIn = Number(values.mileageIn);
            if (action === "promise")
              body.promisedAt = new Date(
                String(values.promisedAt),
              ).toISOString();
            const path =
              action === "note"
                ? "authority-notes"
                : action === "transition"
                  ? "transitions"
                  : `actions/${action}`;
            await api(`service/repair-orders/${id}/${path}`, {
              method: "POST",
              key,
              body,
            });
            setNotice("Change queued for simulated acknowledgement.");
            refresh();
          }}
        >
          <ResourceState resource={loans} />
          <ResourceState resource={staff} />
        </ActionDialog>
      )}
    </>
  );
}
