"use client";
import Link from "next/link";
import { useState } from "react";
import { api, query } from "@/lib/backend";
import { customerName, type Customer, type Page } from "@/lib/backend-types";
import { useWorkspace } from "./workspace-provider";
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
  PageHeader,
  Panel,
  PanelHeading,
} from "./ui";

type Lead = {
  id: string;
  customer_id: string;
  title: string;
  source: string;
  vehicle_interest: string | null;
  status: string;
  assigned_to: string;
  version: number;
  updated_at: string;
  follow_up_task_id?: string;
};
const statuses = ["new", "contacted", "qualified", "closed"];
export function LiveLeads() {
  const { site, context, can } = useWorkspace();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [offset, setOffset] = useState(0);
  const [editor, setEditor] = useState<Lead | "new" | null>(null);
  const resource = useResource<{
    leads: Lead[];
    pagination: Page;
    visibility: string;
  }>(
    `sales/leads?${query({ siteId: site.id, status: status || undefined, search: term, offset, limit: 20 })}`,
  );
  const customers = useDirectory<Customer>(
    editor === "new" ? `customers?siteId=${site.id}` : null,
    "customers",
  );
  const staff = useDirectory<{
    userId: string;
    fullName: string | null;
    permissions: string[];
  }>(
    editor && can("sales.assign_leads") ? `sites/${site.id}/staff` : null,
    "staff",
  );
  const lead = editor && editor !== "new" ? editor : undefined;
  const fields: Field[] = [
    ...(!lead
      ? [
          {
            name: "customerId",
            label: "Customer",
            type: "select" as const,
            required: true,
            options: [
              { value: "", label: "Choose a customer" },
              ...customers.items.map((customer) => ({
                value: customer.id,
                label: customerName(customer),
              })),
            ],
          },
        ]
      : []),
    {
      name: "title",
      label: "Enquiry title",
      value: lead?.title ?? "",
      required: true,
      minLength: 2,
      maxLength: 180,
    },
    {
      name: "source",
      label: "Enquiry source",
      value: lead?.source ?? "Walk-in",
      required: true,
      minLength: 2,
      maxLength: 100,
      hint: "For example: walk-in, website, phone or referral.",
    },
    {
      name: "vehicleInterest",
      label: "Vehicle interest",
      type: "textarea",
      value: lead?.vehicle_interest ?? "",
      maxLength: 1000,
    },
    ...(lead
      ? [
          {
            name: "status",
            label: "Status",
            type: "select" as const,
            value: lead.status,
            options: statuses.map((value) => ({
              value,
              label: value.charAt(0).toUpperCase() + value.slice(1),
            })),
          },
        ]
      : can("tasks.write")
        ? [
            {
              name: "followUpAt",
              label: "Next follow-up (your device’s timezone)",
              type: "datetime-local" as const,
              hint: "Optional. Creates a linked task that appears in My Day.",
            },
          ]
        : []),
    ...(can("sales.assign_leads")
      ? [
          {
            name: "assignedTo",
            label: "Salesperson",
            type: "select" as const,
            value: lead?.assigned_to ?? context.user.id,
            options: [
              ...new Map(
                [
                  {
                    userId: context.user.id,
                    fullName: "Me",
                    permissions: ["sales.write"],
                  },
                  ...staff.items.filter((item) =>
                    item.permissions.includes("sales.write"),
                  ),
                ].map((item) => [
                  item.userId,
                  { value: item.userId, label: item.fullName ?? item.userId },
                ]),
              ).values(),
            ],
          },
        ]
      : []),
  ];
  return (
    <>
      <PageHeader
        eyebrow={site.name}
        title="Sales enquiries"
        description="Track customer interest, ownership and the next conversation."
        actions={
          <>
            <Button variant="secondary" onClick={resource.reload}>
              Refresh
            </Button>
            {can("sales.write") && (
              <Button onClick={() => setEditor("new")}>New enquiry</Button>
            )}
          </>
        }
      />
      <Panel className="mb-5">
        <PanelHeading
          title="Find enquiries"
          description={
            can("sales.view_team")
              ? "You can view enquiries across this site."
              : "Your assigned customer enquiries."
          }
        />
        <form
          className="flex flex-col gap-3 p-5 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            setTerm(search);
            setOffset(0);
          }}
        >
          <input
            aria-label="Search enquiry titles"
            className={inputClass}
            placeholder="Search enquiry titles"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            maxLength={60}
          />
          <select
            aria-label="Enquiry status"
            className={inputClass}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setOffset(0);
            }}
          >
            <option value="">All statuses</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </Panel>
      <ResourceState resource={resource} />
      <Panel>
        <PanelHeading
          title="Enquiry register"
          description="Customer records and follow-ups remain shared in Customer 360."
        />
        {resource.data && !resource.data.leads.length && (
          <EmptyState
            icon="leads"
            title="No enquiries yet"
            description="Create an enquiry for an existing customer to start tracking their vehicle interest."
          />
        )}
        <div className="divide-y divide-slate-100">
          {resource.data?.leads.map((item) => (
            <article
              key={item.id}
              className="flex flex-col justify-between gap-4 p-5 sm:flex-row"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-bold text-slate-900">{item.title}</h3>
                  <Badge tone={item.status === "qualified" ? "green" : "slate"}>
                    {item.status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {item.source} ·{" "}
                  {item.vehicle_interest || "Vehicle interest not recorded"}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Updated {timestamp(item.updated_at, site.timezone)} ·{" "}
                  {item.assigned_to === context.user.id
                    ? "Assigned to you"
                    : "Assigned to team member"}
                </p>
                <Link
                  href={`/customers/${item.customer_id}`}
                  className="mt-3 inline-block text-sm font-semibold text-brand hover:underline"
                >
                  Open customer{" "}
                  {item.follow_up_task_id ? "and linked follow-up" : "profile"}
                </Link>
              </div>
              {can("sales.write") && (
                <div>
                  <Button variant="secondary" onClick={() => setEditor(item)}>
                    Edit enquiry
                  </Button>
                </div>
              )}
            </article>
          ))}
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
          title={lead ? "Edit enquiry" : "New sales enquiry"}
          description={
            lead
              ? "Follow-up tasks are managed separately in the customer profile. Changing enquiry ownership does not reassign an existing task."
              : "Save a local sales enquiry against a confirmed customer."
          }
          fields={fields}
          onClose={() => setEditor(null)}
          onSubmit={async (values, key) => {
            if (customers.loading || staff.loading)
              throw new Error("Please wait for the available choices to load.");
            if (customers.error || staff.error)
              throw new Error(customers.error || staff.error);
            const body = {
              siteId: site.id,
              title: values.title,
              source: values.source,
              vehicleInterest: values.vehicleInterest || null,
              ...(can("sales.assign_leads")
                ? { assignedTo: values.assignedTo }
                : {}),
              ...(lead
                ? { version: lead.version, status: values.status }
                : {
                    customerId: values.customerId,
                    ...(values.followUpAt
                      ? {
                          followUpAt: new Date(
                            String(values.followUpAt),
                          ).toISOString(),
                        }
                      : {}),
                  }),
            };
            await api(lead ? `sales/leads/${lead.id}` : "sales/leads", {
              method: lead ? "PATCH" : "POST",
              body,
              ...(lead ? {} : { key }),
            });
            resource.reload();
          }}
        >
          <Feedback error={customers.error || staff.error} />
        </ActionDialog>
      )}
    </>
  );
}
