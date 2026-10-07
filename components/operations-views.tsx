"use client";

import { useMemo, useState, type FormEvent } from "react";
import { customers, serviceAppointments, vehicles } from "@/lib/demo-data";
import type { Tone } from "@/lib/crm-types";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  FormField,
  Icon,
  inputClass,
  Modal,
  ModalForm,
  PageHeader,
  Panel,
  SearchInput,
  StatCard,
} from "./ui";

const vehicleTone: Record<string, Tone> = {
  Available: "green",
  Demo: "blue",
  "In transit": "amber",
  "Reserved in Pentana": "violet",
};

export function StockView() {
  const [search, setSearch] = useState("");
  const [site, setSite] = useState("All sites");
  const [status, setStatus] = useState("All statuses");
  const [selected, setSelected] = useState<(typeof vehicles)[number] | null>(
    null,
  );
  const [notice, setNotice] = useState("");
  const filtered = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          (site === "All sites" || v.site === site) &&
          (status === "All statuses" || v.status === status) &&
          `${v.make} ${v.model} ${v.variant} ${v.stockNumber}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [search, site, status],
  );
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSelected(null);
    setNotice("Stock command accepted by Pentana and recorded on the customer thread.");
  }
  return (
    <>
      <PageHeader
        eyebrow="Sales desk"
        title="Stock match"
        description="Search Pentana inventory, match a vehicle to an active deal, and reserve or release it with audited write-back."
        actions={
          <Button variant="secondary">
            <Icon name="refresh" className="h-4 w-4" />
            Synced: just now
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
      <div className="mb-5 rounded-xl border border-sky-200 bg-sky-50 p-4">
        <div className="flex gap-3">
          <Icon
            name="refresh"
            className="mt-0.5 h-5 w-5 shrink-0 text-sky-700"
          />
          <div>
            <strong className="text-sm text-sky-900">
              Pentana is the stock authority
            </strong>
            <p className="mt-1 text-sm text-sky-700">
              Availability updates near real time. Reserve and release commands show success only after Pentana accepts them.
            </p>
          </div>
        </div>
      </div>
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Available"
          value="18"
          detail="Across authorised sites"
          icon="car"
        />
        <StatCard
          label="In transit"
          value="7"
          detail="ETA is source-provided"
          icon="clock"
          tone="amber"
        />
        <StatCard
          label="Matched interests"
          value="11"
          detail="Open sales opportunities"
          icon="customers"
          tone="blue"
        />
      </div>
      <Panel>
        <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-[1fr_180px_210px]">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search make, model or stock number"
          />
          <select
            value={site}
            onChange={(e) => setSite(e.target.value)}
            className={inputClass}
          >
            <option>All sites</option>
            <option>Parramatta</option>
            <option>North Sydney</option>
            <option>Chatswood</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputClass}
          >
            <option>All statuses</option>
            <option>Available</option>
            <option>Demo</option>
            <option>In transit</option>
            <option>Reserved in Pentana</option>
          </select>
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            icon="car"
            title="No stock matches"
            description="Try a different stock number, site or availability filter."
          />
        ) : (
          <div className="grid gap-4 p-4 md:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((v) => (
              <article
                key={v.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="grid h-32 place-items-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                  <Icon name="car" className="h-14 w-14" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {v.stockNumber}
                      </p>
                      <h2 className="mt-1 font-bold text-slate-950">
                        {v.year} {v.make} {v.model}
                      </h2>
                      <p className="text-sm text-slate-500">{v.variant}</p>
                    </div>
                    <Badge tone={vehicleTone[v.status]}>{v.status}</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-slate-400">Colour</span>
                      <p className="mt-0.5 font-medium text-slate-700">
                        {v.colour}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Odometer</span>
                      <p className="mt-0.5 font-medium text-slate-700">
                        {v.kilometres}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-4">
                    <div>
                      <strong className="text-lg text-slate-950">
                        {v.price}
                      </strong>
                      <p className="text-xs text-slate-400">
                        {v.site} · {v.importedAt}
                      </p>
                    </div>
                    <Button
                      className="px-3"
                      onClick={() => setSelected(v)}
                    >
                      {v.status === "Reserved in Pentana" ? "Release" : "Match & reserve"}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Match vehicle to customer"
        description={`${selected?.stockNumber} · ${selected?.year} ${selected?.make} ${selected?.model}`}
      >
        <ModalForm onSubmit={submit}>
          <FormField label="Customer">
            <select className={inputClass}>
              {customers.map((c) => (
                <option key={c.id}>
                  {c.name} · {c.interest}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Action">
            <select className={inputClass}>
              <option>Link interest and reserve in Pentana</option>
              <option>Link as vehicle interest only</option>
              <option>Release Pentana reservation</option>
              <option>Arrange test drive</option>
            </select>
          </FormField>
          <div className="rounded-lg bg-sky-50 p-3 text-sm leading-6 text-sky-800">
            The screen remains pending until Pentana accepts the command. Any rejection appears here and in Sync operations.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button type="submit">Save match</Button>
          </div>
        </ModalForm>
      </Modal>
    </>
  );
}

const initialDeliveries = [
  {
    id: "D-221",
    customer: "Sophie Martin",
    initials: "SM",
    vehicle: "2024 Hyundai Tucson Elite N Line",
    date: "8 Oct",
    reg: "FQX-41R",
    complete: [true, true, true, false, false],
    tasks: [
      "PDI completed",
      "Accessories fitted",
      "Vehicle detailed",
      "Handover documents",
      "First service booked",
    ],
  },
  {
    id: "D-224",
    customer: "Leo Anderson",
    initials: "LA",
    vehicle: "2025 Mazda CX-5 GT SP",
    date: "10 Oct",
    reg: "Pending",
    complete: [true, true, false, false, false],
    tasks: [
      "PDI completed",
      "Accessories fitted",
      "Vehicle detailed",
      "Handover documents",
      "First service booked",
    ],
  },
  {
    id: "D-229",
    customer: "Mia Roberts",
    initials: "MR",
    vehicle: "2025 Kia Sportage SX+",
    date: "12 Oct",
    reg: "FVN-82M",
    complete: [true, false, false, false, false],
    tasks: [
      "PDI completed",
      "Accessories fitted",
      "Vehicle detailed",
      "Handover documents",
      "First service booked",
    ],
  },
];

export function DeliveriesView() {
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [selected, setSelected] = useState<(typeof deliveries)[number] | null>(
    null,
  );
  const [notice, setNotice] = useState("");
  function toggle(deliveryId: string, index: number) {
    setDeliveries((all) =>
      all.map((d) =>
        d.id === deliveryId
          ? { ...d, complete: d.complete.map((v, i) => (i === index ? !v : v)) }
          : d,
      ),
    );
    setSelected((current) =>
      current?.id === deliveryId
        ? {
            ...current,
            complete: current.complete.map((v, i) => (i === index ? !v : v)),
          }
        : current,
    );
  }
  return (
    <>
      <PageHeader
        eyebrow="Sales + Service"
        title="Handover lane"
        description="Coordinate PDI, accessories, delivery promises and first-service booking around the same customer and vehicle."
        actions={
          <Button>
            <Icon name="plus" className="h-4 w-4" />
            New checklist
          </Button>
        }
      />
      <div className="mb-5 flex gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
        <Icon name="warning" className="h-5 w-5 shrink-0" />
        <p>
          Sales and Service share this checklist. Pentana remains authoritative for the order and delivery status.
        </p>
      </div>
      {notice && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {notice}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {deliveries.map((delivery) => {
          const done = delivery.complete.filter(Boolean).length;
          const percent = Math.round((done / delivery.tasks.length) * 100);
          return (
            <Panel key={delivery.id} className="overflow-hidden">
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <Avatar initials={delivery.initials} />
                    <div>
                      <h2 className="font-bold text-slate-900">
                        {delivery.customer}
                      </h2>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {delivery.vehicle}
                      </p>
                    </div>
                  </div>
                  <Badge tone={percent === 100 ? "green" : "amber"}>
                    {delivery.date}
                  </Badge>
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs font-semibold text-slate-500">
                    <span>
                      {done} of {delivery.tasks.length} complete
                    </span>
                    <span>{percent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2 p-5">
                {delivery.tasks.slice(0, 3).map((task, index) => (
                  <button
                    key={task}
                    onClick={() => toggle(delivery.id, index)}
                    className="flex w-full items-center gap-3 text-left text-sm"
                  >
                    <span
                      className={`grid h-5 w-5 place-items-center rounded border ${delivery.complete[index] ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 text-transparent"}`}
                    >
                      <Icon name="check" className="h-3 w-3" />
                    </span>
                    <span
                      className={
                        delivery.complete[index]
                          ? "text-slate-400 line-through"
                          : "text-slate-700"
                      }
                    >
                      {task}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSelected(delivery)}
                className="flex w-full items-center justify-between border-t border-slate-100 px-5 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                Open checklist <Icon name="chevron" className="h-4 w-4" />
              </button>
            </Panel>
          );
        })}
      </div>
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`${selected?.customer} · Handover`}
        description={`${selected?.vehicle} · Registration ${selected?.reg}`}
      >
        <div className="space-y-3 p-6">
          {selected?.tasks.map((task, index) => (
            <button
              key={task}
              onClick={() => toggle(selected.id, index)}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50"
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded ${selected.complete[index] ? "bg-emerald-600 text-white" : "border border-slate-300 text-transparent"}`}
              >
                <Icon name="check" className="h-4 w-4" />
              </span>
              <span className="flex-1 text-sm font-medium text-slate-800">
                {task}
              </span>
            </button>
          ))}
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setSelected(null);
                setNotice("Handover checklist saved and visible to Sales and Service.");
              }}
            >
              Save checklist
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function ServiceView() {
  const [tab, setTab] = useState<"appointments" | "repair" | "requests">(
    "appointments",
  );
  const [notice, setNotice] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);
  return (
    <>
      <PageHeader
        eyebrow="Service coordination"
        title="Service desk"
        description="Run the diary, check-in, repair-order stages, customer authority and collection with Pentana write-back."
        actions={<><Button variant="secondary"><Icon name="clock" className="h-4 w-4" />Today / This week</Button><Button onClick={() => setRequestOpen(true)}><Icon name="plus" className="h-4 w-4" />New booking</Button></>}
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Appointments today"
          value="16"
          detail="4 shown in this site view"
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
      </div>
      {notice && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {notice}
        </div>
      )}
      <Panel>
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-4 pt-3">
          {(
            [
              ["appointments", "Today’s diary"],
              ["repair", "Repair order board"],
              ["requests", "Write exceptions"],
            ] as const
          ).map(([key, label]) => (
            <button
              onClick={() => setTab(key)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${tab === key ? "border-emerald-700 text-emerald-800" : "border-transparent text-slate-500"}`}
              key={key}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "appointments" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead>
                <tr className="bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Customer & vehicle</th>
                  <th className="px-5 py-3">Pentana status</th>
                  <th className="px-5 py-3">Advisor</th>
                  <th className="px-5 py-3">Next customer action</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {serviceAppointments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 text-sm font-bold text-slate-900">
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
                              : item.pentanaStatus === "Checked in"
                                ? "blue"
                                : "slate"
                        }
                      >
                        {item.pentanaStatus}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.advisor}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {item.localTask}
                    </td>
                    <td className="px-5 py-4"><div className="flex gap-1">
                      <Button variant="ghost" className="px-2" onClick={() => setNotice(`${item.pentanaStatus === "Booked" ? "Booking confirmed" : item.pentanaStatus === "Checked in" ? "Repair order opened" : item.pentanaStatus === "Ready for collection" ? "Customer collected" : "No-show recovery queued"} for ${item.customer}; Pentana accepted the command.`)}>
                        {item.pentanaStatus === "Booked" ? "Confirm" : item.pentanaStatus === "Checked in" ? "Open RO" : item.pentanaStatus === "Ready for collection" ? "Collect" : "Recover"}
                      </Button>
                      {item.pentanaStatus === "Ready for collection" && <Button variant="ghost" className="px-2" onClick={() => setNotice(`Ready-for-collection message sent to ${item.customer} after the privacy check.`)}>Message</Button>}
                    </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === "repair" && (
          <div className="grid gap-4 p-5 md:grid-cols-2">
            {[
              {
                id: "RO-89041",
                customer: "Grace Wilson",
                work: "Investigate brake vibration",
                state: "Waiting authority",
              },
              {
                id: "RO-89032",
                customer: "Henry Young",
                work: "30,000 km scheduled service",
                state: "Ready for collection",
              },
              { id: "RO-89028", customer: "Ava Scott", work: "Air-conditioning diagnosis", state: "In workshop" },
              { id: "RO-89017", customer: "Lucas King", work: "Replace front brake pads", state: "Waiting parts" },
              { id: "RO-88994", customer: "Mason Hall", work: "Annual service completed", state: "Invoiced" },
            ].map((ro) => (
              <div
                className="rounded-xl border border-slate-200 p-4"
                key={ro.id}
              >
                <div className="flex justify-between">
                  <strong className="text-slate-900">{ro.id}</strong>
                  <Badge tone={ro.state.includes("Ready") ? "green" : "amber"}>
                    {ro.state}
                  </Badge>
                </div>
                <h3 className="mt-4 font-bold text-slate-900">{ro.customer}</h3>
                <p className="mt-1 text-sm text-slate-500">{ro.work}</p>
                <p className="mt-4 text-xs text-slate-400">
                  Live from Pentana · parts and financial lines are read only
                </p>
                <div className="mt-4 flex flex-wrap gap-2"><Button className="px-3" onClick={() => setNotice(`${ro.id} advanced in Pentana and added to the customer thread.`)}>Advance status</Button><Button variant="secondary" className="px-3" onClick={() => setNotice(`Customer update drafted from ${ro.id}. Review it on the thread before sending.`)}>Update customer</Button></div>
              </div>
            ))}
          </div>
        )}
        {tab === "requests" && (
          <EmptyState
            icon="clock"
            title="No unresolved write exceptions"
            description="Rejected booking, check-in and repair-order commands appear here with Pentana’s reason and a retry action."
            action={
              <Button onClick={() => setRequestOpen(true)}>
                Create booking
              </Button>
            }
          />
        )}
      </Panel>
      <Modal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        title="Create or update a booking"
        description="This command creates, moves, confirms or cancels the Pentana appointment after capacity validation."
      >
        <ModalForm
          onSubmit={(e) => {
            e.preventDefault();
            setRequestOpen(false);
            setNotice("Booking accepted by Pentana and added to the customer thread.");
          }}
        >
          <FormField label="Customer">
            <select className={inputClass}>
              {customers.map((c) => (
                <option key={c.id}>{c.name}</option>
              ))}
            </select>
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Preferred date">
              <input required type="date" className={inputClass} />
            </FormField>
            <FormField label="Command">
              <select className={inputClass}>
                <option>New booking</option>
                <option>Move booking</option>
                <option>Confirm booking</option>
                <option>Cancel</option>
              </select>
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-3"><FormField label="Preferred time"><input required type="time" className={inputClass} /></FormField><FormField label="Advisor"><select className={inputClass}><option>Priya Nair</option><option>Sam Ortiz</option></select></FormField><FormField label="Loan car"><select className={inputClass}><option>Not required</option><option>Required</option><option>Allocated · LC-07</option></select></FormField></div>
          <FormField label="Customer notes">
            <textarea
              className={`${inputClass} min-h-24 py-3`}
              placeholder="Reason, timing preferences and transport needs"
            />
          </FormField>
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Capacity rules are checked by Pentana. If the slot is rejected, the reason remains visible and no success is shown.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRequestOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Write to Pentana</Button>
          </div>
        </ModalForm>
      </Modal>
    </>
  );
}
