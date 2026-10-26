"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, errorMessage } from "@/lib/backend";
import type { Context, Site } from "@/lib/backend-types";
import { authClient } from "@/lib/auth/client";
import type { UserRole } from "@/lib/roles";
import { AccessWelcome } from "./workspace-welcome";
import { Icon } from "./ui";
type Workspace = {
  context: Context;
  site: Site;
  role: UserRole;
  availableRoles: UserRole[];
  setSite: (id: string) => void;
  setRole: (role: UserRole) => void;
  can: (permission: string) => boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};
const WorkspaceContext = createContext<Workspace | null>(null);
export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("Workspace is unavailable");
  return value;
}
const labels: Record<string, UserRole> = {
  ADMIN: "Admin",
  SALES: "Sales",
  SERVICE: "Service",
};
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [context, setContext] = useState<Context | null>(null);
  const [siteId, chooseSite] = useState("");
  const [preferredRole, chooseRole] = useState<UserRole>("Sales");
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    setConnecting(true);
    try {
      const result = await api<Context>("auth/me");
      if (current === generation.current) {
        setContext(result);
        setError("");
      }
    } catch (cause) {
      if (current !== generation.current) return;
      if (cause instanceof ApiError && cause.status === 401)
        router.replace("/login");
      else setError(errorMessage(cause));
    } finally {
      if (current === generation.current) setConnecting(false);
    }
  }, [router]);
  useEffect(() => {
    const requests = generation;
    let active = true;
    let subscription: { unsubscribe: () => void } | undefined;
    void Promise.resolve().then(() => {
      if (!active) return;
      try {
        subscription = authClient.onAuthStateChange((event) => {
          if (event === "SIGNED_OUT") {
            requests.current++;
            setContext(null);
            router.replace("/login");
          }
        }).data.subscription;
        void refresh();
      } catch (cause) {
        setError(errorMessage(cause));
      }
    });
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      requests.current++;
      subscription?.unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh, router]);
  async function signOut() {
    generation.current++;
    await authClient.signOut();
    setContext(null);
    router.replace("/login");
    router.refresh();
  }
  if (error)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4 py-12 text-[#0d1930]">
        <div className="w-full max-w-lg">
          <div className="mb-8 flex items-center justify-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0b111c] text-sm font-black text-white">
              GS
            </span>
            <span className="text-sm font-black uppercase tracking-wide">
              Good Showroom
            </span>
          </div>
          <section
            aria-labelledby="connection-title"
            aria-busy={connecting}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,.06)]"
          >
            <div className="p-6 sm:p-8">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
                <Icon name="warning" className="h-6 w-6" />
              </div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-500">
                Workspace connection
              </p>
              <h1
                id="connection-title"
                className="text-2xl font-black tracking-tight"
              >
                We couldn’t load your workspace
              </h1>
              <p role="alert" className="mt-3 text-sm leading-6 text-slate-600">
                {error === "Internal server error"
                  ? "The service couldn’t retrieve your workspace information. Please try connecting again."
                  : error}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  disabled={connecting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-bold text-white transition hover:brightness-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60"
                  onClick={() => void refresh()}
                >
                  <Icon
                    name="refresh"
                    className={`h-4 w-4 ${connecting ? "animate-spin motion-reduce:animate-none" : ""}`}
                  />
                  {connecting ? "Connecting…" : "Retry connection"}
                </button>
                <button
                  className="min-h-11 rounded-lg border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
                  onClick={() => void signOut()}
                >
                  Sign out
                </button>
              </div>
              <p aria-live="polite" className="mt-4 text-xs text-slate-500">
                {connecting
                  ? "Checking your workspace connection…"
                  : "If this continues, contact your administrator."}
              </p>
            </div>
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-xs leading-5 text-slate-500 sm:px-8">
              Your workspace will open as soon as the connection is restored.
            </div>
          </section>
        </div>
      </main>
    );
  if (!context)
    return (
      <div className="grid min-h-screen place-items-center text-slate-500">
        Loading your workspace…
      </div>
    );
  if (!context.sites.length)
    return (
      <AccessWelcome context={context} refresh={refresh} signOut={signOut} />
    );
  const site =
    context.sites.find((item) => item.id === siteId) ?? context.sites[0];
  const availableRoles = site.roles.map((item) => labels[item]);
  const role = availableRoles.includes(preferredRole)
    ? preferredRole
    : availableRoles[0];
  return (
    <WorkspaceContext.Provider
      value={{
        context,
        site,
        role,
        availableRoles,
        setSite: chooseSite,
        setRole: chooseRole,
        can: (permission) => site.permissions.includes(permission),
        refresh,
        signOut,
      }}
    >
      <div key={`${context.user.id}:${site.id}`}>{children}</div>
    </WorkspaceContext.Provider>
  );
}
