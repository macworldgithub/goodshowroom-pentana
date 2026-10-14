"use client";
import { useEffect, useState } from "react";
import { api, query } from "@/lib/backend";
import type { Page } from "@/lib/backend-types";
import {
  ActionDialog,
  localDate,
  Pager,
  ResourceState,
  timestamp,
  useResource,
} from "./live-common";
import { Badge, Button, EmptyState, Modal } from "./ui";
import { useWorkspace } from "./workspace-provider";
type Reservation = {
  id: string;
  status: string;
  version: number;
  expires_at: string;
  created_at: string;
  reason: string;
};
type Deal = {
  id: string;
  status: string;
  version: number;
  stock_label: string;
};
export function LiveReservations({
  leadId,
  deal,
  onClose,
  onSaved,
}: {
  leadId: string;
  deal: Deal;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { site, can } = useWorkspace();
  const [offset, setOffset] = useState(0);
  const [editor, setEditor] = useState<Reservation | "new" | null>(null);
  const [defaultExpiry] = useState(() =>
    localDate(new Date(Date.now() + 86400000).toISOString()),
  );
  const resource = useResource<{
    reservations: Reservation[];
    active: Reservation | null;
    pagination: Page;
  }>(
    `sales/leads/${leadId}/deals/${deal.id}/reservations?${query({ siteId: site.id, offset, limit: 5 })}`,
  );
  const refresh = resource.reload;
  useEffect(() => {
    const timer = setInterval(refresh, 15000);
    return () => clearInterval(timer);
  }, [refresh]);
  const release = editor && editor !== "new" ? editor : undefined;
  return (
    <>
      {!editor && (
        <Modal
          open
          title="Vehicle reservation"
          description={deal.stock_label}
          onClose={onClose}
        >
          <div className="p-5">
            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm leading-6 text-slate-600">
                Hold this vehicle for an approved deal for up to seven days.
                Expiry or release makes it available to other proposals. This is
                a local hold; real Pentana write-back remains deferred.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={resource.reload}>
                  Refresh
                </Button>
                {can("sales.write") && (
                  <Button
                    disabled={
                      deal.status !== "approved" ||
                      !!resource.data?.active ||
                      !resource.data
                    }
                    onClick={() => setEditor("new")}
                  >
                    Reserve vehicle
                  </Button>
                )}
              </div>
              {deal.status !== "approved" && (
                <p className="mt-3 text-xs text-amber-700">
                  Only a current approved deal can create a reservation.
                </p>
              )}
            </div>
            <ResourceState resource={resource} />
            {resource.data?.active && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                Reserved until{" "}
                {timestamp(resource.data.active.expires_at, site.timezone)}
              </div>
            )}
            {resource.data && !resource.data.reservations.length && (
              <EmptyState
                icon="car"
                title="No reservation history"
                description="Reserve the vehicle after this proposal is approved."
              />
            )}
            <div className="space-y-3">
              {resource.data?.reservations.map((row) => (
                <article
                  key={row.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Badge tone={row.status === "active" ? "green" : "slate"}>
                      {row.status}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      Created {timestamp(row.created_at, site.timezone)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Expiry: {timestamp(row.expires_at, site.timezone)}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-500">
                    {row.reason}
                  </p>
                  {can("sales.write") && row.status === "active" && (
                    <div className="mt-4">
                      <Button
                        variant="secondary"
                        onClick={() => setEditor(row)}
                      >
                        Release reservation
                      </Button>
                    </div>
                  )}
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
          title={release ? "Release reservation" : "Reserve vehicle"}
          description={
            release
              ? "Release the local hold so another approved proposal can reserve this vehicle."
              : `${deal.stock_label}. The server checks approval, vehicle availability and conflicts before creating the hold.`
          }
          fields={[
            ...(!release
              ? [
                  {
                    name: "expiresAt",
                    label: "Expiry (your device’s timezone)",
                    type: "datetime-local" as const,
                    value: defaultExpiry,
                    required: true,
                    hint: "Choose a future time within seven days.",
                  },
                ]
              : []),
            {
              name: "note",
              label: release ? "Release reason" : "Reservation note",
              type: "textarea",
              required: true,
              minLength: 3,
              maxLength: 1000,
            },
          ]}
          onClose={() => setEditor(null)}
          onSubmit={async (values, key) => {
            const path = `sales/leads/${leadId}/deals/${deal.id}/reservations`;
            await api(release ? `${path}/${release.id}/release` : path, {
              method: release ? "PATCH" : "POST",
              body: {
                siteId: site.id,
                note: values.note,
                ...(release
                  ? { version: release.version }
                  : {
                      dealVersion: deal.version,
                      expiresAt: new Date(
                        String(values.expiresAt),
                      ).toISOString(),
                    }),
              },
              ...(release ? {} : { key }),
            });
            resource.reload();
            onSaved();
          }}
        />
      )}
    </>
  );
}
