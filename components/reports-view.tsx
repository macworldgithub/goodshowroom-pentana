"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  inputClass,
  PageHeader,
  Panel,
  PanelHeading,
  StatCard,
} from "./ui";

export function ReportsView() {
  const [notice, setNotice] = useState("");
  const bars = [62, 76, 51, 84, 68, 92, 73];
  return (
    <>
      <PageHeader
        eyebrow="Workspace performance"
        title="Performance reports"
        description="Monitor response times, follow-up health and operational workload across authorised sites."
        actions={
          <>
            <select className={`${inputClass} w-44`}>
              <option>Last 30 days</option>
              <option>This week</option>
              <option>This quarter</option>
            </select>
            <Button
              variant="secondary"
              onClick={() =>
                setNotice("Report export prepared for the current date range.")
              }
            >
              Export CSV
            </Button>
          </>
        }
      />
      {notice && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          {notice}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Lead response"
          value="18m"
          detail="6m faster than last month"
          icon="clock"
        />
        <StatCard
          label="Contact rate"
          value="78%"
          detail="Within first 24 hours"
          icon="phone"
          tone="blue"
        />
        <StatCard
          label="Overdue follow-ups"
          value="8"
          detail="Across 4 team members"
          icon="warning"
          tone="red"
        />
        <StatCard
          label="CRM wins"
          value="14"
          detail="$684k pipeline value"
          icon="chart"
          tone="green"
        />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Panel>
          <PanelHeading
            title="Lead response health"
            description="Percentage contacted within target by day."
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
                    className="w-full max-w-12 rounded-t-md bg-red-500"
                    style={{ height: `${height * 1.8}px` }}
                  />
                  <span className="text-xs text-slate-400">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
        <Panel>
          <PanelHeading
            title="Team follow-up health"
            description="Open activity by owner."
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
