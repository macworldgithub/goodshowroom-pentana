"use client";

import { useEffect, type FormEventHandler, type ReactNode } from "react";
import Link from "next/link";
import type { Tone } from "@/lib/crm-types";

export function Icon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const paths: Record<string, ReactNode> = {
    home: (
      <>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10v10h13V10M9 20v-6h6v6" />
      </>
    ),
    leads: (
      <>
        <circle cx="9" cy="7" r="3" />
        <path d="M3.5 20c0-4 2-7 5.5-7s5.5 3 5.5 7M16 8h5M18.5 5.5v5" />
      </>
    ),
    customers: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M16 11a4 4 0 0 1 4 4v2" />
      </>
    ),
    pipeline: (
      <>
        <rect x="3" y="4" width="5" height="16" rx="1" />
        <rect x="10" y="4" width="5" height="10" rx="1" />
        <rect x="17" y="4" width="4" height="13" rx="1" />
      </>
    ),
    car: (
      <>
        <path d="m5 17-1 2M19 17l1 2M3 13l2-5h14l2 5v5H3z" />
        <circle cx="7" cy="15.5" r="1" />
        <circle cx="17" cy="15.5" r="1" />
      </>
    ),
    delivery: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    service: (
      <>
        <path d="M14.7 6.3a4 4 0 0 0-5-5L7 4l3 3 2.7-2.7a4 4 0 0 0 2 5L6 19a2.1 2.1 0 0 0 3 3l9.7-9.7a4 4 0 0 0 5-5L21 10l-3-3z" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4M7 9l5-5 5 5" />
        <path d="M5 20h14" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    more: (
      <>
        <circle cx="5" cy="12" r="1" fill="currentColor" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="19" cy="12" r="1" fill="currentColor" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    phone: (
      <path d="M5 4h4l2 5-3 2a15 15 0 0 0 5 5l2-3 5 2v4c0 1-1 2-2 2C10 21 3 14 3 6c0-1 1-2 2-2z" />
    ),
    filter: <path d="M3 5h18l-7 8v6l-4 2v-8z" />,
    refresh: (
      <>
        <path d="M20 6v5h-5M4 18v-5h5" />
        <path d="M18 9a7 7 0 0 0-12-2M6 15a7 7 0 0 0 12 2" />
      </>
    ),
    file: (
      <>
        <path d="M6 2h8l4 4v16H6z" />
        <path d="M14 2v5h5M9 13h6M9 17h6" />
      </>
    ),
    warning: (
      <>
        <path d="M12 3 2 21h20z" />
        <path d="M12 9v5M12 18h.01" />
      </>
    ),
  };
  return (
    <svg
      className={`h-5 w-5 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.home}
    </svg>
  );
}

const badgeTones: Record<Tone, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/15",
  red: "bg-rose-50 text-rose-700 ring-rose-600/15",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/15",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/10",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/15",
};

export function Badge({
  children,
  tone = "slate",
  dot = false,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${badgeTones[tone]}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const variants = {
    primary:
      "bg-brand text-white hover:bg-brand-dark shadow-[0_4px_10px_rgba(201,24,30,.22)]",
    secondary:
      "border border-slate-300 bg-white text-[#12203a] hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  };
  const fallback =
    type === "button" && !props.onClick
      ? () => window.alert("This action is ready for backend integration.")
      : undefined;
  return (
    <button
      type={type}
      onClick={fallback}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex min-w-0 flex-col justify-between gap-4 sm:mb-6 lg:flex-row lg:items-end">
      <div className="min-w-0">
        <p className="mb-2 text-[11px] font-black uppercase tracking-[.14em] text-brand">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-black tracking-tight text-[#10182b] sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
      {actions && (
        <div className="grid w-full grid-cols-1 gap-2 min-[400px]:flex min-[400px]:w-auto min-[400px]:flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon,
  tone = "green",
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: string;
  tone?: Tone;
}) {
  const color = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
    blue: "bg-sky-50 text-sky-700",
    slate: "bg-slate-100 text-slate-600",
    violet: "bg-violet-50 text-violet-700",
  }[tone];
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.03)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <strong className="mt-2 block font-serif text-3xl font-semibold text-slate-950">
            {value}
          </strong>
          <p className="mt-1 text-sm text-slate-500">{detail}</p>
        </div>
        <span
          className={`grid h-10 w-10 place-items-center rounded-lg ${color}`}
        >
          <Icon name={icon} />
        </span>
      </div>
    </article>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.06)] ${className}`}
    >
      {children}
    </section>
  );
}

export function PanelHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:gap-4 sm:px-5">
      <div className="min-w-0">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="relative block min-w-0 flex-1">
      <Icon
        name="search"
        className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"
      />
      <input
        className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand-soft"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

export function EmptyState({
  icon = "search",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid min-h-64 place-items-center p-8 text-center">
      <div>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500">
          <Icon name={icon} />
        </span>
        <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          {description}
        </p>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const fn = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid items-end bg-slate-950/35 p-0 backdrop-blur-[2px] sm:place-items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2
              id="modal-title"
              className="text-lg font-bold text-slate-950 sm:text-xl"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <div className="mt-1.5">{children}</div>
      {error && (
        <span className="mt-1 block text-xs font-medium text-rose-600">
          {error}
        </span>
      )}
    </label>
  );
}

export const inputClass =
  "h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand-soft";

export function ModalForm({
  onSubmit,
  children,
}: {
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5 p-4 sm:p-6">
      {children}
    </form>
  );
}

export function Avatar({
  initials,
  tone = "green",
  size = "md",
}: {
  initials: string;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
}) {
  const tones = {
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-rose-100 text-rose-800",
    blue: "bg-sky-100 text-sky-800",
    slate: "bg-slate-200 text-slate-700",
    violet: "bg-violet-100 text-violet-800",
  };
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
  };
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full font-bold ${tones[tone]} ${sizes[size]}`}
    >
      {initials}
    </span>
  );
}

export function CustomerLink({
  id,
  name,
  sub,
  initials,
}: {
  id: string;
  name: string;
  sub?: string;
  initials: string;
}) {
  return (
    <Link
      href={`/customers/${id}`}
      className="flex items-center gap-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200"
    >
      <Avatar initials={initials} />
      <span className="min-w-0">
        <strong className="block truncate text-sm text-slate-900">
          {name}
        </strong>
        {sub && (
          <small className="block truncate text-xs text-slate-500">{sub}</small>
        )}
      </span>
    </Link>
  );
}
