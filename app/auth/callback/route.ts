import { NextResponse } from "next/server";

/**
 * Auth callback is no longer used — the old Supabase OAuth code exchange has been
 * replaced by direct JWT login via /api/backend/auth/login.
 * This route is kept to gracefully redirect any stale links.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next");
  if (next === "/set-password") {
    const token = searchParams.get("token") ?? "";
    return NextResponse.redirect(
      new URL(`/set-password${token ? `?token=${encodeURIComponent(token)}` : ""}`, origin),
    );
  }
  return NextResponse.redirect(new URL("/login", origin));
}
