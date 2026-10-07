"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import {
  customers,
  initialTasks,
  pipelineStages,
  serviceAppointments,
} from "@/lib/demo-data";
import type { Customer, LeadStage, Task, Tone } from "@/lib/crm-types";
import {
  Avatar,
  Badge,
  Button,
  CustomerLink,
  EmptyState,
  FormField,
  Icon,
  inputClass,
  Modal,
  ModalForm,
  PageHeader,
  Panel,
  PanelHeading,
  SearchInput,
  StatCard,
} from "./ui";
import { useWorkspaceRole } from "./app-shell";

const stageTone: Record<LeadStage, Tone> = {
  "New enquiry": "blue",
  Contacted: "amber",
  Appointment: "violet",
  Appraisal: "amber",
  Quote: "blue",
  Order: "green",
  "Awaiting delivery": "amber",
  Delivered: "green",
};

function AddLeadModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: (customer: Customer) => void;
}) {
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const first = String(form.get("first")).trim();
    const last = String(form.get("last")).trim();
    const email = String(form.get("email")).trim();
    const phone = String(form.get("phone")).trim();
    if (!first || !last)
      return setError("Enter the customer’s first and last name.");
    if (!email && !phone)
      return setError("Add an email address or phone number.");
    onAdded({
      id: `C-${Date.now()}`,
      name: `${first} ${last}`,
      initials: `${first[0]}${last[0]}`.toUpperCase(),
      email,
      phone,
      location: String(form.get("site")),
      owner: "Maya Chen",
      stage: "New enquiry",
      interest: String(form.get("interest")) || "Not yet captured",
      lastContact: "Just now",
      nextAction: "Make first contact",
      source: "Pentana",
      consent: "Review needed",
    });
    setError("");
    onClose();
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a new lead"
      description="Create the enquiry in Pentana on first real contact and open the shared customer thread."
    >
      <ModalForm onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First name">
            <input
              name="first"
              className={inputClass}
              maxLength={80}
              autoFocus
            />
          </FormField>
          <FormField label="Last name">
            <input name="last" className={inputClass} maxLength={80} />
          </FormField>
        </div>
        <FormField label="Email address">
          <input
            name="email"
            type="email"
            className={inputClass}
            placeholder="customer@example.com"
          />
        </FormField>
        <FormField label="Phone number">
          <input
            name="phone"
            type="tel"
            className={inputClass}
            placeholder="04xx xxx xxx"
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Vehicle interest">
            <input
              name="interest"
              className={inputClass}
              placeholder="Make, model or stock no."
            />
          </FormField>
          <FormField label="Showroom">
            <select name="site" className={inputClass}>
              <option>Parramatta</option>
              <option>North Sydney</option>
              <option>Chatswood</option>
            </select>
          </FormField>
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            <Icon name="plus" className="h-4 w-4" />
            Create lead
          </Button>
        </div>
      </ModalForm>
    </Modal>
  );
}

function TaskModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: (task: Task) => void;
}) {
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title")).trim();
    if (title.length < 3)
      return setError("Describe the follow-up in at least 3 characters.");
    const customer = String(form.get("customer"));
    const selected = customers.find((c) => c.id === customer)!;
    onAdded({
      id: `T-${Date.now()}`,
      customerId: selected.id,
      customer: selected.name,
      title,
      due: "Today",
      time: String(form.get("time")),
      priority: String(form.get("priority")) as "High" | "Normal",
      type: String(form.get("type")) as Task["type"],
    });
    setError("");
    onClose();
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Plan a follow-up"
      description="Add a clear next action to My Day."
    >
      <ModalForm onSubmit={submit}>
        <FormField label="Customer">
          <select name="customer" className={inputClass}>
            {customers.map((c) => (
              <option value={c.id} key={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="What needs to happen?">
          <input
            name="title"
            className={inputClass}
            placeholder="e.g. Confirm Saturday test drive"
            autoFocus
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Time">
            <input
              name="time"
              type="time"
              defaultValue="14:00"
              className={inputClass}
            />
          </FormField>
          <FormField label="Type">
            <select name="type" className={inputClass}>
              <option>Call</option>
              <option>Email</option>
              <option>Appointment</option>
              <option>Internal</option>
            </select>
          </FormField>
          <FormField label="Priority">
            <select name="priority" className={inputClass}>
              <option>Normal</option>
              <option>High</option>
            </select>
          </FormField>
        </div>
        {error && (
          <p role="alert" className="text-sm font-medium text-rose-600">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add follow-up</Button>
        </div>
      </ModalForm>
    </Modal>
  );
}

function ServiceDashboard() {
  return (
    <>
      <PageHeader
        eyebrow="Wednesday, 7 October · Service"
        title="My Day"
        description="Today’s diary, repair-order promises, collections and handover work across Parramatta."
        actions={
          <Link
            href="/service"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-bold text-white shadow-sm hover:bg-brand-dark"
          >
            Open service desk <Icon name="chevron" className="h-4 w-4" />
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Appointments"
          value="16"
          detail="4 shown in priority queue"
          icon="clock"
        />
        <StatCard
          label="Updates due"
          value="5"
          detail="2 before midday"
          icon="phone"
          tone="amber"
        />
        <StatCard
          label="Ready to collect"
          value="3"
          detail="Live Pentana status"
          icon="car"
          tone="green"
        />
        <StatCard
          label="Write exceptions"
          value="2"
          detail="1 capacity rejection"
          icon="warning"
          tone="red"
        />
      </div>
      <Link href="/deliveries" className="mt-5 flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center"><span><strong className="text-sm text-red-900">Sales-to-Service handover</strong><span className="mt-1 block text-sm text-red-700">Sophie Martin delivers tomorrow: PDI complete, first-service booking still required.</span></span><span className="inline-flex items-center gap-1 text-sm font-bold text-brand">Open handover lane <Icon name="chevron" className="h-4 w-4" /></span></Link>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.75fr]">
        <Panel>
          <PanelHeading
            title="Today’s priority queue"
            description="Live appointments and repair-order work with customer promises in one queue."
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Customer & vehicle</th>
                  <th className="px-5 py-3">Pentana status</th>
                  <th className="px-5 py-3">Next customer action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {serviceAppointments.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 text-sm font-black text-slate-900">
                      {item.time}
                    </td>
                    <td className="px-5 py-4">
                      <strong className="block text-sm text-slate-900">
                        {item.customer}
                      </strong>
                      <span className="text-xs text-slate-500">
                        {item.vehicle}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        tone={
                          item.pentanaStatus === "Ready for collection"
                            ? "green"
                            : item.pentanaStatus === "No show"
                              ? "red"
                              : "blue"
                        }
                      >
                        {item.pentanaStatus}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.localTask}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="space-y-5">
          <Panel>
            <PanelHeading title="Service alerts" />
            <div className="space-y-3 p-5">
              <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-3">
                <strong className="text-sm text-red-900">
                  1 no-show follow-up
                </strong>
                <p className="mt-1 text-xs text-red-700">
                  Contact the customer before 12:00 pm.
                </p>
              </div>
              <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-3">
                <strong className="text-sm text-amber-900">
                  2 updates promised
                </strong>
                <p className="mt-1 text-xs text-amber-700">
                  Diagnosis updates are due this morning.
                </p>
              </div>
            </div>
          </Panel>
          <Panel className="bg-[#10182b] text-white">
            <div className="p-5">
              <p className="text-xs font-black uppercase tracking-wider text-red-400">
                Pentana connection
              </p>
              <strong className="mt-3 block">Live sync healthy</strong>
              <p className="mt-1 text-sm text-slate-400">
                Allowed booking and repair-order status changes write back and are audited.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

export function DashboardView() {
  const role = useWorkspaceRole();
  const [tasks, setTasks] = useState(initialTasks);
  const [taskOpen, setTaskOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const openTasks = tasks.filter((t) => !t.completed);
  const complete = (id: string) => {
    setTasks((all) =>
      all.map((t) => (t.id === id ? { ...t, completed: true } : t)),
    );
    setNotice("Follow-up completed. Nice work.");
    setTimeout(() => setNotice(""), 2500);
  };
  if (role === "Service") return <ServiceDashboard />;
  return (
    <>
      <PageHeader
        eyebrow="Wednesday, 7 October"
        title={role === "Admin" ? "Group day at a glance" : "My Day"}
        description={role === "Admin" ? "Open deals, repair orders, unanswered customers and handover risk across authorised sites." : "Appointments, promised contacts, deliveries and work queues in time order for Parramatta."}
        actions={
          <>
            <Button variant="secondary" onClick={() => setTaskOpen(true)}>
              <Icon name="clock" className="h-4 w-4" />
              Add follow-up
            </Button>
            <Button onClick={() => setLeadOpen(true)}>
              <Icon name="plus" className="h-4 w-4" />
              New lead
            </Button>
          </>
        }
      />
      {notice && (
        <div
          role="status"
          className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
        >
          <Icon name="check" className="h-4 w-4" />
          {notice}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Follow-ups due"
          value={openTasks.length}
          detail="4 before 3:00 pm"
          icon="clock"
        />
        <StatCard
          label="Overdue"
          value="3"
          detail="Oldest is 2 days"
          icon="warning"
          tone="red"
        />
        <StatCard
          label="Unactioned enquiries"
          value="12"
          detail="3 need assignment"
          icon="leads"
          tone="blue"
        />
        <StatCard
          label="Handover risk"
          value="3"
          detail="PDI or first service missing"
          icon="delivery"
          tone="amber"
        />
      </div>
      <Panel className="mt-5 overflow-hidden">
        <PanelHeading title="Today’s run sheet" description="One click opens the shared customer thread—no second search required." />
        <div className="grid divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0">
          {[
            ["10:30 am", "Olivia Bennett", "Promised call · confirm test drive", "/customers/C-1048"],
            ["2:30 pm", "Henry Young", "Service collection · vehicle ready", "/customers/C-1048"],
            ["4:30 pm", "Sophie Martin", "Handover · PDI and first service check", "/customers/C-1018"],
          ].map(([time, customer, action, href]) => <Link href={href} key={`${time}-${customer}`} className="flex gap-3 p-4 hover:bg-red-50"><span className="shrink-0 text-xs font-black text-brand">{time}</span><span className="min-w-0"><strong className="block text-sm text-slate-900">{customer}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{action}</span></span></Link>)}
        </div>
      </Panel>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_.85fr]">
        <Panel>
          <PanelHeading
            title="Today’s follow-ups"
            description="Your next actions, ordered by urgency."
            action={
              <Link
                href="/leads"
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
              >
                View all leads
              </Link>
            }
          />
          <div className="divide-y divide-slate-100">
            {openTasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
              >
                <button
                  onClick={() => complete(task.id)}
                  aria-label={`Complete ${task.title}`}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-slate-300 text-transparent transition hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <Icon name="check" className="h-3.5 w-3.5" />
                </button>
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm text-slate-900">
                    {task.title}
                  </strong>
                  <Link
                    href={`/customers/${task.customerId}`}
                    className="mt-1 inline-block text-sm text-slate-500 hover:text-emerald-700"
                  >
                    {task.customer}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    tone={
                      task.due === "Overdue"
                        ? "red"
                        : task.priority === "High"
                          ? "amber"
                          : "slate"
                    }
                  >
                    {task.due === "Overdue" ? "Overdue" : task.time}
                  </Badge>
                  <Badge>{task.type}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <div className="space-y-5">
          <Panel>
            <PanelHeading
              title="Lead pulse"
              description="Where attention is needed."
            />
            <div className="space-y-4 p-5">
              {[
                {
                  label: "Unassigned leads",
                  value: 3,
                  width: "25%",
                  tone: "bg-rose-500",
                },
                {
                  label: "No contact in 48h",
                  value: 5,
                  width: "42%",
                  tone: "bg-amber-500",
                },
                {
                  label: "Waiting on customer",
                  value: 8,
                  width: "67%",
                  tone: "bg-sky-500",
                },
              ].map((row) => (
                <div key={row.label}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-600">{row.label}</span>
                    <strong className="text-slate-900">{row.value}</strong>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${row.tone}`}
                      style={{ width: row.width }}
                    />
                  </div>
                </div>
              ))}
              <Link
                href="/pipeline"
                className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <span>Review team pipeline</span>
                <Icon name="chevron" className="h-4 w-4" />
              </Link>
            </div>
          </Panel>
          <Panel className="overflow-hidden bg-[#10182b] text-white">
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Pentana connection
              </p>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <strong className="text-lg">Live sync healthy</strong>
                  <p className="mt-1 text-sm text-emerald-100/80">
                    Customer, stock and deal records
                  </p>
                </div>
                <Icon name="refresh" className="h-7 w-7 text-emerald-200" />
              </div>
              {role === "Admin" ? (
                <Link
                  href="/sync"
                  className="mt-5 inline-flex text-sm font-bold text-white underline decoration-red-400 underline-offset-4"
                >
                  Review sync operations
                </Link>
              ) : (
                <p className="mt-5 text-xs text-emerald-100/70">
                  Sync failures are managed by Admin.
                </p>
              )}
            </div>
          </Panel>
        </div>
      </div>
      <TaskModal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        onAdded={(task) => {
          setTasks((all) => [task, ...all]);
          setNotice("Follow-up added to My Day.");
        }}
      />
      <AddLeadModal
        open={leadOpen}
        onClose={() => setLeadOpen(false)}
        onAdded={() => setNotice("New lead created and assigned to you.")}
      />
    </>
  );
}

export function LeadsView() {
  const [list, setList] = useState(customers);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("All stages");
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const filtered = list.filter(
    (c) =>
      (stage === "All stages" || c.stage === stage) &&
      `${c.name} ${c.email} ${c.interest}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        eyebrow="Sales desk"
        title="Leads"
        description="Capture, match and assign enquiries that create or update the Pentana customer and deal record."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Icon name="plus" className="h-4 w-4" />
            New lead
          </Button>
        }
      />
      {notice && (
        <div
          role="status"
          className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
        >
          {notice}
        </div>
      )}
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Open leads"
          value="29"
          detail="Across your authorised sites"
          icon="leads"
        />
        <StatCard
          label="Needs first contact"
          value="7"
          detail="3 are unassigned"
          icon="phone"
          tone="amber"
        />
        <StatCard
          label="Overdue next steps"
          value="5"
          detail="Admin review recommended"
          icon="warning"
          tone="red"
        />
      </div>
      <Panel>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name, contact or vehicle"
          />
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className={`${inputClass} sm:w-48`}
          >
            <option>All stages</option>
            {pipelineStages.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <Button variant="secondary">
            <Icon name="filter" className="h-4 w-4" />
            More filters
          </Button>
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            title="No leads match these filters"
            description="Clear a filter or search with a different name, contact detail or vehicle."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Deal stage</th>
                  <th className="px-5 py-3">Vehicle interest</th>
                  <th className="px-5 py-3">Owner</th>
                  <th className="px-5 py-3">Next action</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4">
                      <CustomerLink
                        id={c.id}
                        name={c.name}
                        initials={c.initials}
                        sub={`${c.source} · ${c.lastContact}`}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={stageTone[c.stage]}>{c.stage}</Badge>
                    </td>
                    <td className="max-w-[220px] px-5 py-4 text-sm text-slate-600">
                      {c.interest}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {c.owner}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-800">
                        {c.nextAction}
                      </p>
                      <span className="text-xs text-slate-500">Due today</span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/customers/${c.id}`}
                        className="inline-flex rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        aria-label={`Open ${c.name}`}
                      >
                        <Icon name="chevron" className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <AddLeadModal
        open={open}
        onClose={() => setOpen(false)}
        onAdded={(customer) => {
          setList((all) => [customer, ...all]);
          setNotice(`${customer.name} was created and assigned to you.`);
        }}
      />
    </>
  );
}

export function CustomersView() {
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("All sources");
  const [open, setOpen] = useState(false);
  const [list, setList] = useState(customers);
  const filtered = useMemo(
    () =>
      list.filter(
        (c) =>
          (source === "All sources" || c.source === source) &&
          `${c.name} ${c.email} ${c.phone} ${c.pentanaId}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [list, search, source],
  );
  return (
    <>
      <PageHeader
        eyebrow="Customer book"
        title="Customers"
        description="One shared Pentana-backed customer identity, vehicle history and Sales-and-Service thread."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Icon name="plus" className="h-4 w-4" />
            Add customer
          </Button>
        }
      />
      <Panel>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name, phone, email or external ID"
          />
          <select
            className={`${inputClass} sm:w-48`}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option>All sources</option>
            <option>Pentana</option>
            <option>Website</option>
            <option>Phone</option>
            <option>Email</option>
          </select>
          <Button variant="secondary">
            <Icon name="filter" className="h-4 w-4" />
            Filters
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Owner</th>
                <th className="px-5 py-3">Deal stage</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <CustomerLink
                      id={c.id}
                      name={c.name}
                      initials={c.initials}
                      sub={`Internal ID ${c.id}${c.pentanaId ? ` · Pentana ${c.pentanaId}` : ""}`}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <span className="block text-sm text-slate-700">
                      {c.email}
                    </span>
                    <span className="text-xs text-slate-500">{c.phone}</span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      tone={c.source === "Pentana" ? "blue" : "slate"}
                    >
                      {c.source}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {c.owner}
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={stageTone[c.stage]}>{c.stage}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/customers/${c.id}`}
                      className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                    >
                      View profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <EmptyState
            title="No customers found"
            description="Try a different search term or remove the source filter."
          />
        )}
      </Panel>
      <AddLeadModal
        open={open}
        onClose={() => setOpen(false)}
        onAdded={(customer) => setList((all) => [customer, ...all])}
      />
    </>
  );
}

export function PipelineView() {
  const [cards, setCards] = useState(customers);
  const [notice, setNotice] = useState("");
  function advance(customer: Customer) {
    const index = pipelineStages.indexOf(customer.stage);
    if (index === pipelineStages.length - 1) return;
    const next = pipelineStages[index + 1];
    setCards((all) =>
      all.map((c) => (c.id === customer.id ? { ...c, stage: next } : c)),
    );
    setNotice(
      `${customer.name} moved to ${next}. Pentana accepted the stage and activity write-back.`,
    );
    setTimeout(() => setNotice(""), 3000);
  }
  return (
    <>
      <PageHeader
        eyebrow="Sales workspace"
        title="Sales pipeline"
        description="Move deals through Pentana-mapped stages. Every move requires a thread activity and waits for Pentana acceptance."
        actions={
          <Button variant="secondary">
            <Icon name="filter" className="h-4 w-4" />
            Filter pipeline
          </Button>
        }
      />
      {notice && (
        <div
          role="status"
          className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"
        >
          <Icon name="warning" className="h-4 w-4" />
          {notice}
        </div>
      )}
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
        <Icon name="refresh" className="h-4 w-4 shrink-0" />
        Pentana owns deal status and commercial totals. Good Showroom sends audited stage commands and shows any rejection.
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipelineStages.map((stage) => {
          const stageCustomers = cards.filter((c) => c.stage === stage);
          return (
            <section key={stage} className="w-[285px] shrink-0">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${stage === "New enquiry" ? "bg-sky-500" : stage === "Contacted" ? "bg-amber-500" : stage === "Appointment" ? "bg-violet-500" : "bg-brand"}`}
                  />
                  <h2 className="font-bold text-slate-800">{stage}</h2>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {stageCustomers.length}
                </span>
              </div>
              <div className="space-y-3 rounded-xl bg-slate-200/55 p-2.5">
                {stageCustomers.map((c) => (
                  <article
                    key={c.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <CustomerLink
                        id={c.id}
                        name={c.name}
                        initials={c.initials}
                        sub={c.location}
                      />
                      <button
                        onClick={() => setNotice(`${c.name}: ${c.nextAction}`)}
                        className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
                        aria-label={`Show next action for ${c.name}`}
                      >
                        <Icon name="more" className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-800">
                      {c.interest}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-xs"><div><span className="text-slate-400">Price summary</span><strong className="mt-1 block text-slate-700">From Pentana</strong></div><div><span className="text-slate-400">Trade</span><strong className="mt-1 block text-slate-700">{c.stage === "Appraisal" ? "In review" : "None"}</strong></div><div><span className="text-slate-400">Salesperson</span><strong className="mt-1 block text-slate-700">{c.owner}</strong></div><div><span className="text-slate-400">Expected delivery</span><strong className="mt-1 block text-slate-700">{c.stage === "Awaiting delivery" ? "8 Oct" : "—"}</strong></div></div>
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <p className="text-xs text-slate-400">NEXT ACTION</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {c.nextAction}
                      </p>
                    </div>
                    {stage !== "Delivered" && (
                      <button
                        onClick={() => advance(c)}
                        className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-slate-50 py-2 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
                      >
                        {c.stage === "Appointment" ? "Request appraisal" : c.stage === "Appraisal" ? "Record result & quote" : "Log activity & move"}{" "}
                        <Icon name="chevron" className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </article>
                ))}
                {stageCustomers.length === 0 && (
                  <div className="grid h-32 place-items-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
                    No leads
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

export function CustomerDetailView({ id }: { id: string }) {
  const customer = customers.find((item) => item.id === id) ?? customers[0];
  const [tab, setTab] = useState<"all" | "sales" | "service" | "messages" | "tasks" | "vehicles" | "audit">("all");
  const [noteOpen, setNoteOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [channel, setChannel] = useState<"SMS" | "Email" | "Call outcome">("SMS");
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState([
    {
      id: 1,
      author: "Maya Chen",
      time: "Today, 9:42 am",
      text: "Olivia is comparing the CX-5 Akera with a RAV4 Cruiser. Prefers Saturday morning for the test drive and wants the trade-in inspected at the same time.",
    },
  ]);
  function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("note")).trim();
    if (!value) return;
    setNotes((all) => [
      { id: Date.now(), author: "Maya Chen", time: "Just now", text: value },
      ...all,
    ]);
    setNoteOpen(false);
    setNotice("Internal note saved and the activity write-back was accepted by Pentana.");
  }
  return (
    <>
      <div className="mb-5">
        <Link
          href="/customers"
          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-emerald-700"
        >
          <Icon name="chevron" className="h-4 w-4 rotate-180" />
          Back to customers
        </Link>
      </div>
      <Panel className="overflow-hidden">
        <div className="border-b border-slate-200 bg-gradient-to-r from-brand-dark to-brand px-5 py-6 text-white sm:px-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <Avatar initials={customer.initials} size="lg" tone="green" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-serif text-3xl font-semibold">
                    {customer.name}
                  </h1>
                  <Badge tone="green">{customer.stage}</Badge>
                </div>
                <p className="mt-1 text-sm text-emerald-100">
                  Internal ID {customer.id}
                  {customer.pentanaId && ` · Pentana ID ${customer.pentanaId}`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setNoteOpen(true)}>
                <Icon name="plus" className="h-4 w-4" />
                Add note
              </Button>
              <Button
                className="bg-white text-emerald-900 hover:bg-emerald-50"
                onClick={() => setTaskOpen(true)}
              >
                <Icon name="clock" className="h-4 w-4" />
                Follow-up
              </Button>
            </div>
          </div>
        </div>
        <div className="grid divide-y divide-slate-100 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          {[
            { label: "Owner", value: customer.owner },
            { label: "Contact", value: customer.phone },
            { label: "Vehicle interest", value: customer.interest },
            { label: "Last activity", value: customer.lastContact },
          ].map((item) => (
            <div key={item.label} className="px-5 py-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {item.label}
              </span>
              <strong className="mt-1 block text-sm text-slate-800">
                {item.value}
              </strong>
            </div>
          ))}
        </div>
      </Panel>
      {notice && (
        <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {notice}
        </div>
      )}
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-4 flex overflow-x-auto border-b border-slate-200">
            {(["all", "sales", "service", "messages", "tasks"] as const).map(
              (item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold capitalize ${tab === item ? "border-emerald-700 text-emerald-800" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                >
                  {item}
                </button>
              ),
            )}
          </div>
          {tab !== "tasks" && tab !== "vehicles" && tab !== "audit" && (
            <Panel>
              <PanelHeading
                title={tab === "all" ? "Unified customer thread" : `${tab[0].toUpperCase()}${tab.slice(1)} events`}
                description="Sales, Service, messages, tasks and Pentana events in one audited timeline."
              />
              <div className="p-5">
                <div className="space-y-6 border-l-2 border-slate-100 pl-6">
                  {notes.map((note) => (
                    <div key={note.id} className="relative">
                      <span className="absolute -left-[31px] top-1 grid h-4 w-4 place-items-center rounded-full border-2 border-white bg-emerald-500" />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-sm text-slate-900">
                          Internal note · {note.author}
                        </strong>
                        <span className="text-xs text-slate-400">
                          {note.time}
                        </span>
                      </div>
                      <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                        {note.text}
                      </p>
                    </div>
                  ))}
                  <div className="relative">
                    <span className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-white bg-sky-500" />
                    <div className="flex justify-between gap-2">
                      <strong className="text-sm text-slate-900">
                        Email logged
                      </strong>
                      <span className="text-xs text-slate-400">
                        Yesterday, 3:18 pm
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      Vehicle options and brochure sent by Maya after consent was checked.
                    </p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-white bg-amber-500" />
                    <div className="flex justify-between gap-2">
                      <strong className="text-sm text-slate-900">
                        Deal stage changed
                      </strong>
                      <span className="text-xs text-slate-400">
                        Monday, 10:22 am
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      Appraisal → Quote by Maya Chen. Pentana accepted the update.
                    </p>
                  </div>
                </div>
              </div>
              <form className="border-t border-slate-100 p-4 sm:p-5" onSubmit={(event) => { event.preventDefault(); if (!message.trim() || customer.consent === "Do not contact") return; setNotice(`${channel} sent after privacy check and logged against the Pentana activity.`); setMessage(""); }}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="flex gap-2">{(["SMS", "Email", "Call outcome"] as const).map((item) => <button type="button" key={item} onClick={() => setChannel(item)} className={`rounded-lg px-3 py-2 text-xs font-bold ${channel === item ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`}>{item}</button>)}</div><Button type="button" variant="secondary" className="px-3" onClick={() => setMessage("Hi Olivia, I’ve checked the latest update and your Saturday test drive is ready to confirm. Would 10:30 am suit?")}>AI draft</Button></div>
                <textarea value={message} onChange={(event) => setMessage(event.target.value)} disabled={customer.consent === "Do not contact"} className={`${inputClass} min-h-28 py-3 disabled:bg-slate-100`} placeholder={channel === "Call outcome" ? "Log the call outcome and next promise" : `Write a customer-visible ${channel} message`} />
                <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><p className={`text-xs ${customer.consent === "Do not contact" ? "font-bold text-red-700" : "text-slate-500"}`}>{customer.consent === "Do not contact" ? "Messaging blocked by the Pentana do-not-contact flag." : "Privacy checked · A person must review and send every AI draft."}</p><Button type="submit" disabled={!message.trim() || customer.consent === "Do not contact"}>{channel === "Call outcome" ? "Log outcome" : `Send ${channel}`}</Button></div>
              </form>
            </Panel>
          )}
          {tab === "tasks" && (
            <Panel>
              <PanelHeading
                title="Open tasks"
                description="Promised contact times and internal actions."
              />
              <div className="divide-y divide-slate-100">
                {initialTasks
                  .filter((t) => t.customerId === customer.id)
                  .map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-5">
                      <span className="h-5 w-5 rounded-full border-2 border-slate-300" />
                      <div className="flex-1">
                        <strong className="text-sm text-slate-900">
                          {task.title}
                        </strong>
                        <p className="text-xs text-slate-500">
                          {task.due} · {task.time}
                        </p>
                      </div>
                      <Badge
                        tone={task.priority === "High" ? "amber" : "slate"}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
              </div>
            </Panel>
          )}
          {tab === "vehicles" && (
            <Panel>
              <PanelHeading
                title="Vehicle relationships"
                description="Owned, previously owned and current deal vehicles from Pentana."
              />
              <div className="p-5">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge tone="green">Current interest</Badge>
                      <h3 className="mt-3 font-bold text-slate-900">
                        {customer.interest}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Matched from the shared customer thread
                      </p>
                    </div>
                    <Icon name="car" className="h-7 w-7 text-slate-400" />
                  </div>
                </div>
              </div>
            </Panel>
          )}
          {tab === "audit" && (
            <Panel>
              <PanelHeading
                title="Audit history"
                description="Evidence of changes to this customer record."
              />
              <div className="divide-y divide-slate-100">
                {[
                  "Record viewed by Maya Chen",
                  "Pentana contact details refreshed",
                  "Lead assigned to Maya Chen",
                ].map((event, index) => (
                  <div
                    className="flex justify-between gap-4 p-5 text-sm"
                    key={event}
                  >
                    <span className="font-medium text-slate-800">{event}</span>
                    <span className="text-slate-400">
                      {index === 0 ? "Today" : `${index + 1} days ago`}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
        <aside className="space-y-5">
          <Panel>
            <PanelHeading title="Contact details" />
            <div className="space-y-4 p-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Email
                </span>
                <p className="mt-1 break-all text-sm text-slate-700">
                  {customer.email}
                </p>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Phone
                </span>
                <p className="mt-1 text-sm text-slate-700">{customer.phone}</p>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Household / company</span>
                <p className="mt-1 text-sm text-slate-700">Bennett household</p>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sites</span>
                <p className="mt-1 text-sm text-slate-700">{customer.location} · Mazda</p>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Contact permission
                </span>
                <div className="mt-2">
                  <Badge
                    tone={
                      customer.consent === "Confirmed"
                        ? "green"
                        : customer.consent === "Do not contact"
                          ? "red"
                          : "amber"
                    }
                  >
                    {customer.consent}
                  </Badge>
                </div>
              </div>
            </div>
          </Panel>
          <Panel>
            <PanelHeading title="Vehicles" />
            <div className="p-5"><Badge tone="green">Current deal unit</Badge><h3 className="mt-3 text-sm font-bold text-slate-900">{customer.interest}</h3><dl className="mt-3 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-slate-400">Registration</dt><dd className="mt-1 font-semibold text-slate-700">FQX-41R</dd></div><div><dt className="text-slate-400">VIN</dt><dd className="mt-1 font-semibold text-slate-700">…7M04218</dd></div><div><dt className="text-slate-400">Next service</dt><dd className="mt-1 font-semibold text-slate-700">18 Nov 2026</dd></div><div><dt className="text-slate-400">Campaigns</dt><dd className="mt-1 font-semibold text-slate-700">None open</dd></div></dl></div>
          </Panel>
          <Panel>
            <PanelHeading title="Source & freshness" />
            <div className="p-5">
              <Badge tone="blue">{customer.source}</Badge>
              <p className="mt-3 text-sm text-slate-600">
                Pentana source record
              </p>
              <strong className="mt-1 block text-sm text-slate-900">
                Synced just now
              </strong>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Pentana remains authoritative; this customer refreshes near real time while open.
              </p>
            </div>
          </Panel>
          <Panel>
            <PanelHeading title="Proposed changes" />
            <div className="p-5">
              <p className="text-sm text-slate-600">Mobile number correction</p>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" className="flex-1 px-2" onClick={() => setNotice("Mobile change opened for field-level conflict review.")}>
                  Review
                </Button>
                <Button className="flex-1 px-2" onClick={() => setNotice("Pentana accepted the mobile number update; audit evidence was retained.")}>Confirm</Button>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Confirmation sends an audited contact-field update to Pentana.
              </p>
            </div>
          </Panel>
        </aside>
      </div>
      <Modal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title="Add internal note"
        description="Visible to authorised dealership staff only."
      >
        <ModalForm onSubmit={addNote}>
          <FormField label="Note">
            <textarea
              name="note"
              className={`${inputClass} min-h-32 py-3`}
              required
              maxLength={1000}
              autoFocus
              placeholder="Record useful context and the agreed next step."
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setNoteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save note</Button>
          </div>
        </ModalForm>
      </Modal>
      <TaskModal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        onAdded={() => setNotice("Follow-up added to My Day.")}
      />
    </>
  );
}
