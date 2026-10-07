"use client";

import { useState } from "react";
import { roles, type UserRole } from "@/lib/roles";
import {
  Badge,
  Button,
  Icon,
  inputClass,
  Modal,
  PageHeader,
  Panel,
} from "./ui";

const users: Array<{
  name: string;
  email: string;
  role: UserRole;
  access: string;
  status: "Active" | "Invited";
}> = [
  {
    name: "Maya Chen",
    email: "maya@parramattamazda.com.au",
    role: "Admin",
    access: "All sites",
    status: "Active",
  },
  {
    name: "Daniel Reed",
    email: "daniel@parramattamazda.com.au",
    role: "Sales",
    access: "Parramatta",
    status: "Active",
  },
  {
    name: "Jordan Lee",
    email: "jordan@groupauto.com.au",
    role: "Sales",
    access: "All sales sites",
    status: "Active",
  },
  {
    name: "Priya Nair",
    email: "priya@groupauto.com.au",
    role: "Service",
    access: "Parramatta",
    status: "Invited",
  },
];

const permissions = [
  { label: "View customer records", Admin: true, Sales: true, Service: true },
  {
    label: "Manage leads and pipeline",
    Admin: true,
    Sales: true,
    Service: false,
  },
  {
    label: "Manage service coordination",
    Admin: true,
    Sales: false,
    Service: true,
  },
  {
    label: "View stock and deliveries",
    Admin: true,
    Sales: true,
    Service: false,
  },
  {
    label: "Run and review imports",
    Admin: true,
    Sales: false,
    Service: false,
  },
  {
    label: "Manage users and permissions",
    Admin: true,
    Sales: false,
    Service: false,
  },
  { label: "View relevant reports", Admin: true, Sales: true, Service: true },
] satisfies Array<{ label: string } & Record<UserRole, boolean>>;

export function SettingsView() {
  const [tab, setTab] = useState<"users" | "permissions" | "sites" | "audit">(
    "users",
  );
  const [invite, setInvite] = useState(false);
  const [notice, setNotice] = useState("");
  return (
    <>
      <PageHeader
        eyebrow="Admin only"
        title="Administration"
        description="Manage users, the three workspace roles, site access and audit evidence."
        actions={
          <Button onClick={() => setInvite(true)}>
            <Icon name="plus" className="h-4 w-4" />
            Invite user
          </Button>
        }
      />
      {notice && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          {notice}
        </div>
      )}
      <Panel>
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4 pt-3">
          {(
            [
              ["users", "Users"],
              ["permissions", "Role permissions"],
              ["sites", "Sites & brands"],
              ["audit", "Audit log"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold ${tab === key ? "border-red-600 text-red-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "users" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Access</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.email}>
                    <td className="px-5 py-4">
                      <strong className="block text-sm text-slate-900">
                        {user.name}
                      </strong>
                      <span className="text-xs text-slate-500">
                        {user.email}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        tone={
                          user.role === "Admin"
                            ? "red"
                            : user.role === "Sales"
                              ? "blue"
                              : "violet"
                        }
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {user.access}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        tone={user.status === "Active" ? "green" : "amber"}
                      >
                        {user.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === "permissions" && (
          <div className="overflow-x-auto p-5">
            <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
              Good Showroom uses exactly three roles. Site and brand assignments
              further limit the records each user can access.
            </div>
            <table className="w-full min-w-[650px] text-left">
              <thead>
                <tr className="text-xs font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3">Permission</th>
                  {roles.map((role) => (
                    <th className="px-4 py-3 text-center" key={role}>
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissions.map((permission) => (
                  <tr key={permission.label}>
                    <td className="py-4 text-sm font-semibold text-slate-700">
                      {permission.label}
                    </td>
                    {roles.map((role) => (
                      <td className="px-4 text-center" key={role}>
                        {permission[role] ? (
                          <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                            <Icon name="check" className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === "sites" && (
          <div className="grid gap-4 p-5 md:grid-cols-3">
            {[
              ["Parramatta Mazda", "Mazda", "24 users"],
              ["North Sydney Toyota", "Toyota", "18 users"],
              ["Chatswood Auto Group", "Kia · Hyundai", "31 users"],
            ].map(([name, brands, people]) => (
              <div
                key={name}
                className="rounded-xl border border-slate-200 p-4"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600">
                  <Icon name="settings" className="h-4 w-4" />
                </span>
                <h3 className="mt-4 font-black text-slate-900">{name}</h3>
                <p className="mt-1 text-sm text-slate-500">{brands}</p>
                <p className="mt-4 text-xs font-bold text-slate-400">
                  {people}
                </p>
              </div>
            ))}
          </div>
        )}
        {tab === "audit" && (
          <div className="divide-y divide-slate-100">
            {[
              ["Alex Morgan imported customer data", "Today, 6:02 am", "Admin"],
              ["Maya Chen changed a CRM stage", "Today, 9:44 am", "Sales"],
              [
                "Priya Nair created a booking request",
                "Yesterday, 4:31 pm",
                "Service",
              ],
              ["Admin changed Jordan Lee’s role", "5 Oct, 2:10 pm", "Admin"],
            ].map(([event, time, role]) => (
              <div
                key={event}
                className="flex flex-col justify-between gap-2 px-5 py-4 sm:flex-row"
              >
                <div>
                  <strong className="text-sm text-slate-900">{event}</strong>
                  <p className="mt-1 text-xs text-slate-500">Role: {role}</p>
                </div>
                <span className="text-xs text-slate-400">{time}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Modal
        open={invite}
        onClose={() => setInvite(false)}
        title="Invite a team member"
        description="Choose one of the three roles and then limit site access."
      >
        <form
          className="space-y-5 p-6"
          onSubmit={(event) => {
            event.preventDefault();
            setInvite(false);
            setNotice(
              "Invitation sent with the selected role and site access.",
            );
          }}
        >
          <label className="block text-sm font-bold text-slate-700">
            Email address
            <input
              required
              type="email"
              className={`mt-2 ${inputClass}`}
              placeholder="name@dealership.com"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-700">
              Role
              <select className={`mt-2 ${inputClass}`}>
                {roles.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700">
              Site access
              <select className={`mt-2 ${inputClass}`}>
                <option>Parramatta</option>
                <option>North Sydney</option>
                <option>Chatswood</option>
                <option>All authorised sites</option>
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setInvite(false)}>
              Cancel
            </Button>
            <Button type="submit">Send invitation</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
