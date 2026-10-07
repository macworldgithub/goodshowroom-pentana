"use client";

import { useState } from "react";
import { Badge, Button, Icon, PageHeader, Panel, PanelHeading, StatCard } from "./ui";

const initialCommands = [
  { id: "CMD-8842", action: "Move service booking", record: "A-4492 · Liam Harris", user: "Priya Nair", time: "Today, 9:18 am", reason: "Selected advisor has no capacity in Pentana", state: "Failed" },
  { id: "CMD-8837", action: "Update customer mobile", record: "00017731 · Noah Williams", user: "Daniel Reed", time: "Today, 8:54 am", reason: "Pentana record changed after this screen opened", state: "Review" },
  { id: "CMD-8829", action: "Reserve stock unit", record: "PZ-2841 · Olivia Bennett", user: "Maya Chen", time: "Today, 8:31 am", reason: "Accepted by Pentana", state: "Accepted" },
];

export function ImportsView() {
  const [commands, setCommands] = useState(initialCommands);
  const [notice, setNotice] = useState("");

  function retry(id: string) {
    setCommands((items) => items.map((item) => item.id === id ? { ...item, state: "Accepted", reason: "Retry accepted by Pentana" } : item));
    setNotice(`${id} was accepted by Pentana. The audit row and response have been retained.`);
  }

  return (
    <>
      <PageHeader eyebrow="Admin only" title="Pentana sync operations" description="Monitor integration health, review rejected writes and retry commands without hiding a Pentana rejection." actions={<Button variant="secondary"><Icon name="refresh" className="h-4 w-4" />Reconcile now</Button>} />
      {notice && <div role="status" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{notice}</div>}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Integration" value="Online" detail="Pentana command channel" icon="check" />
        <StatCard label="Last reconcile" value="9:45 am" detail="Near-real-time feed healthy" icon="refresh" tone="blue" />
        <StatCard label="Failed writes" value={commands.filter((item) => item.state === "Failed").length} detail="Visible to originating users" icon="warning" tone="red" />
        <StatCard label="Oldest pending" value="11m" detail="Within business-hours target" icon="clock" tone="amber" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Panel>
          <PanelHeading title="Command queue" description="Every write keeps the Good Showroom id, Pentana id, request, response and initiating user." />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead><tr className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500"><th className="px-5 py-3">Command</th><th className="px-5 py-3">Record</th><th className="px-5 py-3">User</th><th className="px-5 py-3">Pentana response</th><th className="px-5 py-3">Status</th><th className="px-5 py-3" /></tr></thead>
              <tbody className="divide-y divide-slate-100">{commands.map((item) => <tr key={item.id}><td className="px-5 py-4"><strong className="block text-sm text-slate-900">{item.action}</strong><span className="text-xs text-slate-500">{item.id} · {item.time}</span></td><td className="px-5 py-4 text-sm text-slate-700">{item.record}</td><td className="px-5 py-4 text-sm text-slate-600">{item.user}</td><td className="max-w-[280px] px-5 py-4 text-sm text-slate-600">{item.reason}</td><td className="px-5 py-4"><Badge tone={item.state === "Accepted" ? "green" : item.state === "Failed" ? "red" : "amber"}>{item.state}</Badge></td><td className="px-5 py-4">{item.state !== "Accepted" && <Button variant="secondary" className="px-3" onClick={() => retry(item.id)}>Retry</Button>}</td></tr>)}</tbody>
            </table>
          </div>
        </Panel>
        <div className="space-y-5">
          <Panel><PanelHeading title="Ownership rules" /><div className="space-y-3 p-5 text-sm text-slate-600">{["Pentana wins: stock, deal totals, RO operations and financials", "Good Showroom wins: tasks and unsent drafts", "Contact fields: last accepted write with field-level audit", "No delete: only supported cancel or close statuses"].map((rule) => <div className="flex gap-2" key={rule}><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-brand" /><span>{rule}</span></div>)}</div></Panel>
          <Panel className="bg-[#10182b] text-white"><div className="p-5"><p className="text-xs font-black uppercase tracking-wider text-red-300">Degraded-state policy</p><strong className="mt-3 block">Never show silent success</strong><p className="mt-2 text-sm leading-6 text-slate-300">A write remains pending or failed until Pentana accepts it. The initiating user sees the same rejection shown here.</p></div></Panel>
        </div>
      </div>
    </>
  );
}
