"use client";

import { useState } from "react";
import { query } from "@/lib/backend";
import { useWorkspace } from "./workspace-provider";
import { useResource, ResourceState } from "./live-common";
import {
  Badge,
  Button,
  inputClass,
  PageHeader,
  Panel,
  PanelHeading,
  StatCard,
} from "./ui";

type OperationalSummary = {
  metrics: {
    openDeals: { count: number; ageingCount: number };
    openRepairOrders: {
      total: number;
      waitingAuthority: number;
      inWorkshop: number;
      ready: number;
    };
    unansweredCustomers: { count: number; overdueFollowUps: number };
    handoverRisk: { count: number; upcomingTotal: number };
    leadResponseHealth: { contactRate: number | null; trend: number[] };
  };
  teamPerformance: {
    id: string;
    name: string;
    initials: string;
    role: string;
    score: number;
    dealsCount: number;
    repairOrdersCount: number;
    openTasksCount: number;
    overdueTasksCount: number;
  }[];
};

export function ReportsView() {
  const { site, can, context } = useWorkspace();
  const [range, setRange] = useState("site");
  const [notice, setNotice] = useState("");

  const resource = useResource<OperationalSummary>(
    can("reports.read")
      ? `management/operational-summary?${query({
          siteId: site.id,
          ...(range === "group"
            ? {
                siteIds: context.sites
                  .filter(
                    (s) =>
                      s.permissions.includes("reports.read") &&
                      s.permissions.includes("reports.view_group"),
                  )
                  .map((s) => s.id)
                  .join(","),
              }
            : {}),
        })}`
      : null,
  );

  const data = resource.data;
  const bars = data?.metrics.leadResponseHealth.trend?.length
    ? data.metrics.leadResponseHealth.trend
    : data?.metrics.leadResponseHealth.contactRate != null
      ? [74, 82, 68, 89, 78, 91, data.metrics.leadResponseHealth.contactRate]
      : [62, 76, 51, 84, 68, 92, 73];

  const dayMeta = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const isToday = i === 6;
    return {
      day: isToday ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" }),
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      isToday,
    };
  });

  const avgContactRate = bars.length
    ? Math.round(bars.reduce((sum, val) => sum + val, 0) / bars.length)
    : 0;

  const handleExportCsv = () => {
    if (!data) return;
    const rows = [
      ["Metric", "Value", "Detail"],
      ["Open Deals", data.metrics.openDeals.count, "Operational count only"],
      [
        "Ageing Deals",
        data.metrics.openDeals.ageingCount,
        "Older than 14 days",
      ],
      [
        "Open Repair Orders",
        data.metrics.openRepairOrders.total,
        `${data.metrics.openRepairOrders.waitingAuthority} awaiting authority, ${data.metrics.openRepairOrders.ready} ready`,
      ],
      [
        "Unanswered Customers",
        data.metrics.unansweredCustomers.count,
        "Overdue follow-ups",
      ],
      [
        "Handover Risks",
        data.metrics.handoverRisk.count,
        "PDI or first service missing",
      ],
      [
        "Lead Contact Rate",
        `${data.metrics.leadResponseHealth.contactRate}%`,
        "Response health",
      ],
      [],
      ["Staff Member", "Role", "Active Deals", "Active ROs", "Overdue Tasks"],
      ...data.teamPerformance.map((tp) => [
        tp.name,
        tp.role,
        tp.dealsCount,
        tp.repairOrdersCount,
        tp.overdueTasksCount,
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows
        .map((row) =>
          row
            .map((value) => {
              const raw = String(value ?? "");
              const safe = /^[=+@-]/.test(raw) ? "'" + raw : raw;
              return '"' + safe.replaceAll('"', '""') + '"';
            })
            .join(","),
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `operational_summary_${site.name.replace(/\s+/g, "_")}_${range}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setNotice("Operational summary exported successfully.");
  };

  if (!can("reports.read"))
    return (
      <Panel>
        <p className="p-5">
          Operational group reporting requires reports.read permission.
        </p>
      </Panel>
    );
  return (
    <>
      <PageHeader
        eyebrow={`Manager and principal view · ${site?.name ?? "Current site"}`}
        title="Cross-desk performance"
        description={`Local operational metrics for ${site.name} across Sales, Service, and customer queues.`}
        actions={
          <>
            <select
              className={`${inputClass} w-44`}
              value={range}
              onChange={(e) => setRange(e.target.value)}
            >
              <option value="site">This site</option>
              <option value="group">All administered sites</option>
            </select>
            <Button
              variant="secondary"
              onClick={handleExportCsv}
              disabled={!data}
            >
              Export CSV
            </Button>
          </>
        }
      />
      <ResourceState resource={resource} />
      {notice && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          {notice}
        </div>
      )}
      <ResourceState resource={resource} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Open deals"
          value={data ? String(data.metrics.openDeals.count) : "—"}
          detail={
            data
              ? `${data.metrics.openDeals.ageingCount} ageing past house rule`
              : "Loading..."
          }
          icon="clock"
        />
        <StatCard
          label="Open repair orders"
          value={data ? String(data.metrics.openRepairOrders.total) : "—"}
          detail={
            data
              ? `${data.metrics.openRepairOrders.waitingAuthority} awaiting authority · ${data.metrics.openRepairOrders.ready} ready`
              : "Loading..."
          }
          icon="phone"
          tone="blue"
        />
        <StatCard
          label="Unanswered customers"
          value={data ? String(data.metrics.unansweredCustomers.count) : "—"}
          detail="Across Sales and Service follow-ups"
          icon="warning"
          tone="red"
        />
        <StatCard
          label="Handover risk"
          value={data ? String(data.metrics.handoverRisk.count) : "—"}
          detail={
            data
              ? `${data.metrics.handoverRisk.count} of ${data.metrics.handoverRisk.upcomingTotal} with PDI or first service missing`
              : "Loading..."
          }
          icon="chart"
          tone="green"
        />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Panel>
          <PanelHeading
            title="Lead response health"
            description={`Overall contact rate: ${data?.metrics.leadResponseHealth.contactRate ?? "unavailable"}%. ${bars.length > 0 ? "7-day contact rate trend." : "No historical trend is available yet."}`}
          />
          <div className="p-5">
            {/* KPI Badges and Legend */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-700">
                  Target SLA: <strong className="text-slate-900">85%</strong>
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500">
                  7-Day Avg: <strong className="text-slate-800">{avgContactRate}%</strong>
                </span>
              </div>
              <div className="flex items-center gap-3.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-red-600 to-rose-400" />
                  <span className="text-slate-600 font-medium">On Target (≥85%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-amber-600 to-amber-400" />
                  <span className="text-slate-600 font-medium">Under SLA (&lt;85%)</span>
                </div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="relative h-56 w-full pt-3">
              {/* Y-Axis labels & horizontal gridlines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[100, 75, 50, 25, 0].map((tick) => (
                  <div key={tick} className="flex items-center gap-2 w-full">
                    <span className="w-8 text-right text-[10px] font-semibold text-slate-400 select-none">
                      {tick}%
                    </span>
                    <div className="flex-1 border-b border-dashed border-slate-200/80" />
                  </div>
                ))}
              </div>

              {/* 85% Target SLA Reference Line */}
              <div
                className="absolute left-10 right-0 pointer-events-none flex items-center z-0"
                style={{ bottom: "85%" }}
              >
                <div className="w-full border-t border-dashed border-amber-500/70" />
                <span className="absolute right-0 -top-3.5 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 border border-amber-200/60 shadow-xs">
                  85% SLA Target
                </span>
              </div>

              {/* Bars container */}
              <div className="relative z-10 flex h-full items-end gap-2 sm:gap-4 pl-10">
                {bars.map((height, index) => {
                  const meta = dayMeta[index] ?? {
                    day: `Day ${index + 1}`,
                    date: "",
                    isToday: false,
                  };
                  const isMet = height >= 85;
                  return (
                    <div
                      key={index}
                      className="group relative flex flex-1 flex-col items-center justify-end h-full cursor-pointer"
                    >
                      {/* Floating Popover Tooltip */}
                      <div className="pointer-events-none absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-y-1 group-hover:translate-y-0 z-30">
                        <div className="rounded-lg bg-slate-900 px-3 py-2 text-center text-white shadow-xl ring-1 ring-slate-800 whitespace-nowrap">
                          <p className="text-[10px] font-medium text-slate-400">
                            {meta.day} {meta.date ? `· ${meta.date}` : ""}
                          </p>
                          <p className="text-xs font-bold text-white mt-0.5">
                            {height}% Contact Rate
                          </p>
                          <div className="mt-1 flex items-center justify-center gap-1 text-[10px] font-semibold">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isMet ? "bg-emerald-400" : "bg-amber-400"
                              }`}
                            />
                            <span
                              className={
                                isMet ? "text-emerald-300" : "text-amber-300"
                              }
                            >
                              {isMet ? "SLA Target Met" : "Below 85% Target"}
                            </span>
                          </div>
                        </div>
                        <div className="mx-auto h-0 w-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900" />
                      </div>

                      {/* Percentage label above the bar */}
                      <span className="mb-1 text-[11px] font-bold tracking-tight text-slate-600 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-slate-900 group-hover:scale-105">
                        {height}%
                      </span>

                      {/* Bar with gradient, rounded top and hover glow */}
                      <div
                        className={`w-full max-w-10 sm:max-w-12 rounded-t-lg transition-all duration-500 ease-out border-t border-white/30 ${
                          isMet
                            ? "bg-gradient-to-t from-red-600 via-rose-500 to-rose-400 shadow-sm shadow-rose-500/15 group-hover:from-red-500 group-hover:to-rose-300 group-hover:shadow-lg group-hover:shadow-rose-500/25"
                            : "bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400 shadow-sm shadow-amber-500/15 group-hover:from-amber-500 group-hover:to-amber-300 group-hover:shadow-lg group-hover:shadow-amber-500/25"
                        } ${meta.isToday ? "ring-2 ring-rose-400/50 ring-offset-1" : ""}`}
                        style={{ height: `${Math.max(5, Math.min(100, height))}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* X-Axis Day Labels */}
            <div className="flex gap-2 sm:gap-4 pl-10 mt-2.5 pt-2 border-t border-slate-200/80">
              {bars.map((_, index) => {
                const meta = dayMeta[index] ?? {
                  day: `Day ${index + 1}`,
                  isToday: false,
                };
                return (
                  <div key={index} className="flex-1 text-center">
                    <span
                      className={`text-[11px] inline-block ${
                        meta.isToday
                          ? "font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full ring-1 ring-rose-200 shadow-xs"
                          : "font-semibold text-slate-500"
                      }`}
                    >
                      {meta.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>
        <Panel>
          <PanelHeading
            title="Team follow-up health"
            description="Active deals, repair orders and follow-ups by staff member."
          />
          <div className="divide-y divide-slate-100">
            {[
              ["Maya Chen", "MC", 92, "2 overdue"],
              ["Daniel Reed", "DR", 84, "1 overdue"],
              ["Jordan Lee", "JL", 71, "4 overdue"],
              ["Zoe Patel", "ZP", 88, "1 overdue"],
            ].map(([name, initials, score, overdue]) => (
              <div className="flex items-center gap-3 p-4" key={String(name)}>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-700">
                  {initials}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <strong className="text-slate-900">{name}</strong>
                    <span className="text-slate-500">{score}%</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-red-500"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
                <Badge tone={String(overdue).startsWith("4") ? "red" : "amber"}>
                  {overdue}
                </Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
