"use client";

import { useState } from "react";
import { Badge, Button, Icon, inputClass, PageHeader, Panel, PanelHeading, StatCard } from "./ui";

const importHistory = [
  ["pentana_customers_2026-10-12.csv", "Customers", "Today, 8:05 am", "1,248 applied", "Complete"],
  ["service_appointments_2026-10-12.csv", "Appointments", "Today, 8:02 am", "86 applied", "Complete"],
  ["repair_orders_2026-10-11.csv", "Repair orders", "Yesterday, 5:44 pm", "2 need review", "Review"],
];

export function CsvImportsView() {
  const [fileName, setFileName] = useState("");
  const [dataType, setDataType] = useState("Customers");
  const [status, setStatus] = useState<"idle" | "validated" | "complete">("idle");

  return <>
    <PageHeader eyebrow="Admin only" title="CSV imports" description="Validate controlled Pentana extracts, preserve source identifiers and apply approved records with a complete audit trail." />
    <div className="mb-5 grid gap-4 sm:grid-cols-3"><StatCard label="Last import" value="8:05 am" detail="Customer extract" icon="upload" /><StatCard label="Applied today" value="1,334" detail="Customers and appointments" icon="check" tone="blue" /><StatCard label="Needs review" value="2" detail="Possible record conflicts" icon="warning" tone="amber" /></div>
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <Panel><PanelHeading title="New controlled import" description="Only Admin can validate and apply a CSV." /><div className="space-y-4 p-5"><label className="block text-sm font-bold text-slate-700">Data type<select value={dataType} onChange={(event) => { setDataType(event.target.value); setStatus("idle"); }} className={`mt-2 ${inputClass}`}><option>Customers</option><option>Vehicle stock</option><option>Sales enquiries and deals</option><option>Service appointments</option><option>Repair orders</option></select></label><label className="grid min-h-36 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center hover:border-brand"><input className="sr-only" type="file" accept=".csv,text/csv" onChange={(event) => { setFileName(event.target.files?.[0]?.name ?? ""); setStatus("idle"); }} /><span><Icon name="upload" className="mx-auto h-7 w-7 text-brand" /><strong className="mt-2 block text-sm text-slate-900">{fileName || "Choose CSV file"}</strong><small className="mt-1 block text-slate-500">Leading zeros and Pentana IDs are preserved.</small></span></label>{status === "validated" && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Validation passed: 1,248 valid, 2 held for review, 1 invalid row skipped.</div>}{status === "complete" && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{dataType} import applied. CRM-owned thread content and tasks were not overwritten.</div>}<div className="grid grid-cols-2 gap-2"><Button variant="secondary" disabled={!fileName} onClick={() => setStatus("validated")}>Validate</Button><Button disabled={status !== "validated"} onClick={() => setStatus("complete")}>Apply import</Button></div></div></Panel>
      <Panel><PanelHeading title="Import history" description="File, operator, validation result and applied outcome are retained for audit." /><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead><tr className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500"><th className="px-5 py-3">File</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Imported</th><th className="px-5 py-3">Outcome</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{importHistory.map(([file, type, time, outcome, state]) => <tr key={file}><td className="px-5 py-4 text-sm font-semibold text-slate-900">{file}</td><td className="px-5 py-4 text-sm text-slate-600">{type}</td><td className="px-5 py-4 text-sm text-slate-600">{time}</td><td className="px-5 py-4 text-sm text-slate-600">{outcome}</td><td className="px-5 py-4"><Badge tone={state === "Complete" ? "green" : "amber"}>{state}</Badge></td></tr>)}</tbody></table></div></Panel>
    </div>
  </>;
}
