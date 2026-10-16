"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, query } from "@/lib/backend";
import type { Page } from "@/lib/backend-types";
import {
  ActionDialog,
  Feedback,
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
  Panel,
  PanelHeading,
} from "./ui";
import { useWorkspace } from "./workspace-provider";
export type Slot = { resourceId: string; startsAt: string; endsAt: string };
type Resource = {
  id: string;
  name: string;
  active: boolean;
  days: number[];
  open_minute: number;
  close_minute: number;
  version: number;
};
type Queue = {
  day: { date: string; timezone: string };
  pagination: Page;
  totals: { all: number; today: number; overdue: number; unallocated: number };
  appointments: {
    id: string;
    customer_id: string;
    title: string;
    vehicle: string;
    starts_at: string;
    ends_at: string;
    status: string; assigned_to:string; advisorName?:string|null;
    workflowStatus?:string; repairOrderId?:string;
    resource_id?: string;
    resource: { id: string; name: string } | null;
    bucket: string;
    customer: { first_name: string; last_name: string };
  }[];
};
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const clock = (minute: number) =>
  String(Math.floor(minute / 60)).padStart(2, "0") +
  ":" +
  String(minute % 60).padStart(2, "0");
export function AppointmentQueue({
  dailyWork = false,
  selectedDate,
  refresh = 0,
}: {
  dailyWork?: boolean;
  selectedDate?: string;
  refresh?: number;
}) {
  const { site, can } = useWorkspace();
  const [date, setDate] = useState("");
  const [view, setView] = useState("own");
  const [bucket, setBucket] = useState("all");
  const [offset, setOffset] = useState(0);
  const [range,setRange]=useState("day");
  const [advisorId,setAdvisorId]=useState("");
  const resource = useResource<Queue>(
    `service/${dailyWork ? "my-day" : "diary"}?${query({
      siteId: site.id,
      range: dailyWork?undefined:range,
      advisorId:!dailyWork&&view==="team"?advisorId||undefined:undefined,
      date: selectedDate || date || undefined,
      view: can("service.view_team") ? view : "own",
      bucket: dailyWork ? bucket : undefined,
      offset,
      limit: 20,
    })}`,
    15000,
  );
  const reload = resource.reload;
  useEffect(() => {
    if (refresh) reload();
  }, [refresh, reload]);
  return (
    <Panel className="mb-6">
      <PanelHeading
        title={
          dailyWork ? "Service appointments in My Day" : "Service diary"
        }
        description={
          dailyWork
            ? "Open appointments through the selected day. Counts are separate from follow-ups; Service team access is checked independently."
            : "Appointments in the selected site-local day or Monday-to-Sunday week, including unallocated bookings."
        }
      />
      <div className="grid gap-4 p-5 sm:grid-cols-3">
        {!selectedDate && (
          <label className="text-sm font-semibold">
            Site-local date
            <input
              type="date"
              className={inputClass}
              value={date || resource.data?.day.date || ""}
              onChange={(e) => {
                setDate(e.target.value);
                setOffset(0);
              }}
            />
          </label>
        )}
        <label className="text-sm font-semibold">
          Appointments
          <select
            className={inputClass}
            value={can("service.view_team") ? view : "own"}
            onChange={(e) => {
              setView(e.target.value);
              setOffset(0);
            }}
          >
            <option value="own">My appointments</option>
            {can("service.view_team") && (
              <option value="team">Team appointments</option>
            )}
          </select>
        </label>
        {!dailyWork&&view==='team'&&can('service.view_team')&&<label className="text-sm font-semibold">Advisor<select className={inputClass} value={advisorId} onChange={e=>{setAdvisorId(e.target.value);setOffset(0);}}><option value="">All permitted advisors</option>{Array.from(new Map(resource.data?.appointments.map(a=>[a.assigned_to,a.advisorName??`Advisor ${a.assigned_to.slice(0,8)}`])??[])).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>}
        {!dailyWork&&<label className="text-sm font-semibold">Diary range<select className={inputClass} value={range} onChange={e=>{setRange(e.target.value);setOffset(0);}}><option value="day">Selected day</option><option value="week">Selected week</option></select></label>}
        {dailyWork && (
          <label className="text-sm font-semibold">
            Show
            <select
              className={inputClass}
              value={bucket}
              onChange={(e) => {
                setBucket(e.target.value);
                setOffset(0);
              }}
            >
              <option value="all">All open appointments</option>
              <option value="today">Selected day</option>
              <option value="overdue">Unresolved earlier appointments</option>
            </select>
          </label>
        )}
        <Button variant="secondary" onClick={resource.reload}>
          Refresh appointments
        </Button>
      </div>
      <ResourceState resource={resource} />
      {resource.data && (
        <div className="mx-5 mb-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Appointments", resource.data.totals.all],
            [dailyWork?"On selected day":"In selected range", resource.data.totals.today],
            [
              dailyWork ? "Unresolved earlier" : "Unallocated",
              dailyWork
                ? resource.data.totals.overdue
                : resource.data.totals.unallocated,
            ],
          ].map(([name, count]) => (
            <div
              key={name}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-xs text-slate-500">{name}</p>
              <p className="mt-1 text-2xl font-bold">{count}</p>
            </div>
          ))}
        </div>
      )}
      {resource.data && !resource.data.appointments.length && (
        <EmptyState
          icon="service"
          title="No matching appointments"
          description="Choose another date or queue."
        />
      )}
      <div className="divide-y divide-slate-100">
        {resource.data?.appointments.map((a) => (
          <article key={a.id} className="p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-bold">{a.title}</h3>{a.advisorName&&<span className="text-xs text-slate-500">{a.advisorName}</span>}
              <Badge tone={a.status === "confirmed" ? "green" : "slate"}>
                {(a.workflowStatus??a.status).replaceAll("_", " ")}
              </Badge>
              {!a.resource_id && <Badge tone="amber">Needs resource</Badge>}
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {a.customer.first_name} {a.customer.last_name} · {a.vehicle}
            </p>
            <p className="mt-2 text-sm text-slate-500">{a.resource?.name || "No workshop resource allocated"}</p>
            <p className="mt-2 text-sm">
              {timestamp(a.starts_at, site.timezone)} —{" "}
              {timestamp(a.ends_at, site.timezone)}
            </p>
            <div className="mt-3 flex gap-4 text-sm font-semibold text-brand">
              <Link href={`/customers/${a.customer_id}`}>Customer profile</Link>
              <Link href="/service">Manage booking</Link>
            </div>
          </article>
        ))}
      </div>
      <div className="p-5">
        <Pager
          page={resource.data?.pagination}
          offset={offset}
          setOffset={setOffset}
        />
      </div>
    </Panel>
  );
}
export function LiveServiceDiary({
  onBook,
  onResourcesChanged,
  refresh = 0,
}: {
  onBook: (slot: Slot) => void;
  onResourcesChanged?: () => void;
  refresh?: number;
}) {
  const { site, can } = useWorkspace();
  const [resourceId, setResourceId] = useState("");
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState("60");
  const [offset, setOffset] = useState(0);
  const [editor, setEditor] = useState<Resource | "new" | null>(null);
  const resources = useDirectory<Resource>(
    `service/resources?siteId=${site.id}`,
    "resources",
  );
  const available = useResource<{
    day: { date: string };
    slots: { startsAt: string; endsAt: string }[];
    totalSlots: number;
    pagination: Page;
  }>(
    resourceId
      ? `service/availability?${query({ siteId: site.id, resourceId, date: date || undefined, durationMinutes: duration, offset, limit: 20 })}`
      : null,
  );
  const row = editor && editor !== "new" ? editor : undefined;
  const reloadAvailability = available.reload;
  useEffect(() => {
    if (refresh) reloadAvailability();
  }, [refresh, reloadAvailability]);
  const fields: Field[] = [
    {
      name: "name",
      label: "Resource / bay name",
      value: row?.name ?? "",
      required: true,
      minLength: 2,
      maxLength: 100,
    },
    {
      name: "days",
      label: "Opening weekdays",
      value: (row?.days ?? [1, 2, 3, 4, 5]).join(","),
      required: true,
      hint: "Comma-separated: Sunday=0, Monday=1, … Saturday=6.",
    },
    {
      name: "openMinute",
      label: "Opening time",
      type: "select",
      value: String(row?.open_minute ?? 480),
      options: Array.from({ length: 96 }, (_, i) => ({
        value: String(i * 15),
        label: clock(i * 15),
      })),
    },
    {
      name: "closeMinute",
      label: "Closing time",
      type: "select",
      value: String(row?.close_minute ?? 1020),
      options: Array.from({ length: 96 }, (_, i) => ({
        value: String((i + 1) * 15),
        label: clock((i + 1) * 15),
      })),
    },
    ...(row
      ? [
          {
            name: "active",
            label: "Available for bookings",
            type: "checkbox" as const,
            value: row.active,
          },
        ]
      : []),
  ];
  return (
    <>
      <AppointmentQueue refresh={refresh} />
      <Panel className="mb-6">
        <PanelHeading
          title="Workshop resources"
          description="Each resource accepts one appointment at a time. Hours use the site's timezone. Changes cannot invalidate existing active bookings."
        />
        <Feedback error={resources.error} />
        <div className="grid gap-3 p-5 md:grid-cols-3">
          {resources.items.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex justify-between gap-2">
                <h3 className="font-bold">{r.name}</h3>
                <Badge tone={r.active ? "green" : "slate"}>
                  {r.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {r.days.map((d) => weekdays[d]).join(", ")} ·{" "}
                {clock(r.open_minute)}–{clock(r.close_minute)}
              </p>
              {can("service.resources_manage") && (
                <Button
                  variant="secondary"
                  className="mt-3"
                  onClick={() => setEditor(r)}
                >
                  Edit resource
                </Button>
              )}
            </div>
          ))}
        </div>
        {can("service.resources_manage") && (
          <div className="px-5 pb-5">
            <Button onClick={() => setEditor("new")}>
              Add workshop resource
            </Button>
          </div>
        )}
        {!resources.loading && !resources.items.length && (
          <EmptyState
            icon="service"
            title="Set up workshop resources"
            description="An administrator needs to add a bay before new appointments can be booked."
          />
        )}
      </Panel>
      <Panel className="mb-6">
        <PanelHeading
          title="Available slots"
          description="Availability includes all bookings using this resource. Booking rechecks capacity; a displayed slot is not held."
        />
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <label className="text-sm font-semibold">
            Resource
            <select
              className={inputClass}
              value={resourceId}
              onChange={(e) => {
                setResourceId(e.target.value);
                setOffset(0);
              }}
            >
              <option value="">Choose a resource</option>
              {resources.items
                .filter((r) => r.active)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Site-local date
            <input
              type="date"
              className={inputClass}
              value={date || available.data?.day.date || ""}
              onChange={(e) => {
                setDate(e.target.value);
                setOffset(0);
              }}
            />
          </label>
          <label className="text-sm font-semibold">
            Duration
            <select
              className={inputClass}
              value={duration}
              onChange={(e) => {
                setDuration(e.target.value);
                setOffset(0);
              }}
            >
              {[15, 30, 45, 60, 90, 120, 180, 240, 480].map((n) => (
                <option key={n} value={n}>
                  {n} minutes
                </option>
              ))}
            </select>
          </label>
        </div>
        <ResourceState resource={available} />
        {available.data && !available.data.slots.length && (
          <EmptyState
            icon="clock"
            title="No available slots"
            description="Choose another date, resource or duration."
          />
        )}
        <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-3">
          {available.data?.slots.map((slot) => (
            <div
              key={slot.startsAt}
              className="rounded-xl border border-slate-200 p-4"
            >
              <p className="text-sm font-semibold">
                {timestamp(slot.startsAt, site.timezone)} —{" "}
                {timestamp(slot.endsAt, site.timezone)}
              </p>
              {can("service.write") && (
                <Button
                  variant="secondary"
                  className="mt-3"
                  onClick={() => onBook({ ...slot, resourceId })}
                >
                  Book this slot
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className="px-5 pb-5">
          <Pager
            page={available.data?.pagination}
            offset={offset}
            setOffset={setOffset}
          />
        </div>
      </Panel>
      {editor && (
        <ActionDialog
          title={row ? "Edit workshop resource" : "Add workshop resource"}
          description="Each resource has capacity for one appointment. Reschedule affected bookings before narrowing hours or deactivating."
          fields={fields}
          onClose={() => setEditor(null)}
          onSubmit={async (values, key) => {
            if (!/^\d(?:,\s*\d)*$/.test(String(values.days).trim()))
              throw new Error("Enter comma-separated weekday numbers.");
            await api(
              row ? `service/resources/${row.id}` : "service/resources",
              {
                method: row ? "PATCH" : "POST",
                body: {
                  siteId: site.id,
                  name: values.name,
                  days: String(values.days).split(",").map(Number),
                  openMinute: Number(values.openMinute),
                  closeMinute: Number(values.closeMinute),
                  ...(row
                    ? { version: row.version, active: values.active }
                    : {}),
                },
                ...(row ? {} : { key }),
              },
            );
            resources.reload();
            onResourcesChanged?.();
            available.reload();
          }}
        />
      )}
    </>
  );
}
