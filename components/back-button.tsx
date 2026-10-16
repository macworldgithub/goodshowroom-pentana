"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "./ui";

export function BackButton({
  href,
  fallbackHref = "/dashboard",
  label = "Back",
  className = "",
}: {
  href?: string;
  fallbackHref?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  return (
    <Link
      href={href ?? fallbackHref}
      onClick={(event) => {
        if (href || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (window.history.length > 1) {
          event.preventDefault();
          router.back();
        }
      }}
      className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 ${className}`}
    >
      <Icon name="arrow-left" className="h-4 w-4" />
      {label}
    </Link>
  );
}
