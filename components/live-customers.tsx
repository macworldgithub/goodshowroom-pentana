"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, query } from "@/lib/backend";
import {
  customerName,
  type Command,
  type Customer,
  type Integration,
  type Page,
} from "@/lib/backend-types";
import { useWorkspace } from "./workspace-provider";
import {
  ActionDialog,
  Feedback,
  Pager,
  ResourceState,
  timestamp,
  useResource,
} from "./live-common";
import { Badge, Button, inputClass, PageHeader } from "./ui";
export function LiveCustomers() {
  const { site, can } = useWorkspace();
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [offset, setOffset] = useState(0);
  const [create, setCreate] = useState(false);
  const [commandId, setCommandId] = useState("");
  const resource = useResource<{
    customers: Customer[];
    pagination: Page;
    integration: Integration;
  }>(
    `customers?${query({ siteId: site.id, search: term, offset, limit: 20 })}`,
  );
  const command = useResource<{ command: Command; customer: Customer | null }>(
    commandId ? `integration/commands/${commandId}` : null,
  );
  const pending =
    command.data &&
    ["queued", "processing", "retry_wait"].includes(
      command.data.command.status,
    );
  const refreshList = resource.reload;
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(command.reload, 3000);
    return () => clearInterval(timer);
  }, [pending, command.reload]);
  useEffect(() => {
    if (command.data?.command.status === "succeeded") refreshList();
  }, [command.data?.command.status, refreshList]);
  return (
    <>
      <PageHeader
        title="Customer 360"
        eyebrow={site.name}
        description="Shared customer profiles, conversations and follow-ups at your selected site."
        actions={
          <>
            <Button variant="secondary" onClick={resource.reload}>
              Refresh
            </Button>
            {can("customers.write") && (
              <Button
                disabled={!resource.data?.integration.writesEnabled}
                onClick={() => setCreate(true)}
              >
                Create customer
              </Button>
            )}
          </>
        }
      />
      {resource.data?.integration.mode === "simulated" && (
        <Feedback message="Development simulation — customer changes are confirmed by the simulator. Real Pentana scraping is not connected yet." />
      )}
      {resource.data?.integration.mode === "disabled" && (
        <Feedback message="Source writes are disabled. You can view existing customers and manage local follow-ups." />
      )}
      {commandId && (
        <div className="my-4 rounded-xl border bg-white p-4">
          <ResourceState resource={command} />
          {command.data && (
            <>
              <p>
                Customer creation:{" "}
                <strong>{command.data.command.status}</strong>
              </p>
              {command.data.command.error && (
                <p className="mt-2 text-sm text-red-700">
                  {command.data.command.error.message}
                </p>
              )}
              {command.data.customer && (
                <Link
                  className="mt-2 inline-block font-semibold text-brand underline"
                  href={`/customers/${command.data.customer.id}`}
                >
                  Open confirmed customer
                </Link>
              )}
              {!command.data.customer && (
                <p className="mt-2 text-sm text-slate-500">
                  The customer appears in the list after acceptance.
                  Administrators can inspect unresolved writes in Sync
                  operations.
                </p>
              )}
            </>
          )}
        </div>
      )}
      <form
        className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          setTerm(search);
          setOffset(0);
        }}
      >
        <input
          aria-label="Search customers"
          className={inputClass}
          placeholder="Search name, email or phone"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          maxLength={60}
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>
      <ResourceState resource={resource} />
      {resource.data && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-bold text-slate-900">
              Customer directory
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Open a profile to view shared activity, contact details and
              follow-ups.
            </p>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {["Customer", "Contact", "Source", "Privacy", "Updated"].map(
                  (label) => (
                    <th className="p-4" key={label}>
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {resource.data.customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-t border-slate-100 transition-colors hover:bg-slate-50/80"
                >
                  <td className="p-4">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="font-bold text-brand hover:underline"
                    >
                      {customerName(customer)}
                    </Link>
                  </td>
                  <td className="p-4">
                    <p>{customer.email ?? "No email"}</p>
                    <p className="text-slate-500">
                      {customer.phone ?? "No phone"}
                    </p>
                  </td>
                  <td className="p-4">{customer.source}</td>
                  <td className="p-4">
                    <Badge
                      tone={customer.privacy?.do_not_contact ? "red" : "slate"}
                    >
                      {customer.privacy?.do_not_contact
                        ? "Do not contact"
                        : `Email: ${customer.privacy?.email ?? "unknown"}`}
                    </Badge>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    {timestamp(customer.updated_at, site.timezone)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!resource.data.customers.length && (
            <p className="p-8 text-center text-slate-500">
              No customers found. Create a customer or ask an administrator to
              load simulator records.
            </p>
          )}
        </div>
      )}
      <Pager
        page={resource.data?.pagination}
        offset={offset}
        setOffset={setOffset}
      />
      {create && (
        <ActionDialog
          title="Create customer"
          description="The record will appear after the source confirms creation."
          submitLabel="Submit customer"
          onClose={() => setCreate(false)}
          fields={[
            {
              name: "firstName",
              label: "First name",
              required: true,
              maxLength: 100,
            },
            {
              name: "lastName",
              label: "Last name",
              required: true,
              maxLength: 100,
            },
            { name: "email", label: "Email", type: "email" },
            { name: "phone", label: "Phone", type: "tel", maxLength: 40 },
          ]}
          onSubmit={async (values, key) => {
            const response = await api<{ command: Command }>("customers", {
              method: "POST",
              body: { ...values, siteId: site.id },
              key,
            });
            setCommandId(response.command.id);
          }}
        />
      )}
    </>
  );
}
