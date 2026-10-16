"use client";
import { useState } from "react";
import type { Page, Task } from "@/lib/backend-types";
import { query } from "@/lib/backend";
import { useWorkspace } from "./workspace-provider";
import { Pager, ResourceState, useResource } from "./live-common";
import {
  Button,
  EmptyState,
  inputClass,
  PageHeader,
  Panel,
  PanelHeading,
  StatCard,
} from "./ui";
import { TaskCard } from "./live-tasks";
import { HandoverRiskQueue } from "./live-deliveries";
import { AppointmentQueue } from "./live-service-diary";
import { RepairOrderList } from "./live-repair-orders";
type Day = {
  day: { date: string; timezone: string };
  view: string;
  items: (Task & {
    contactRestrictions: {
      doNotContact: boolean;
      callConsent: string;
      emailConsent: string;
    };
  })[];
  totals: {
    all: number;
    overdue: number;
    today: number;
    scheduledCalls: number;
  };
  pagination: Page;
};
export function LiveMyDay() {
  const { site, can } = useWorkspace();
  const [view, setView] = useState("own");
  const [bucket, setBucket] = useState("all");
  const [date, setDate] = useState("");
  const [offset, setOffset] = useState(0);
  const actualView = can("tasks.view_team") ? view : "own";
  const resource = useResource<Day>(
    `my-day?${query({ siteId: site.id, view: actualView, bucket, date: date || undefined, offset, limit: 20 })}`,
  );
  const totals = resource.data?.totals;
  return (
    <>
      <PageHeader
        title="My Day"
        eyebrow={site.name}
        description={`Your follow-ups and scheduled calls, grouped by the day in ${site.timezone}.`}
        actions={
          <Button variant="secondary" onClick={resource.reload}>
            Refresh
          </Button>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["All open", totals?.all],
          ["Overdue", totals?.overdue],
          ["Today", totals?.today],
          ["Scheduled calls", totals?.scheduledCalls],
        ].map(([label, value]) => (
          <StatCard
            key={label}
            label={String(label)}
            value={value === undefined ? "—" : String(value)}
            detail={
              label === "Overdue"
                ? "Follow-ups needing attention"
                : label === "Today"
                  ? "Due on your selected date"
                  : label === "Scheduled calls"
                    ? "Customer calls to follow up"
                    : "Your active daily queue"
            }
            tone={
              label === "Overdue"
                ? "red"
                : label === "Today"
                  ? "blue"
                  : label === "Scheduled calls"
                    ? "violet"
                    : "slate"
            }
            icon="clock"
          />
        ))}
      </div>
      <Panel className="mb-6">
        <PanelHeading
          title="Your work queue"
          description="Choose whose work to see, then narrow it by priority and date."
        />
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <label className="text-sm font-semibold">
            Queue
            <select
              className={inputClass}
              value={actualView}
              onChange={(event) => {
                setView(event.target.value);
                setOffset(0);
              }}
            >
              <option value="own">My work</option>
              {can("tasks.view_team") && (
                <option value="team">Team work</option>
              )}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Show
            <select
              className={inputClass}
              value={bucket}
              onChange={(event) => {
                setBucket(event.target.value);
                setOffset(0);
              }}
            >
              {["all", "overdue", "today", "calls"].map((item) => (
                <option key={item} value={item}>
                  {
                    {
                      all: "All open work",
                      overdue: "Overdue follow-ups",
                      today: "Due today",
                      calls: "Scheduled calls",
                    }[item]
                  }
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Site-local date
            <input
              type="date"
              className={inputClass}
              value={date || resource.data?.day.date || ""}
              onChange={(event) => {
                setDate(event.target.value);
                setOffset(0);
              }}
            />
          </label>
        </div>
      </Panel>
      <Panel className="overflow-hidden">
        <PanelHeading
          title={actualView === "team" ? "Team follow-ups" : "My follow-ups"}
          description="Review each customer’s next action and keep their progress up to date."
        />
        <div className="p-4 sm:p-5">
          <ResourceState resource={resource} />
          {resource.data && !resource.data.items.length && (
            <EmptyState
              icon="clock"
              title="Your queue is clear"
              description="No open follow-ups match these filters. Choose another date or queue to see more work."
            />
          )}
          <div className="space-y-3">
            {resource.data?.items.map((task) => (
              <div key={task.id}>
                <TaskCard task={task} onSaved={resource.reload} />
                {task.kind === "call" &&
                  (task.contactRestrictions.doNotContact ||
                    task.contactRestrictions.callConsent !== "granted") && (
                    <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
                      {task.contactRestrictions.doNotContact
                        ? "Do not contact this customer."
                        : `Call consent is ${task.contactRestrictions.callConsent}. Check restrictions before contacting.`}
                    </p>
                  )}
              </div>
            ))}
          </div>
          <Pager
            page={resource.data?.pagination}
            offset={offset}
            setOffset={setOffset}
          />
        </div>
      </Panel>
      {can("service.read") && (
        <AppointmentQueue key={date || resource.data?.day.date || "today"}
          dailyWork
          selectedDate={date || resource.data?.day.date}
        />
      )}
      {can("service.read") && <RepairOrderList key={`ro-${date || resource.data?.day.date || "today"}`} queue date={date || resource.data?.day.date} />}
      {can("deliveries.read") && <HandoverRiskQueue/>}
    </>
  );
}
