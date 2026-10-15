"use client";
import Link from "next/link";
import { useState } from "react";
import { api, query } from "@/lib/backend";
import { customerName, type Customer, type Page } from "@/lib/backend-types";
import {
  ActionDialog,
  Feedback,
  localDate,
  Pager,
  ResourceState,
  timestamp,
  useDirectory,
  useResource,
  type Field,
} from "./live-common";
import {
  Badge,
  Button,
  EmptyState,
  inputClass,
  PageHeader,
  Panel,
  PanelHeading,
} from "./ui";
import { useWorkspace } from "./workspace-provider";
import { LiveServiceDiary, type Slot } from "./live-service-diary";
type Appointment = {
  resource_id?: string;
  id: string;
  customer_id: string;
  brand_id: string;
  assigned_to: string;
  title: string;
  vehicle: string;
  notes: string;
  starts_at: string;
  ends_at: string;
  status: string;
  outcome_note: string | null;
  version: number;
};
const states = ["booked", "confirmed", "cancelled", "attended", "no_show"];
type Editor = {
  kind: "new" | "edit" | "status";
  row?: Appointment;
  slot?: Slot;
};
export function LiveServiceAppointments() {
  const { site, context, can } = useWorkspace();
  const [status, setStatus] = useState("booked");
  const [offset, setOffset] = useState(0);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [diaryRevision, setDiaryRevision] = useState(0);
  const resource = useResource<{
    appointments: Appointment[];
    pagination: Page;
    visibility: string;
  }>(
    `service/appointments?${query({ siteId: site.id, status: status || undefined, offset, limit: 20 })}`,
  );
  const customers = useDirectory<Customer>(
    editor?.kind === "new" ? `customers?siteId=${site.id}` : null,
    "customers",
  );
  const brands = useDirectory<{
    id: string;
    name: string;
    permissions: string[];
  }>(`sites/${site.id}/brands`, "brands");
  const staff = useDirectory<{
    userId: string;
    fullName: string | null;
    permissions: string[];
  }>(
    editor && can("service.assign_work") ? `sites/${site.id}/staff` : null,
    "staff",
  );
  const row = editor?.row;
  const workshop = useDirectory<{ id: string; name: string; active: boolean }>(
    `service/resources?siteId=${site.id}`,
    "resources",
  );
  const statusEditor = editor?.kind === "status";
  const fields: Field[] = statusEditor
    ? [
        {
          name: "status",
          label: "Outcome",
          type: "select",
          value: row?.status === "confirmed" ? "cancelled" : "confirmed",
          options: ["confirmed", "cancelled", "attended", "no_show"].map(
            (value) => ({ value, label: value.replace("_", " ") }),
          ),
        },
        {
          name: "outcomeNote",
          label: "Outcome note",
          type: "textarea",
          maxLength: 2000,
          hint: "Required for cancellation, attendance or no-show. Recording attendance does not create a repair order.",
        },
      ]
    : [
        ...(!row
          ? [
              {
                name: "customerId",
                label: "Customer",
                type: "select" as const,
                required: true,
                options: [
                  { value: "", label: "Choose a customer" },
                  ...customers.items.map((c) => ({
                    value: c.id,
                    label: customerName(c),
                  })),
                ],
              },
              {
                name: "brandId",
                label: "Site brand",
                type: "select" as const,
                required: true,
                options: [
                  { value: "", label: "Choose a brand" },
                  ...brands.items
                    .filter((b) => b.permissions.includes("service.write"))
                    .map((b) => ({ value: b.id, label: b.name })),
                ],
              },
            ]
          : []),
        {
          name: "resourceId",
          label: "Workshop resource",
          type: "select",
          required: true,
          value: editor?.slot?.resourceId ?? row?.resource_id ?? "",
          options: [
            { value: "", label: "Choose a resource" },
            ...workshop.items
              .filter((r) => r.active)
              .map((r) => ({ value: r.id, label: r.name })),
          ],
        },
        {
          name: "title",
          label: "Service requested",
          value: row?.title ?? "",
          required: true,
          minLength: 2,
          maxLength: 180,
        },
        {
          name: "vehicle",
          label: "Vehicle and registration",
          value: row?.vehicle ?? "",
          required: true,
          minLength: 2,
          maxLength: 300,
        },
        {
          name: "startsAt",
          label: "Start (your device’s timezone)",
          type: "datetime-local",
          value: row
            ? localDate(row.starts_at)
            : editor?.slot
              ? localDate(editor.slot.startsAt)
              : "",
          required: true,
        },
        {
          name: "endsAt",
          label: "End (your device’s timezone)",
          type: "datetime-local",
          value: row
            ? localDate(row.ends_at)
            : editor?.slot
              ? localDate(editor.slot.endsAt)
              : "",
          required: true,
          hint: "15 minutes to 8 hours, on 15-minute boundaries within resource hours. Capacity is checked when saving.",
        },
        {
          name: "notes",
          label: "Booking notes",
          type: "textarea",
          value: row?.notes ?? "",
          maxLength: 2000,
        },
        ...(can("service.assign_work")
          ? [
              {
                name: "assignedTo",
                label: "Service advisor",
                type: "select" as const,
                value: row?.assigned_to ?? context.user.id,
                options: staff.items
                  .filter((s) => s.permissions.includes("service.write"))
                  .map((s) => ({
                    value: s.userId,
                    label: s.fullName || "Staff member",
                  })),
              },
            ]
          : []),
      ];
  return (
    <>
      <PageHeader
        title="Service appointments"
        description="Manage customer bookings and attendance. Bookings stay local until source integration is connected."
        actions={
          can("service.write") ? (
            <Button onClick={() => setEditor({ kind: "new" })}>
              Book appointment
            </Button>
          ) : undefined
        }
      />
      <LiveServiceDiary
        refresh={diaryRevision}
        onBook={(slot) => setEditor({ kind: "new", slot })}
        onResourcesChanged={workshop.reload}
      />
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="text-sm text-slate-500">
            {resource.data?.visibility === "team"
              ? "Team appointments"
              : "Your appointments"}{" "}
            · Times shown in {site.timezone}
          </p>
          <select
            aria-label="Appointment status"
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
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </Panel>
      <ResourceState resource={resource} />
      <Panel>
        <PanelHeading
          title="Booking register"
          description="Customer details remain available in Customer 360. Confirming a booking does not send a message."
        />
        {resource.data && !resource.data.appointments.length && (
          <EmptyState
            icon="service"
            title="No appointments"
            description="Book a service appointment for an existing customer."
          />
        )}
        <div className="divide-y divide-slate-100">
          {resource.data?.appointments.map((item) => {
            const open = ["booked", "confirmed"].includes(item.status);
            return (
              <article
                key={item.id}
                className="flex flex-col justify-between gap-4 p-5 md:flex-row"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-900">{item.title}</h3>
                    <Badge
                      tone={item.status === "confirmed" ? "green" : "slate"}
                    >
                      {item.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {item.vehicle} ·{" "}
                    {brands.items.find((b) => b.id === item.brand_id)?.name ||
                      "Site brand"}
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {timestamp(item.starts_at, site.timezone)} —{" "}
                    {timestamp(item.ends_at, site.timezone)}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-500">
                    {item.resource_id ? workshop.items.find(r => r.id === item.resource_id)?.name || "Allocated workshop resource" : "Needs workshop resource"}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-500">
                    {item.notes}
                  </p>
                  {item.outcome_note && (
                    <p className="mt-2 text-sm text-slate-600">
                      Outcome: {item.outcome_note}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-slate-400">
                    {item.assigned_to === context.user.id
                      ? "Assigned to you"
                      : "Assigned to team member"}
                  </p>
                  <Link
                    className="mt-3 inline-block text-sm font-semibold text-brand hover:underline"
                    href={`/customers/${item.customer_id}`}
                  >
                    Open customer
                  </Link>
                </div>
                {open && can("service.write") && (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setEditor({ kind: "edit", row: item })}
                    >
                      Edit / reschedule
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setEditor({ kind: "status", row: item })}
                    >
                      Update outcome
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
        <div className="px-5 pb-5">
          <Pager
            page={resource.data?.pagination}
            offset={offset}
            setOffset={setOffset}
          />
        </div>
      </Panel>
      {editor && (
        <ActionDialog
          title={
            statusEditor
              ? "Appointment outcome"
              : row
                ? "Edit appointment"
                : "Book appointment"
          }
          description={
            statusEditor
              ? "Closed appointments are retained for history and cannot be edited."
              : "Changed times return the booking to booked. Reconfirm the new schedule with the customer."
          }
          fields={fields}
          onClose={() => setEditor(null)}
          onSubmit={async (values, key) => {
            if (!statusEditor && (
              customers.loading ||
              brands.loading ||
              staff.loading ||
              workshop.loading
            ))
              throw new Error("Wait for available choices to load.");
            if (!statusEditor && (
              customers.error ||
              brands.error ||
              staff.error ||
              workshop.error
            ))
              throw new Error(
                customers.error ||
                  brands.error ||
                  staff.error ||
                  workshop.error ||
                  "Choices unavailable",
              );
            const body = {
              siteId: site.id,
              ...(row
                ? { version: row.version }
                : { customerId: values.customerId, brandId: values.brandId }),
              ...(statusEditor
                ? {
                    status: values.status,
                    ...(values.status === "confirmed"
                      ? {}
                      : { outcomeNote: values.outcomeNote }),
                  }
                : {
                    title: values.title,
                    vehicle: values.vehicle,
                    notes: values.notes,
                    ...(!row || values.resourceId !== row.resource_id
                      ? { resourceId: values.resourceId }
                      : {}),
                    ...(!row ||
                    localDate(row.starts_at) !== values.startsAt ||
                    localDate(row.ends_at) !== values.endsAt
                      ? {
                          startsAt: new Date(
                            String(values.startsAt),
                          ).toISOString(),
                          endsAt: new Date(String(values.endsAt)).toISOString(),
                        }
                      : {}),
                    ...(can("service.assign_work")
                      ? { assignedTo: values.assignedTo }
                      : {}),
                  }),
            };
            await api(
              row ? `service/appointments/${row.id}` : "service/appointments",
              { method: row ? "PATCH" : "POST", body, ...(row ? {} : { key }) },
            );
            resource.reload();
            setDiaryRevision((value) => value + 1);
          }}
        >
          <Feedback
            error={
              customers.error || brands.error || staff.error || workshop.error
            }
          />
        </ActionDialog>
      )}
    </>
  );
}
