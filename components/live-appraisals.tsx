"use client";
import { useState } from "react";
import { api, query } from "@/lib/backend";
import type { Page } from "@/lib/backend-types";
import {
  ActionDialog,
  Pager,
  ResourceState,
  timestamp,
  useResource,
  type Field,
} from "./live-common";
import { Badge, Button, EmptyState, Modal } from "./ui";
import { useWorkspace } from "./workspace-provider";

type Appraisal = {
  id: string;
  make: string;
  model: string;
  year: number;
  odometer_km: number;
  registration: string | null;
  vin: string | null;
  condition_notes: string;
  valuation_notes: string | null;
  valuation_cents: number | null;
  status: string;
  withdrawal_reason: string | null;
  version: number;
  updated_at: string;
};
type Lead = { id: string; title: string; status: string };
const money = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});
function valuation(value: string | boolean) {
  if (value === "") return null;
  if (typeof value !== "string" || !/^\d+(\.\d{1,2})?$/.test(value))
    throw new Error("Enter a valuation with at most two decimal places.");
  const [dollars, fraction = ""] = value.split(".");
  return Number(dollars) * 100 + Number(fraction.padEnd(2, "0"));
}

export function LiveAppraisals({
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
  const [editor, setEditor] = useState<Appraisal | "new" | null>(null);
  const resource = useResource<{ appraisals: Appraisal[]; pagination: Page }>(
    `sales/leads/${lead.id}/appraisals?${query({ siteId: site.id, offset, limit: 5 })}`,
  );
  const appraisal = editor && editor !== "new" ? editor : undefined;
  const fields: Field[] = [
    {
      name: "make",
      label: "Make",
      value: appraisal?.make ?? "",
      required: true,
      maxLength: 100,
    },
    {
      name: "model",
      label: "Model",
      value: appraisal?.model ?? "",
      required: true,
      maxLength: 100,
    },
    {
      name: "year",
      label: "Year",
      type: "number",
      value: appraisal?.year ?? new Date().getFullYear(),
      required: true,
    },
    {
      name: "odometerKm",
      label: "Odometer (km)",
      type: "number",
      value: appraisal?.odometer_km ?? 0,
      required: true,
    },
    {
      name: "registration",
      label: "Registration (optional)",
      value: appraisal?.registration ?? "",
      maxLength: 30,
    },
    {
      name: "vin",
      label: "VIN (optional)",
      value: appraisal?.vin ?? "",
      maxLength: 17,
    },
    {
      name: "conditionNotes",
      label: "Condition and inspection notes",
      type: "textarea",
      value: appraisal?.condition_notes ?? "",
      required: true,
      minLength: 3,
      maxLength: 5000,
    },
    ...(appraisal
      ? [
          {
            name: "status",
            label: "Appraisal status",
            type: "select" as const,
            value: appraisal.status,
            options: ["draft", "valued", "withdrawn"].map((value) => ({
              value,
              label: value.charAt(0).toUpperCase() + value.slice(1),
            })),
          },
          {
            name: "valuation",
            label: "Internal valuation (AUD)",
            value:
              appraisal.valuation_cents == null
                ? ""
                : (appraisal.valuation_cents / 100).toFixed(2),
            hint: "Required for Valued. This is an internal estimate.",
          },
          {
            name: "valuationNotes",
            label: "Valuation notes",
            type: "textarea" as const,
            value: appraisal.valuation_notes ?? "",
            maxLength: 5000,
            hint: "Required for Valued. Record your assessment and assumptions.",
          },
          {
            name: "withdrawalReason",
            label: "Withdrawal reason",
            type: "textarea" as const,
            value: appraisal.withdrawal_reason ?? "",
            maxLength: 1000,
            hint: "Required when selecting Withdrawn.",
          },
        ]
      : []),
  ];
  return (
    <>
      {!editor && (
        <Modal
          open
          title="Trade-in appraisals"
          description={lead.title}
          onClose={onClose}
        >
          <div className="p-5">
            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm leading-6 text-slate-600">
                Local trade-in assessments linked to this customer enquiry.
                Valuations are internal estimates; they do not create an offer,
                deal or stock record.
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
                    New appraisal
                  </Button>
                )}
              </div>
              {lead.status === "closed" && (
                <p className="mt-3 text-xs text-amber-700">
                  Reopen the enquiry before creating or editing appraisals.
                </p>
              )}
            </div>
            <ResourceState resource={resource} />
            {resource.data && !resource.data.appraisals.length && (
              <EmptyState
                icon="car"
                title="No trade-ins recorded"
                description="Add the customer’s vehicle details and inspection notes to begin a draft appraisal."
              />
            )}
            <div className="space-y-4">
              {resource.data?.appraisals.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="break-words font-bold text-slate-900">
                      {item.year} {item.make} {item.model}
                    </h3>
                    <Badge
                      tone={
                        item.status === "valued"
                          ? "green"
                          : item.status === "withdrawn"
                            ? "red"
                            : "slate"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {item.odometer_km.toLocaleString()} km ·{" "}
                    {item.registration ?? "Registration not recorded"}
                  </p>
                  {item.vin && (
                    <p className="mt-1 break-all text-xs text-slate-400">
                      VIN {item.vin}
                    </p>
                  )}
                  <div className="mt-4 rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Internal estimate
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {item.valuation_cents === null
                        ? "Not valued"
                        : money.format(item.valuation_cents / 100)}
                    </p>
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Condition
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                    {item.condition_notes}
                  </p>
                  {item.valuation_notes && (
                    <>
                      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Valuation notes
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                        {item.valuation_notes}
                      </p>
                    </>
                  )}
                  {item.withdrawal_reason && (
                    <p className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                      Withdrawn: {item.withdrawal_reason}
                    </p>
                  )}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <span className="text-xs text-slate-400">
                      Updated {timestamp(item.updated_at, site.timezone)}
                    </span>
                    {can("sales.write") && (
                      <Button
                        variant="secondary"
                        disabled={lead.status === "closed"}
                        onClick={() => setEditor(item)}
                      >
                        Edit / value
                      </Button>
                    )}
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
          title={
            appraisal ? "Edit trade-in appraisal" : "New trade-in appraisal"
          }
          description="Record your vehicle inspection. Drafts can be valued later; valuation and withdrawal states require supporting notes."
          fields={fields}
          onClose={() => setEditor(null)}
          onSubmit={async (values, key) => {
            const body = {
              siteId: site.id,
              make: values.make,
              model: values.model,
              year: Number(values.year),
              odometerKm: Number(values.odometerKm),
              registration: values.registration || null,
              vin: values.vin || null,
              conditionNotes: values.conditionNotes,
              ...(appraisal
                ? {
                    version: appraisal.version,
                    status: values.status,
                    valuationCents: valuation(values.valuation),
                    valuationNotes: values.valuationNotes || null,
                    withdrawalReason: values.withdrawalReason || null,
                  }
                : {}),
            };
            await api(
              appraisal
                ? `sales/leads/${lead.id}/appraisals/${appraisal.id}`
                : `sales/leads/${lead.id}/appraisals`,
              {
                method: appraisal ? "PATCH" : "POST",
                body,
                ...(appraisal ? {} : { key }),
              },
            );
            resource.reload();
            onSaved();
          }}
        />
      )}
    </>
  );
}
