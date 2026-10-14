"use client";
import { useState } from "react";
import { api, query } from "@/lib/backend";
import type { Page } from "@/lib/backend-types";
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
import { Badge, Button, EmptyState, Modal } from "./ui";
import { useWorkspace } from "./workspace-provider";
import { LiveReservations } from "./live-reservations";

type Lead = { id: string; title: string; status: string };
type Deal = {
  reservation?: { expiresAt: string } | null;
  id: string;
  stock_id: string;
  stock_label: string;
  appraisal_id: string | null;
  sale_price_cents: number;
  discount_cents: number;
  fees_cents: number;
  trade_in_cents: number;
  total_cents: number;
  status: string;
  notes: string;
  review_note: string | null;
  reviewed_at: string | null;
  version: number;
  updated_at: string;
};
const money = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});
function cents(value: string | boolean, label: string) {
  if (typeof value !== "string" || !/^\d+(\.\d{1,2})?$/.test(value))
    throw new Error(
      `${label}: enter a nonnegative amount with at most two decimal places.`,
    );
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function LiveDeals({
  lead,
  onClose,
  onSaved,
}: {
  lead: Lead;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { site, can } = useWorkspace();
  const [offset, setOffset] = useState(0);
  const [editor, setEditor] = useState<Deal | "new" | null>(null);
  const [action, setAction] = useState<{ deal: Deal; name: string } | null>(
    null,
  );
  const [reservationDeal, setReservationDeal] = useState<Deal | null>(null);
  const resource = useResource<{ deals: Deal[]; pagination: Page }>(
    `sales/leads/${lead.id}/deals?${query({ siteId: site.id, offset, limit: 5 })}`,
  );
  const stock = useDirectory<{
    id: string;
    stock_number: string;
    make: string;
    model: string;
    price_cents: number | null;
  }>(
    editor === "new" ? `sales/stock?siteId=${site.id}&status=available` : null,
    "vehicles",
  );
  const appraisals = useDirectory<{
    id: string;
    make: string;
    model: string;
    status: string;
    valuation_cents: number | null;
  }>(
    editor ? `sales/leads/${lead.id}/appraisals?siteId=${site.id}` : null,
    "appraisals",
  );
  const deal = editor && editor !== "new" ? editor : undefined;
  const fields: Field[] = [
    ...(!deal
      ? [
          {
            name: "stockId",
            label: "Vehicle",
            type: "select" as const,
            required: true,
            options: [
              { value: "", label: "Choose available stock" },
              ...stock.items.map((item) => ({
                value: item.id,
                label: `${item.stock_number} · ${item.make} ${item.model} · ${item.price_cents == null ? "Price on enquiry" : money.format(item.price_cents / 100)}`,
              })),
            ],
          },
        ]
      : []),
    {
      name: "appraisalId",
      label: "Trade-in appraisal",
      type: "select",
      value: deal?.appraisal_id ?? "",
      options: [
        { value: "", label: "No trade-in credit" },
        ...appraisals.items
          .filter((item) => item.status === "valued")
          .map((item) => ({
            value: item.id,
            label: `${item.make} ${item.model} · ${money.format((item.valuation_cents ?? 0) / 100)}`,
          })),
        ...(deal?.appraisal_id &&
        !appraisals.items.some(
          (item) => item.id === deal.appraisal_id && item.status === "valued",
        )
          ? [
              {
                value: deal.appraisal_id,
                label:
                  "Previously selected appraisal — unavailable; choose another or none",
              },
            ]
          : []),
      ],
      hint: "The server uses the selected appraisal’s current valuation. It cannot be overridden here.",
    },
    {
      name: "salePrice",
      label: "Vehicle sale price (AUD)",
      value: deal ? (deal.sale_price_cents / 100).toFixed(2) : "",
      required: true,
      hint: "Enter the proposed sale price. All amounts are recorded in AUD.",
    },
    {
      name: "discount",
      label: "Discount (AUD)",
      value: deal ? (deal.discount_cents / 100).toFixed(2) : "0.00",
      required: true,
    },
    {
      name: "fees",
      label: "Total fees (AUD)",
      value: deal ? (deal.fees_cents / 100).toFixed(2) : "0.00",
      required: true,
      hint: "Enter the applicable fee total; tax and fee rules are not calculated automatically.",
    },
    {
      name: "notes",
      label: "Pricing and proposal notes",
      type: "textarea",
      value: deal?.notes ?? "",
      required: true,
      minLength: 3,
      maxLength: 5000,
    },
  ];
  function actions(item: Deal) {
    const names: string[] = [];
    if (
      can("sales.write") &&
      item.status === "draft" &&
      lead.status !== "closed"
    )
      names.push("submit");
    if (can("sales.approve_deals") && item.status === "submitted") {
      if (lead.status !== "closed") names.push("approve");
      names.push("reject");
    }
    if (
      can("sales.write") &&
      item.status !== "cancelled" &&
      (item.status !== "approved" || can("sales.approve_deals"))
    )
      names.push("cancel");
    return names;
  }
  return (
    <>
      {!editor && !action && !reservationDeal && (
        <Modal
          open
          title="Deal proposals"
          description={lead.title}
          onClose={onClose}
        >
          <div className="p-5">
            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm leading-6 text-slate-600">
                Prepare an internal vehicle proposal and send it for Admin
                approval. This does not reserve stock, collect payment or create
                a binding agreement.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={resource.reload}>
                  Refresh
                </Button>
                {can("sales.write") && (
                  <Button
                    disabled={lead.status === "closed"}
                    onClick={() => setEditor("new")}
                  >
                    New proposal
                  </Button>
                )}
              </div>
              {lead.status === "closed" && (
                <p className="mt-3 text-xs text-amber-700">
                  Reopen the enquiry before preparing or submitting proposals.
                </p>
              )}
            </div>
            <ResourceState resource={resource} />
            {resource.data && !resource.data.deals.length && (
              <EmptyState
                icon="car"
                title="No deal proposals"
                description="Choose a vehicle and optional valued trade-in to start an internal proposal."
              />
            )}
            <div className="space-y-4">
              {resource.data?.deals.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="break-words font-bold text-slate-900">
                      {item.stock_label}
                    </h3>
                    <Badge
                      tone={
                        item.status === "approved"
                          ? "green"
                          : item.status === "rejected" ||
                              item.status === "cancelled"
                            ? "red"
                            : "slate"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <dl className="mt-4 space-y-2 rounded-lg bg-slate-50 p-4 text-sm">
                    {[
                      ["Vehicle sale price", item.sale_price_cents],
                      ["Discount", -item.discount_cents],
                      ["Fees", item.fees_cents],
                      ["Trade-in credit", -item.trade_in_cents],
                    ].map(([label, amount]) => (
                      <div
                        key={String(label)}
                        className="flex justify-between gap-3"
                      >
                        <dt className="text-slate-500">{label}</dt>
                        <dd className="font-semibold text-slate-700">
                          {money.format(Number(amount) / 100)}
                        </dd>
                      </div>
                    ))}
                    <div className="flex justify-between gap-3 border-t border-slate-200 pt-3">
                      <dt className="font-bold text-slate-800">
                        Net proposal total
                      </dt>
                      <dd className="text-lg font-bold text-slate-900">
                        {money.format(item.total_cents / 100)}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                    {item.notes}
                  </p>
                  {item.review_note && (
                    <div className="mt-4 rounded-lg border border-slate-200 p-3">
                      <p className="text-xs font-semibold text-slate-400">
                        Admin review{" "}
                        {item.reviewed_at
                          ? `· ${timestamp(item.reviewed_at, site.timezone)}`
                          : ""}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">
                        {item.review_note}
                      </p>
                    </div>
                  )}
                  <p className="mt-4 text-xs text-slate-400">
                    Updated {timestamp(item.updated_at, site.timezone)} ·
                    Revision {item.version}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    {can("sales.write") &&
                      ["draft", "rejected"].includes(item.status) && (
                        <Button
                          variant="secondary"
                          disabled={lead.status === "closed"}
                          onClick={() => setEditor(item)}
                        >
                          Edit pricing
                        </Button>
                      )}
                    <Button
                      variant="secondary"
                      onClick={() => setReservationDeal(item)}
                    >
                      Reservation
                    </Button>
                    {item.reservation && (
                      <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                        Reserved until{" "}
                        {timestamp(item.reservation.expiresAt, site.timezone)}
                      </p>
                    )}
                    {actions(item).map((name) => (
                      <Button
                        key={name}
                        variant={
                          name === "submit" || name === "approve"
                            ? "primary"
                            : "secondary"
                        }
                        onClick={() => setAction({ deal: item, name })}
                      >
                        {name.charAt(0).toUpperCase() + name.slice(1)}
                      </Button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            <Pager
              page={resource.data?.pagination}
              offset={offset}
              setOffset={setOffset}
            />
          </div>
        </Modal>
      )}
      {editor && (
        <ActionDialog
          title={deal ? "Edit proposal pricing" : "New deal proposal"}
          description={
            deal
              ? `Vehicle: ${deal.stock_label}. Saving refreshes vehicle/appraisal snapshots and returns the proposal to Draft.`
              : "Select available stock, enter pricing and record your assumptions. The server calculates the total after saving."
          }
          fields={fields}
          onClose={() => setEditor(null)}
          onSubmit={async (values, key) => {
            if (
              stock.loading ||
              appraisals.loading ||
              stock.error ||
              appraisals.error
            )
              throw new Error(
                stock.error ||
                  appraisals.error ||
                  "Wait for vehicle and appraisal choices to load.",
              );
            const body = {
              siteId: site.id,
              appraisalId: values.appraisalId || null,
              salePriceCents: cents(values.salePrice, "Sale price"),
              discountCents: cents(values.discount, "Discount"),
              feesCents: cents(values.fees, "Fees"),
              notes: values.notes,
              ...(deal
                ? { version: deal.version }
                : { stockId: values.stockId }),
            };
            await api(
              deal
                ? `sales/leads/${lead.id}/deals/${deal.id}`
                : `sales/leads/${lead.id}/deals`,
              {
                method: deal ? "PATCH" : "POST",
                body,
                ...(deal ? {} : { key }),
              },
            );
            resource.reload();
            onSaved();
          }}
        >
          <Feedback error={stock.error || appraisals.error} />
        </ActionDialog>
      )}
      {action && (
        <ActionDialog
          title={`${action.name.charAt(0).toUpperCase() + action.name.slice(1)} proposal`}
          description={`${action.deal.stock_label} · ${money.format(action.deal.total_cents / 100)}. This is an internal proposal action; no payment or stock reservation occurs.`}
          fields={[
            {
              name: "note",
              label: "Decision note",
              type: "textarea",
              required: true,
              minLength: 3,
              maxLength: 1000,
            },
          ]}
          onClose={() => setAction(null)}
          onSubmit={async (values) => {
            await api(`sales/leads/${lead.id}/deals/${action.deal.id}/status`, {
              method: "PATCH",
              body: {
                siteId: site.id,
                version: action.deal.version,
                action: action.name,
                note: values.note,
              },
            });
            resource.reload();
            onSaved();
          }}
        />
      )}
      {reservationDeal && (
        <LiveReservations
          leadId={lead.id}
          deal={reservationDeal}
          onClose={() => setReservationDeal(null)}
          onSaved={() => {
            resource.reload();
            onSaved();
          }}
        />
      )}
    </>
  );
}
