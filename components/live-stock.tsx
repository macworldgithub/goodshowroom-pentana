"use client";
import { useState } from "react";
import { api, query } from "@/lib/backend";
import type { Integration, Page } from "@/lib/backend-types";
import {
  ActionDialog,
  Feedback,
  Pager,
  ResourceState,
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
import { useWorkspace } from "./workspace-provider";

type Vehicle = {
  availability?: string;
  reservation?: { expiresAt: string } | null;
  id: string;
  brand_id: string;
  stock_number: string;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  odometer_km: number;
  vin: string | null;
  colour: string | null;
  body_type: string;
  fuel_type: string;
  transmission: string;
  price_cents: number | null;
  currency: string;
  status: string;
  version: number;
};
type Lead = {
  id: string;
  title: string;
  version: number;
  stock_ids?: string[];
  status: string;
};
const prices = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});
function cents(value: string | boolean) {
  if (value === "") return null;
  if (typeof value !== "string" || !/^\d+(\.\d{1,2})?$/.test(value))
    throw new Error("Enter a price with at most two decimal places.");
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function LiveStock() {
  const { site, can } = useWorkspace();
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("available");
  const [brand, setBrand] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filters, setFilters] = useState<{
    bodyType?: string;
    maxPriceCents?: number;
  }>({});
  const [offset, setOffset] = useState(0);
  const [leadId, setLeadId] = useState("");
  const [editor, setEditor] = useState<Vehicle | "new" | null>(null);
  const [matching, setMatching] = useState<{
    vehicle: Vehicle;
    lead: Lead;
    action: "add" | "remove";
  } | null>(null);
  const [error, setError] = useState("");
  const resource = useResource<{
    vehicles: Vehicle[];
    pagination: Page;
    integration: Integration;
  }>(
    `sales/stock?${query({ siteId: site.id, search: term || undefined, status: status || undefined, brandId: brand || undefined, ...filters, offset, limit: 12 })}`,
  );
  const brands = useDirectory<{
    id: string;
    name: string;
    permissions: string[];
  }>(`sites/${site.id}/brands`, "brands");
  const leads = useDirectory<Lead>(
    can("sales.write") ? `sales/leads?siteId=${site.id}` : null,
    "leads",
  );
  const selected = useResource<{ lead: Lead }>(
    leadId ? `sales/leads/${leadId}?siteId=${site.id}` : null,
  );
  const vehicle = editor && editor !== "new" ? editor : undefined;
  const fields: Field[] = [
    ...(!vehicle
      ? [
          {
            name: "brandId",
            label: "Site brand",
            type: "select" as const,
            required: true,
            options: [
              { value: "", label: "Choose a mapped brand" },
              ...brands.items
                .filter((item) => item.permissions.includes("sales.write"))
                .map((item) => ({ value: item.id, label: item.name })),
            ],
          },
        ]
      : []),
    {
      name: "stockNumber",
      label: "Stock number",
      value: vehicle?.stock_number ?? "",
      required: true,
      maxLength: 60,
    },
    {
      name: "make",
      label: "Make",
      value: vehicle?.make ?? "",
      required: true,
      maxLength: 100,
    },
    {
      name: "model",
      label: "Model",
      value: vehicle?.model ?? "",
      required: true,
      maxLength: 100,
    },
    {
      name: "variant",
      label: "Variant",
      value: vehicle?.variant ?? "",
      maxLength: 100,
    },
    {
      name: "year",
      label: "Year",
      type: "number",
      value: vehicle?.year ?? new Date().getFullYear(),
      required: true,
    },
    {
      name: "odometerKm",
      label: "Odometer (km)",
      type: "number",
      value: vehicle?.odometer_km ?? 0,
      required: true,
    },
    {
      name: "bodyType",
      label: "Body type",
      value: vehicle?.body_type ?? "SUV",
      required: true,
      maxLength: 60,
    },
    {
      name: "fuelType",
      label: "Fuel type",
      value: vehicle?.fuel_type ?? "Petrol",
      required: true,
      maxLength: 60,
    },
    {
      name: "transmission",
      label: "Transmission",
      value: vehicle?.transmission ?? "Automatic",
      required: true,
      maxLength: 60,
    },
    {
      name: "colour",
      label: "Colour",
      value: vehicle?.colour ?? "",
      maxLength: 100,
    },
    {
      name: "vin",
      label: "VIN (optional)",
      value: vehicle?.vin ?? "",
      maxLength: 17,
    },
    {
      name: "price",
      label: "Advertised price (AUD)",
      value:
        vehicle?.price_cents == null
          ? ""
          : (vehicle.price_cents / 100).toFixed(2),
      hint: "Optional. Enter dollars, for example 34990.00.",
    },
    ...(vehicle
      ? [
          {
            name: "status",
            label: "Availability",
            type: "select" as const,
            value: vehicle.status,
            options: ["available", "incoming", "sold", "unavailable"].map((value) => ({
              value,
              label: value.charAt(0).toUpperCase() + value.slice(1),
            })),
          },
        ]
      : []),
  ];
  return (
    <>
      <PageHeader
        title="Stock match"
        eyebrow={site.name}
        description="Find a vehicle for your customer and keep an enquiry shortlist. Shortlisting does not reserve stock."
        actions={
          <>
            <Button variant="secondary" onClick={resource.reload}>
              Refresh
            </Button>
            {can("stock.manage") &&
              resource.data?.integration.mode === "simulated" && (
                <Button onClick={() => setEditor("new")}>
                  Add simulated vehicle
                </Button>
              )}
          </>
        }
      />
      {resource.data?.integration.mode === "simulated" && (
        <Feedback message="Development simulation — these vehicles are test stock. Real Pentana stock scraping is not connected." />
      )}
      <Feedback error={error || brands.error || leads.error} />
      <Panel className="mb-5">
        <PanelHeading
          title="Vehicle search"
          description="Filter stock by availability, brand, vehicle details and advertised price."
        />
        <form
          className="space-y-4 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            try {
              const price = cents(maxPrice);
              setFilters({
                bodyType: bodyType.trim() || undefined,
                maxPriceCents: price ?? undefined,
              });
              setTerm(search.trim());
              setOffset(0);
              setError("");
            } catch (cause) {
              setError(
                cause instanceof Error ? cause.message : "Invalid filters",
              );
            }
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <label className="text-xs font-semibold text-slate-600">
              Search
              <input
                className={inputClass}
                placeholder="Stock number, make, model or VIN"
                value={search}
                maxLength={60}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Brand
              <select
                className={inputClass}
                value={brand}
                onChange={(event) => {
                  setBrand(event.target.value);
                  setOffset(0);
                }}
              >
                <option value="">All accessible brands</option>
                {brands.items
                  .filter((item) => item.permissions.includes("sales.read"))
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Availability
              <select
                className={inputClass}
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setOffset(0);
                }}
              >
                <option value="">All availability</option>
                {["available", "incoming", "reserved", "sold", "unavailable"].map(
                  (value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Body type
              <input
                className={inputClass}
                placeholder="For example SUV"
                value={bodyType}
                maxLength={60}
                onChange={(event) => setBodyType(event.target.value)}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Maximum price (AUD)
              <input
                className={inputClass}
                inputMode="decimal"
                placeholder="Any price"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
              />
            </label>
            <div className="flex items-end">
              <Button type="submit" variant="secondary">
                Apply filters
              </Button>
            </div>
          </div>
        </form>
      </Panel>
      {can("sales.write") && (
        <Panel className="mb-5">
          <PanelHeading
            title="Match to an enquiry"
            description="Choose an enquiry, then shortlist an available vehicle below. Existing follow-ups stay in My Day."
          />
          <div className="p-5">
            <select
              aria-label="Enquiry to match stock"
              className={inputClass}
              value={leadId}
              onChange={(event) => setLeadId(event.target.value)}
            >
              <option value="">
                Choose an enquiry to review its shortlist
              </option>
              {leads.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                  {item.status === "closed" ? " (closed)" : ""}
                </option>
              ))}
            </select>
            <ResourceState resource={selected} />
            {selected.data && (
              <p className="mt-3 text-sm text-slate-500">
                {selected.data.lead.stock_ids?.length ?? 0} shortlisted
                vehicles. Use all availability to review vehicles that later
                became unavailable; site and brand filters still apply.
              </p>
            )}
          </div>
        </Panel>
      )}
      <ResourceState resource={resource} />
      {resource.data && !resource.data.vehicles.length && (
        <Panel>
          <EmptyState
            icon="car"
            title="No stock matches these filters"
            description={
              brands.items.length
                ? "Try another search or availability. An administrator can add simulated vehicles for testing."
                : "An administrator must map a brand to this site before adding simulated stock."
            }
          />
        </Panel>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resource.data?.vehicles.map((item) => {
          const matched =
            selected.data?.lead.stock_ids?.includes(item.id) ?? false;
          return (
            <Panel key={item.id} className="flex flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
                <span className="text-xs font-bold text-slate-500">
                  {item.stock_number}
                </span>
                <Badge tone={item.status === "available" ? "green" : "slate"}>
                  {item.availability ?? item.status}
                </Badge>
              </div>
              <div className="flex-1 p-5">
                <h2 className="break-words text-lg font-bold text-slate-900">
                  {item.year} {item.make} {item.model}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {item.variant || "Variant not recorded"}
                </p>
                <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                  {item.price_cents === null
                    ? "Price on enquiry"
                    : prices.format(item.price_cents / 100)}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Odometer", `${item.odometer_km.toLocaleString()} km`],
                    ["Body", item.body_type],
                    ["Fuel", item.fuel_type],
                    ["Transmission", item.transmission],
                    ["Colour", item.colour ?? "Not recorded"],
                    [
                      "Brand",
                      brands.items.find((brand) => brand.id === item.brand_id)
                        ?.name ?? "Site brand",
                    ],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-slate-400">{label}</dt>
                      <dd className="mt-1 break-words font-semibold text-slate-700">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
                {item.vin && (
                  <p className="mt-4 break-all text-xs text-slate-400">
                    VIN {item.vin}
                  </p>
                )}
                {item.reservation && (
                  <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                    Reserved until{" "}
                    {new Date(item.reservation.expiresAt).toLocaleString(
                      "en-AU",
                      { timeZone: site.timezone },
                    )}
                  </p>
                )}
                {matched && (
                  <div className="mt-4">
                    <Badge tone="blue">Shortlisted for selected enquiry</Badge>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 border-t border-slate-100 p-4">
                {can("sales.write") && selected.data && (
                  <Button
                    variant={matched ? "secondary" : "primary"}
                    disabled={
                      !matched &&
                      (item.status !== "available" ||
                        !!item.reservation ||
                        selected.data.lead.status === "closed")
                    }
                    onClick={() =>
                      setMatching({
                        vehicle: item,
                        lead: selected.data!.lead,
                        action: matched ? "remove" : "add",
                      })
                    }
                  >
                    {matched ? "Remove from shortlist" : "Shortlist vehicle"}
                  </Button>
                )}
                {can("stock.manage") &&
                  resource.data?.integration.mode === "simulated" && (
                    <Button variant="secondary" onClick={() => setEditor(item)}>
                      Edit stock
                    </Button>
                  )}
              </div>
            </Panel>
          );
        })}
      </div>
      <Pager
        page={resource.data?.pagination}
        offset={offset}
        setOffset={setOffset}
      />
      {editor && (
        <ActionDialog
          title={vehicle ? "Edit simulated stock" : "Add simulated vehicle"}
          description="Development stock only. This does not write to Pentana or reserve a vehicle. Site and brand cannot be changed after creation."
          fields={fields}
          onClose={() => setEditor(null)}
          onSubmit={async (values, key) => {
            if (brands.loading || brands.error)
              throw new Error(brands.error || "Wait for site brands to load.");
            const body = {
              siteId: site.id,
              stockNumber: values.stockNumber,
              make: values.make,
              model: values.model,
              variant: values.variant || null,
              year: Number(values.year),
              odometerKm: Number(values.odometerKm),
              bodyType: values.bodyType,
              fuelType: values.fuelType,
              transmission: values.transmission,
              colour: values.colour || null,
              vin: values.vin || null,
              priceCents: cents(values.price),
              ...(vehicle
                ? { version: vehicle.version, status: values.status }
                : { brandId: values.brandId }),
            };
            await api(vehicle ? `sales/stock/${vehicle.id}` : "sales/stock", {
              method: vehicle ? "PATCH" : "POST",
              body,
              ...(vehicle ? {} : { key }),
            });
            resource.reload();
          }}
        />
      )}
      {matching && (
        <ActionDialog
          title={
            matching.action === "add"
              ? "Shortlist vehicle"
              : "Remove shortlisted vehicle"
          }
          description={`${matching.vehicle.make} ${matching.vehicle.model} for ${matching.lead.title}. This does not reserve or release a vehicle.`}
          fields={[
            {
              name: "note",
              label: "Matching note",
              type: "textarea",
              required: true,
              minLength: 3,
              maxLength: 1000,
            },
          ]}
          onClose={() => setMatching(null)}
          onSubmit={async (values) => {
            await api(`sales/leads/${matching.lead.id}/stock`, {
              method: "PATCH",
              body: {
                siteId: site.id,
                version: matching.lead.version,
                stockId: matching.vehicle.id,
                action: matching.action,
                note: values.note,
              },
            });
            selected.reload();
            leads.reload();
          }}
        />
      )}
    </>
  );
}
