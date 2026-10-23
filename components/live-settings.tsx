"use client";
import { useState } from "react";
import { api, query } from "@/lib/backend";
import type { Invitation, Membership, Page, Site } from "@/lib/backend-types";
import { useWorkspace } from "./workspace-provider";
import {
  ActionDialog,
  Feedback,
  Pager,
  panelClass,
  ResourceState,
  timestamp,
  useDirectory,
  useResource,
  type Field,
  type Values,
} from "./live-common";
import { Badge, Button, PageHeader } from "./ui";
const extras = [
  "customers.view_team",
  "customers.assign",
  "tasks.view_team",
  "tasks.assign",
  "sales.view_team",
  "sales.assign_leads",
  "sales.approve_deals",
  "service.view_team",
  "service.assign_work",
  "service.resources_manage",
  "deliveries.confirm_payment",
  "reports.read",
  "reports.view_group",
];
type Brand = { id: string; name: string };
type Audit = {
  id: string;
  action: string;
  actor_user_id: string;
  created_at: string;
  entity_type: string;
};
type Selection = {
  action:
    "user" | "invite" | "membership" | "site" | "brand" | "send" | "revoke";
  membership?: Membership;
  site?: Site;
  brand?: Brand;
  invitation?: Invitation;
};
export function LiveSettings() {
  const { context, site, can, refresh } = useWorkspace();
  const [tab, setTab] = useState("staff");
  const [offset, setOffset] = useState(0);
  const [selected, updateSelected] = useState<Selection>();
  const [notice, setNotice] = useState("");
  const organisationId = site.organisation_id;
  const [grantSite, setGrantSite] = useState(site.id);
  function setSelected(value: Selection | undefined) {
    if (value && ["user", "invite", "membership"].includes(value.action))
      setGrantSite(value.membership?.site_id ?? site.id);
    updateSelected(value);
  }
  const allBrands = useDirectory<Brand>(
    can("users.manage")
      ? `admin/brands?organisationId=${organisationId}`
      : null,
    "brands",
  );
  const suffix = query({ organisationId, offset, limit: 20 });
  const staff = useResource<{ memberships: Membership[]; pagination: Page }>(
    can("users.manage") && tab === "staff"
      ? `admin/memberships?${suffix}`
      : null,
  );
  const invitations = useResource<{
    invitations: Invitation[];
    pagination: Page;
  }>(
    can("users.manage") && tab === "invitations"
      ? `admin/invitations?${suffix}`
      : null,
  );
  const sites = useResource<{ sites: Site[]; pagination: Page }>(
    can("users.manage") && tab === "sites" ? `admin/sites?${suffix}` : null,
  );
  const brands = useResource<{ brands: Brand[]; pagination: Page }>(
    can("users.manage") && tab === "brands" ? `admin/brands?${suffix}` : null,
  );
  const audit = useResource<{ events: Audit[]; pagination: Page }>(
    can("users.manage") && tab === "audit" ? `admin/audit?${suffix}` : null,
  );
  // The selected site's mapped brands are complete in /auth/me, including brand names.
  const grantFields = (member?: Membership): Field[] => [
    {
      name: "role",
      label: "Role",
      type: "select",
      value: member?.role ?? "SALES",
      options: [
        { value: "SALES", label: "SALES — Sales Consultant, BDC & Sales Manager" },
        { value: "SERVICE", label: "SERVICE — Service Advisor, Workshop Controller & Recovery" },
        { value: "ADMIN", label: "ADMIN — Dealer Principal, General Manager & Executive" },
      ],
    },
    {
      name: "siteId",
      label: "Site (required for Sales and Service)",
      type: "select",
      value: member?.site_id ?? site.id,
      options: context.sites
        .filter((item) => item.organisation_id === organisationId)
        .map((item) => ({ value: item.id, label: item.name })),
      onChange: setGrantSite,
    },
    {
      name: "restrictBrands",
      label: "Restrict access to selected brands (staff only)",
      type: "checkbox",
      value: !!member?.brand_ids,
    },
    ...(context.sites.find((item) => item.id === grantSite)?.brands ?? []).map(
      (brand) => ({
        name: `brand:${brand.id}`,
        label: brand.name,
        type: "checkbox" as const,
        value: member?.brand_ids?.includes(brand.id) ?? false,
      }),
    ),
  ];
  function grant(values: Values) {
    const role = values.role;
    return {
      roles: [role],
      siteId: role === "ADMIN" ? null : values.siteId,
      brandIds:
        role === "ADMIN" || !values.restrictBrands
          ? null
          : Object.entries(values)
              .filter(([key, value]) => key.startsWith("brand:") && value)
              .map(([key]) => key.slice(6)),
    };
  }
  let fields: Field[] = [];
  if (selected?.action === "user")
    fields = [
      { name: "fullName", label: "Full name", maxLength: 120 },
      { name: "email", label: "Work email", type: "email", required: true },
      {
        name: "password",
        label: "Initial password",
        type: "password",
        required: true,
        minLength: 12,
        maxLength: 128,
      },
      ...grantFields(),
    ];
  if (selected?.action === "invite")
    fields = [
      { name: "email", label: "Work email", type: "email", required: true },
      ...grantFields(),
    ];
  if (selected?.action === "membership")
    fields = [
      ...grantFields(selected.membership),
      {
        name: "status",
        label: "Access status",
        type: "select",
        value: selected.membership!.status,
        options: ["active", "suspended"].map((value) => ({
          value,
          label: value,
        })),
      },
      ...extras.map((permission) => ({
        name: `permission:${permission}`,
        label: permission,
        type: "checkbox" as const,
        value: selected.membership!.extra_permissions.includes(permission),
      })),
    ];
  if (selected?.action === "site")
    fields = [
      {
        name: "name",
        label: "Site name",
        value: selected.site?.name ?? "",
        required: true,
        minLength: 2,
        maxLength: 120,
      },
      {
        name: "timezone",
        label: "Timezone",
        value: selected.site?.timezone ?? "Australia/Sydney",
        required: true,
      },
      ...allBrands.items.map((brand) => ({
        name: `brand:${brand.id}`,
        label: brand.name,
        type: "checkbox" as const,
        value: selected.site?.brand_ids?.includes(brand.id) ?? false,
      })),
    ];
  if (selected?.action === "brand")
    fields = [
      {
        name: "name",
        label: "Brand name",
        required: true,
        minLength: 2,
        maxLength: 120,
        value: selected.brand?.name ?? "",
      },
    ];
  if (selected?.action === "send")
    fields = [
      {
        name: "confirmed",
        label: `Send an invitation email to ${selected.invitation?.email}?`,
        type: "checkbox",
      },
    ];
  const current = { staff, invitations, sites, brands, audit }[
    tab as "staff" | "invitations" | "sites" | "brands" | "audit"
  ];
  if (!can("users.manage"))
    return <p>You do not have administration access at this site.</p>;
  async function changed() {
    current.reload();
    await refresh();
  }
  return (
    <>
      <PageHeader
        title="Dealership settings"
        eyebrow={site.name}
        description="Manage site access, staff accounts, invitations, sites and brands."
        actions={
          <Button variant="secondary" onClick={current.reload}>
            Refresh
          </Button>
        }
      />
      <Feedback message={notice} />
      <div className="mb-5 flex flex-wrap gap-2">
        {["staff", "invitations", "sites", "brands", "audit"].map((item) => (
          <Button
            key={item}
            variant={tab === item ? "primary" : "secondary"}
            onClick={() => {
              setTab(item);
              setOffset(0);
            }}
          >
            {item}
          </Button>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap gap-3">
        {tab === "staff" && (
          <Button
            onClick={() => {
              setGrantSite(site.id);
              setSelected({ action: "user" });
            }}
          >
            Create staff account
          </Button>
        )}
        {tab === "invitations" && (
          <Button
            onClick={() => {
              setGrantSite(site.id);
              setSelected({ action: "invite" });
            }}
          >
            Create invitation
          </Button>
        )}
        {tab === "sites" && (
          <Button
            disabled={allBrands.loading || !!allBrands.error}
            onClick={() => setSelected({ action: "site" })}
          >
            Add site
          </Button>
        )}
        {tab === "brands" && (
          <Button onClick={() => setSelected({ action: "brand" })}>
            Add brand
          </Button>
        )}
      </div>
      <ResourceState resource={current} />
      <div className="space-y-3">
        {tab === "staff" &&
          staff.data?.memberships.map((member) => (
            <article className={panelClass} key={member.id}>
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-bold">
                    {member.user?.fullName ??
                      member.user?.email ??
                      (member.user_id === context.user.id
                        ? "Your membership"
                        : `Staff ${member.user_id.slice(0, 8)}`)}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {member.role} ·{" "}
                    {member.site_id
                      ? (context.sites.find(
                          (item) => item.id === member.site_id,
                        )?.name ?? "Assigned site")
                      : "Organisation-wide administrator"}
                  </p>
                  <p className="mt-2 text-xs break-all text-slate-500">
                    {member.user?.email ?? "No profile email"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {member.brand_ids
                      ? `${member.brand_ids.length} restricted brands`
                      : "All mapped brands"}
                  </p>
                </div>
                <Badge tone={member.status === "active" ? "green" : "amber"}>
                  {member.status}
                </Badge>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setSelected({ action: "membership", membership: member })
                  }
                >
                  Edit access
                </Button>
              </div>
            </article>
          ))}
        {tab === "invitations" &&
          invitations.data?.invitations.map((invite) => (
            <article className={panelClass} key={invite.id}>
              <h2 className="font-bold">{invite.email}</h2>
              <p className="my-2 text-sm text-slate-500">
                {invite.roles.join(", ")} · {invite.status} · Email{" "}
                {invite.delivery_status} · Expires{" "}
                {timestamp(invite.expires_at, site.timezone)}
              </p>
              {invite.status === "pending" && (
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setSelected({ action: "send", invitation: invite })
                    }
                  >
                    Send invitation email
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setSelected({ action: "revoke", invitation: invite })
                    }
                  >
                    Revoke invitation
                  </Button>
                </div>
              )}
            </article>
          ))}
        {tab === "sites" &&
          sites.data?.sites.map((item) => (
            <article className={panelClass} key={item.id}>
              <h2 className="font-bold">{item.name}</h2>
              <p className="my-2 text-sm text-slate-500">
                {item.timezone} · {item.brand_ids?.length ?? 0} mapped brands
              </p>
              <Button
                variant="secondary"
                onClick={() => setSelected({ action: "site", site: item })}
              >
                Edit site
              </Button>
            </article>
          ))}
        {tab === "brands" &&
          brands.data?.brands.map((brand) => (
            <article className={panelClass} key={brand.id}>
              <h2 className="font-bold">{brand.name}</h2>
              <p className="my-2 break-all text-xs text-slate-500">
                Brand ID: {brand.id}
              </p>
              <Button
                variant="secondary"
                onClick={() => setSelected({ action: "brand", brand })}
              >
                Rename brand
              </Button>
            </article>
          ))}
        {tab === "audit" &&
          audit.data?.events.map((event) => (
            <article className={panelClass} key={event.id}>
              <h2 className="font-semibold">
                {event.action.replaceAll(".", " · ").replaceAll("_", " ")}
              </h2>
              <p className="mt-2 text-xs text-slate-500">
                {timestamp(event.created_at, site.timezone)} · Staff{" "}
                {event.actor_user_id.slice(0, 8)} · {event.entity_type}
              </p>
            </article>
          ))}
      </div>
      <Pager
        page={current.data?.pagination}
        offset={offset}
        setOffset={setOffset}
      />
      {selected && (
        <ActionDialog
          title={
            {
              user: "Create staff account",
              invite: "Create invitation",
              membership: "Edit membership access",
              site: selected.site ? "Edit site" : "Add site",
              brand: selected.brand ? "Rename brand" : "Add brand",
              send: "Send invitation email",
              revoke: "Revoke invitation",
            }[selected.action]
          }
          description={
            ["user", "invite", "membership"].includes(selected.action)
              ? "Sales and Service require a site. Admin access covers the organisation. Brand restrictions must match the selected site."
              : selected.action === "send"
                ? "Invitation emails use Supabase Auth delivery, separately from customer SMTP."
                : undefined
          }
          fields={fields}
          onClose={() => setSelected(undefined)}
          onSubmit={async (values) => {
            const action = selected.action;
            if (action === "user")
              await api("admin/users", {
                method: "POST",
                body: {
                  organisationId,
                  email: values.email,
                  password: values.password,
                  ...(values.fullName ? { fullName: values.fullName } : {}),
                  ...grant(values),
                },
              });
            if (action === "invite")
              await api("admin/invitations", {
                method: "POST",
                body: { organisationId, email: values.email, ...grant(values) },
              });
            if (action === "membership") {
              const access = grant(values);
              await api(`admin/memberships/${selected.membership!.id}`, {
                method: "PATCH",
                body: {
                  organisationId,
                  role: values.role,
                  status: values.status,
                  siteId: access.siteId,
                  brandIds: access.brandIds,
                  extraPermissions: Object.entries(values)
                    .filter(
                      ([key, value]) => key.startsWith("permission:") && value,
                    )
                    .map(([key]) => key.slice(11)),
                },
              });
            }
            if (action === "site") {
              if (allBrands.loading || allBrands.error)
                throw new Error(
                  "Load the available brands before saving this site.",
                );
              await api(
                `admin/sites${selected.site ? "/" + selected.site.id : ""}`,
                {
                  method: selected.site ? "PATCH" : "POST",
                  body: {
                    organisationId,
                    name: values.name,
                    timezone: values.timezone,
                    brandIds: Object.entries(values)
                      .filter(
                        ([key, value]) => key.startsWith("brand:") && value,
                      )
                      .map(([key]) => key.slice(6)),
                  },
                },
              );
            }
            if (action === "brand")
              await api(
                `admin/brands${selected.brand ? "/" + selected.brand.id : ""}`,
                {
                  method: selected.brand ? "PATCH" : "POST",
                  body: { organisationId, name: values.name },
                },
              );
            if (action === "send") {
              if (!values.confirmed)
                throw new Error("Confirm the email recipient first.");
              const result = await api<{ sent: boolean; message: string }>(
                `admin/invitations/${selected.invitation!.id}/send`,
                { method: "POST", body: { organisationId } },
              );
              if (!result.sent) {
                current.reload();
                throw new Error(result.message);
              }
            }
            if (action === "revoke")
              await api(`admin/invitations/${selected.invitation!.id}/revoke`, {
                method: "POST",
                body: { organisationId },
              });
            setNotice(
              action === "send"
                ? "Invitation email submitted to Supabase."
                : "Changes saved.",
            );
            await changed();
          }}
        >
          {selected.action === "revoke" && (
            <p className="text-sm">
              Revoke the pending invitation for {selected.invitation?.email}?
            </p>
          )}
        </ActionDialog>
      )}
    </>
  );
}
