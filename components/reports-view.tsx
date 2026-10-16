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
  const bars = data?.metrics.leadResponseHealth.trend ?? [];

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
        eyebrow="Manager and principal view"
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
            description={`Overall contact rate: ${data?.metrics.leadResponseHealth.contactRate ?? "unavailable"}%. No historical trend is available yet.`}
          />
          <div className="p-5">
            <div className="flex h-64 items-end gap-3 border-b border-l border-slate-200 px-3 pt-6">
              {bars.map((height, index) => (
                <div
                  className="flex flex-1 flex-col items-center justify-end gap-2"
                  key={index}
                >
                  <span className="text-xs font-bold text-slate-500">
                    {height}%
                  </span>
                  <div
                    className="w-full max-w-12 rounded-t-md bg-brand"
                    style={{ height: `${height * 1.8}px` }}
                  />
                  <span className="text-xs text-slate-400">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index] ??
                      `Day ${index + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
        <Panel>
          <PanelHeading
            title="Team follow-up health"
            description="Active deals, repair orders and follow-ups by staff member."
          />
          <div className="divide-y divide-slate-100">
            {(!data || !data.teamPerformance.length) && (
              <p className="p-5 text-sm text-slate-500">
                No staff activity recorded.
              </p>
            )}
            {data?.teamPerformance.map((staff) => (
              <div className="flex items-center gap-3 p-4" key={staff.id}>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-700">
                  {staff.initials}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <strong className="text-slate-900">{staff.name}</strong>
                    <span className="text-slate-500">
                      {staff.dealsCount} deals · {staff.repairOrdersCount} ROs
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{
                        width: staff.openTasksCount
                          ? `${Math.round((100 * (staff.openTasksCount - staff.overdueTasksCount)) / staff.openTasksCount)}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
                <Badge
                  tone={
                    staff.overdueTasksCount > 2
                      ? "red"
                      : staff.overdueTasksCount > 0
                        ? "amber"
                        : "green"
                  }
                >
                  {staff.overdueTasksCount > 0
                    ? `${staff.overdueTasksCount} overdue`
                    : "On track"}
                </Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
