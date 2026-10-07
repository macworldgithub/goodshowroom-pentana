"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { canAccess, roleHome, roles, type UserRole } from "@/lib/roles";
import { Icon } from "./ui";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  count?: number;
  roles: UserRole[];
};

const navigation: NavItem[] = [
  {
    href: "/dashboard",
    label: "My Day",
    icon: "home",
    roles: ["Sales", "Service", "Admin"],
  },
  {
    href: "/leads",
    label: "Sales enquiries",
    icon: "leads",
    count: 12,
    roles: ["Sales", "Admin"],
  },
  {
    href: "/customers",
    label: "Customer 360",
    icon: "customers",
    roles: ["Sales", "Service", "Admin"],
  },
  {
    href: "/pipeline",
    label: "Sales desk",
    icon: "pipeline",
    roles: ["Sales", "Admin"],
  },
  {
    href: "/stock",
    label: "Stock match",
    icon: "car",
    roles: ["Sales", "Admin"],
  },
  {
    href: "/deliveries",
    label: "Handover lane",
    icon: "delivery",
    count: 3,
    roles: ["Sales", "Service", "Admin"],
  },
  {
    href: "/service",
    label: "Service desk",
    icon: "service",
    count: 5,
    roles: ["Service", "Admin"],
  },
  {
    href: "/reports",
    label: "Reports",
    icon: "chart",
    roles: ["Sales", "Service", "Admin"],
  },
  { href: "/sync", label: "Sync operations", icon: "refresh", roles: ["Admin"] },
  {
    href: "/settings",
    label: "Administration",
    icon: "settings",
    roles: ["Admin"],
  },
];

const pageNames: Record<string, string> = {
  dashboard: "My Day",
  leads: "Sales Enquiries",
  customers: "Customer 360",
  pipeline: "Sales Desk",
  stock: "Stock Match",
  deliveries: "Handover Lane",
  service: "Service Desk",
  sync: "Sync Operations",
  reports: "Performance Reports",
  settings: "Administration",
};

const RoleContext = createContext<UserRole>("Admin");
export function useWorkspaceRole() {
  return useContext(RoleContext);
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className="rounded-full border border-brand/60 bg-brand/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-200">
      {role}
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("Admin");
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const section = pathname.split("/")[1] || "dashboard";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem("goodshowroom-role");
      if (roles.includes(stored as UserRole)) setRole(stored as UserRole);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (ready && !canAccess(role, pathname)) router.replace(roleHome[role]);
  }, [pathname, ready, role, router]);

  function changeRole(next: UserRole) {
    setRole(next);
    window.localStorage.setItem("goodshowroom-role", next);
    setMobileOpen(false);
    if (!canAccess(next, pathname)) router.push(roleHome[next]);
  }
  const visibleNav = navigation.filter((item) => item.roles.includes(role));

  if (!ready)
    return (
      <div className="grid min-h-screen place-items-center bg-[#f5f7fa]">
        <span className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-brand" />
      </div>
    );
  if (!canAccess(role, pathname))
    return (
      <div className="grid min-h-screen place-items-center bg-[#f5f7fa] text-sm font-bold text-slate-500">
        Opening your {role} workspace…
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-[#0d1930]">
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/45 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(288px,calc(100vw-32px))] flex-col bg-[#0b111c] text-white shadow-2xl transition-transform lg:w-[260px] lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="border-b border-white/10 px-4 py-5">
          <div className="flex items-start justify-between gap-3">
            <Link href={roleHome[role]} className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-lg border border-white/15 bg-white text-lg font-black text-[#0b111c]">
                GS
              </span>
              <span>
                <strong className="block text-base font-black uppercase leading-4 tracking-tight">
                  Good Showroom
                </strong>
                <small className="mt-1 block text-[9px] font-bold uppercase tracking-[.18em] text-slate-400">
                  Pentana operating layer
                </small>
              </span>
            </Link>
            <RoleBadge role={role} />
          </div>
        </div>
        <div className="p-3">
          <label className="block text-[10px] font-black uppercase tracking-[.16em] text-slate-500">
            Workspace role
            <select
              aria-label="Workspace role"
              value={role}
              onChange={(event) => changeRole(event.target.value as UserRole)}
              className="mt-2 h-10 w-full rounded-lg border border-slate-700 bg-[#111a2a] px-3 text-xs font-bold normal-case tracking-normal text-white outline-none focus:border-brand"
            >
              {roles.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-700 bg-[#111a2a] px-3 py-2.5">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              VIC Multi-Franchise
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              3 sites
            </span>
          </div>
        </div>
        <nav
          className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-1"
          aria-label={`${role} navigation`}
        >
          {visibleNav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href === "/customers" &&
                pathname.startsWith("/customers/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold transition ${active ? "bg-brand text-white shadow-[0_8px_20px_rgba(201,24,30,.26)]" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
              >
                <Icon
                  name={item.icon}
                  className="h-[18px] w-[18px] text-current"
                />
                <span>{item.label}</span>
                {item.count ? (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-black ${active ? "bg-white/20" : "border border-brand/50 bg-brand/15 text-red-200"}`}
                  >
                    {item.count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-xs font-black">
              MC
            </span>
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-sm text-white">
                Maya Chen
              </strong>
              <span className="block text-xs font-semibold text-slate-400">
                {role}
              </span>
            </div>
            <Link
              href="/login"
              className="rounded-md p-2 text-slate-500 hover:bg-white/5 hover:text-white"
              aria-label="Sign out"
            >
              <Icon name="chevron" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </aside>
      <div className="min-w-0 lg:pl-[260px]">
        <header className="sticky top-0 z-20 flex min-h-[66px] items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 shadow-[0_1px_4px_rgba(15,23,42,.04)] sm:min-h-[74px] sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              className="shrink-0 rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Icon name="menu" />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-base font-black tracking-tight text-[#10182b] min-[400px]:text-lg sm:text-xl">
                  {pageNames[section] ?? "Customer Record"}
                </h1>
                <span className="hidden rounded-full bg-[#10182b] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white sm:inline-flex">
                  <span className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-brand" />
                  {role} portal
                </span>
              </div>
              <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">
                Live Sales and Service work with Pentana write-back status
              </p>
            </div>
          </div>
          <div className="relative flex shrink-0 items-center gap-2">
            <button
              onClick={() => setNotifications(!notifications)}
              className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Icon name="bell" />
              <span className="absolute right-0 top-0 grid h-4 w-4 place-items-center rounded-full bg-brand text-[9px] font-black text-white">
                3
              </span>
            </button>
            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 md:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              VIC Multi-Franchise Network
            </div>
            {notifications && (
              <div className="absolute right-0 top-12 w-[min(320px,calc(100vw-24px))] rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <p className="px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-400">
                  Notifications
                </p>
                <div className="rounded-lg px-3 py-3 hover:bg-slate-50">
                  <strong className="text-sm text-slate-900">
                    3 items need attention
                  </strong>
                  <p className="mt-1 text-xs text-slate-500">
                    Open your dashboard to review today’s priority queue.
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-[1500px] p-3 min-[400px]:p-4 sm:p-6 lg:p-8">
          <RoleContext.Provider value={role}>{children}</RoleContext.Provider>
        </main>
      </div>
    </div>
  );
}
