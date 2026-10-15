"use client";
import Link from "next/link";
import { useState } from "react";
import { api, query } from "@/lib/backend";
import type { Page } from "@/lib/backend-types";
import {
  ActionDialog,
  Pager,
  ResourceState,
  timestamp,
  useResource,
} from "./live-common";
import {
  Badge,
  Button,
  EmptyState,
  inputClass,
  Modal,
  PageHeader,
  Panel,
  PanelHeading,
} from "./ui";
import { useWorkspace } from "./workspace-provider";
import { LiveAppraisals } from "./live-appraisals";
import { LiveDeals } from "./live-deals";

const stageNames: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  test_drive: "Test drive",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
  closed: "Closed (existing)",
};
type Lead = {
  status: string;
  id: string;
  title: string;
  customer_id: string;
  source: string;
  assigned_to: string;
  vehicle_interest: string | null;
  pipeline_stage: string;
  version: number;
  updated_at: string;
};
type History = {
  id: string;
  type: string;
  occurredAt: string;
  author: { id: string; fullName: string | null };
  fromStage: string | null;
  toStage: string | null;
  reason: string | null;
  fields: string[];
  version: number | null;
  stockLabel?: string | null;
  appraisalLabel?: string | null;
  appraisalStatus?: string | null;
  appraisalValuationCents?: number | null;
  dealId?: string | null;
  dealStatus?: string | null;
  dealTotalCents?: number | null;
  reservationId?: string | null;
  reservationStatus?: string | null;
  reservationExpiresAt?: string | null;
  deliveryId?: string | null;
  deliveryStatus?: string | null;
  deliveryScheduledAt?: string | null;
};

function EnquiryHistory({
  lead,
  onClose,
}: {
  lead: Lead;
  onClose: () => void;
}) {
  const { site } = useWorkspace();
  const [offset, setOffset] = useState(0);
  const resource = useResource<{
    lead: Lead;
    history: History[];
    pagination: Page;
  }>(
    `sales/pipeline/${lead.id}/history?${query({ siteId: site.id, offset, limit: 10 })}`,
  );
  return (
    <Modal
      open
      title="Enquiry progress"
      description={lead.title}
      onClose={onClose}
    >
      <div className="p-5">
        <ResourceState resource={resource} />
        {resource.data?.history.map((event) => (
          <article
            key={event.id}
            className="relative mb-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                {event.type === "sales.lead_created"
                  ? "Enquiry created"
                  : event.type === "sales.stage_changed"
                    ? "Pipeline stage changed"
                    : event.type === "sales.stock_matched"
                      ? "Vehicle shortlisted"
                      : event.type === "sales.stock_removed"
                        ? "Vehicle removed from shortlist"
                        : event.type === "sales.appraisal_created"
                          ? "Trade-in appraisal created"
                          : event.type === "sales.appraisal_updated"
                            ? "Trade-in appraisal updated"
                            : event.type.startsWith("sales.reservation_")
                              ? `Reservation ${event.type.replace("sales.reservation_", "")}`
                              : event.type.startsWith("sales.delivery_")
                                ? `Delivery ${event.type.replace("sales.delivery_", "")}`
                                : event.type.startsWith("sales.deal_")
                                  ? `Deal ${event.type.replace("sales.deal_", "")}`
                                  : "Enquiry updated"}
              </h3>
              <span className="text-xs text-slate-500">
                {timestamp(event.occurredAt, site.timezone)}
              </span>
            </div>
            {event.toStage && event.fromStage !== event.toStage && (
              <p className="mt-2 text-sm font-semibold text-brand">
                {event.fromStage
                  ? `${stageNames[event.fromStage] ?? event.fromStage} → `
                  : ""}
                {stageNames[event.toStage] ?? event.toStage}
              </p>
            )}
            {event.reason && (
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                {event.reason}
              </p>
            )}
            {event.stockLabel && (
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {event.stockLabel}
              </p>
            )}
            {event.appraisalLabel && (
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {event.appraisalLabel} · {event.appraisalStatus}
                {event.appraisalValuationCents != null &&
                  ` · ${new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(event.appraisalValuationCents / 100)}`}
              </p>
            )}
            {event.dealId && event.dealStatus && (
              <p className="mt-2 text-sm font-semibold text-slate-700">
                Proposal {event.dealStatus} ·{" "}
                {new Intl.NumberFormat("en-AU", {
                  style: "currency",
                  currency: "AUD",
                }).format((event.dealTotalCents ?? 0) / 100)}
              </p>
            )}
            {event.reservationId && (
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {event.reservationStatus} · Expiry{" "}
                {event.reservationExpiresAt
                  ? timestamp(event.reservationExpiresAt, site.timezone)
                  : "Not recorded"}
              </p>
            )}
            {event.deliveryId && (
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {event.deliveryStatus} · Planned{" "}
                {event.deliveryScheduledAt
                  ? timestamp(event.deliveryScheduledAt, site.timezone)
                  : "Not recorded"}
              </p>
            )}
            {!!event.fields.length && (
              <p className="mt-2 text-xs text-slate-500">
                Changed:{" "}
                {event.fields
                  .map((field) => field.replaceAll("_", " "))
                  .join(", ")}
              </p>
            )}
            <p className="mt-3 break-words text-xs text-slate-400">
              {event.author.fullName ?? `Staff ${event.author.id}`}{" "}
              {event.version !== null ? `· Revision ${event.version}` : ""}
            </p>
          </article>
        ))}
        {resource.data && !resource.data.history.length && (
          <EmptyState
            icon="clock"
            title="No progress recorded"
            description="Future enquiry changes will appear here with their author and time."
          />
        )}
        <Pager
          page={resource.data?.pagination}
          offset={offset}
          setOffset={setOffset}
        />
      </div>
    </Modal>
  );
}

export function LivePipeline() {
  const { site, context, can } = useWorkspace();
  const [stage, setStage] = useState("");
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [offset, setOffset] = useState(0);
  const [moving, setMoving] = useState<Lead | null>(null);
  const [history, setHistory] = useState<Lead | null>(null);
  const [appraisalLead, setAppraisalLead] = useState<Lead | null>(null);
  const [dealLead, setDealLead] = useState<Lead | null>(null);
  const resource = useResource<{
    leads: Lead[];
    stages: { id: string; count: number }[];
    pagination: Page;
    visibility: string;
  }>(
    `sales/pipeline?${query({ siteId: site.id, stage: stage || undefined, search: term, offset, limit: 20 })}`,
  );
  return (
    <>
      <PageHeader
        eyebrow={site.name}
        title="Sales desk"
        description="Track each enquiry’s progress and keep a clear record of the next decision."
        actions={
          <>
            <Button variant="secondary" onClick={resource.reload}>
              Refresh
            </Button>
            <Link
              href="/leads"
              className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white"
            >
              Manage enquiries
            </Link>
          </>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {Object.entries(stageNames).map(([id, name]) => (
          <button
            key={id}
            aria-pressed={stage === id}
            onClick={() => {
              setStage(stage === id ? "" : id);
              setOffset(0);
            }}
            className={`rounded-xl border p-4 text-left shadow-sm transition focus-visible:outline-2 focus-visible:outline-brand ${stage === id ? "border-brand bg-red-50" : "border-slate-200 bg-white hover:border-slate-400"}`}
          >
            <span className="block text-xs font-semibold text-slate-500">
              {name}
            </span>
            <strong className="mt-2 block text-2xl font-bold text-slate-900">
              {resource.data?.stages.find((item) => item.id === id)?.count ??
                "—"}
            </strong>
          </button>
        ))}
      </div>
      <Panel className="mb-5">
        <PanelHeading
          title="Pipeline filters"
          description={
            can("sales.view_team")
              ? "Site team enquiries. Stage counts reflect your search across all stages."
              : "Your assigned enquiries. Stage counts reflect your search across all stages."
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
            className={inputClass}
            aria-label="Search pipeline titles"
            placeholder="Search enquiry titles"
            value={search}
            maxLength={60}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className={inputClass}
            aria-label="Pipeline stage"
            value={stage}
            onChange={(event) => {
              setStage(event.target.value);
              setOffset(0);
            }}
          >
            <option value="">All stages</option>
            {Object.entries(stageNames).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
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
          title={stage ? stageNames[stage] : "All pipeline enquiries"}
          description="Move stages with a progress note, or open the full enquiry history."
        />
        {resource.data && !resource.data.leads.length && (
          <EmptyState
            icon="pipeline"
            title="No enquiries in this view"
            description="Choose another stage or create an enquiry from Sales enquiries."
          />
        )}
        <div className="divide-y divide-slate-100">
          {resource.data?.leads.map((lead) => (
            <article
              key={lead.id}
              className="flex flex-col justify-between gap-4 p-5 lg:flex-row"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="break-words font-bold text-slate-900">
                    {lead.title}
                  </h3>
                  <Badge
                    tone={
                      lead.pipeline_stage === "won"
                        ? "green"
                        : lead.pipeline_stage === "lost"
                          ? "red"
                          : "slate"
                    }
                  >
                    {stageNames[lead.pipeline_stage]}
                  </Badge>
                </div>
                <p className="mt-2 break-words text-sm text-slate-500">
                  {lead.source} ·{" "}
                  {lead.vehicle_interest || "Vehicle interest not recorded"}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {lead.assigned_to === context.user.id
                    ? "Assigned to you"
                    : "Assigned to team member"}{" "}
                  · Updated {timestamp(lead.updated_at, site.timezone)}
                </p>
                <Link
                  href={`/customers/${lead.customer_id}`}
                  className="mt-3 inline-block text-sm font-semibold text-brand hover:underline"
                >
                  Open customer
                </Link>
              </div>
              <div className="flex flex-wrap items-start gap-2">
                <Button variant="secondary" onClick={() => setHistory(lead)}>
                  Progress history
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setAppraisalLead(lead)}
                >
                  Trade-in appraisals
                </Button>
                <Button variant="secondary" onClick={() => setDealLead(lead)}>
                  Deals
                </Button>
                {can("sales.write") && (
                  <Button onClick={() => setMoving(lead)}>Move stage</Button>
                )}
              </div>
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
      {history && (
        <EnquiryHistory
          key={history.id}
          lead={history}
          onClose={() => setHistory(null)}
        />
      )}
      {appraisalLead && (
        <LiveAppraisals
          key={appraisalLead.id}
          lead={appraisalLead}
          onClose={() => setAppraisalLead(null)}
          onSaved={resource.reload}
        />
      )}
      {dealLead && (
        <LiveDeals
          key={dealLead.id}
          lead={dealLead}
          onClose={() => setDealLead(null)}
          onSaved={resource.reload}
        />
      )}
      {moving && (
        <ActionDialog
          title="Move pipeline stage"
          description={`${moving.title}. Won records an enquiry outcome; deals and reservations are handled separately. Reopening and backward moves are allowed with a note.`}
          fields={[
            {
              name: "stage",
              label: "New stage",
              type: "select",
              required: true,
              options: [
                { value: "", label: "Choose the next stage" },
                ...Object.entries(stageNames)
                  .filter(
                    ([id]) => id !== "closed" && id !== moving.pipeline_stage,
                  )
                  .map(([value, label]) => ({ value, label })),
              ],
            },
            {
              name: "reason",
              label: "Progress note",
              type: "textarea",
              required: true,
              minLength: 3,
              maxLength: 1000,
              hint: "Record what happened and why you are moving this enquiry.",
            },
          ]}
          onClose={() => setMoving(null)}
          onSubmit={async (values) => {
            await api(`sales/pipeline/${moving.id}/stage`, {
              method: "PATCH",
              body: {
                siteId: site.id,
                version: moving.version,
                stage: values.stage,
                reason: values.reason,
              },
            });
            resource.reload();
          }}
        />
      )}
    </>
  );
}
