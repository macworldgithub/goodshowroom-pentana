import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code)
    return NextResponse.redirect(new URL("/login?callback=invalid", origin));
  const { error } = await (
    await createClient()
  ).auth.exchangeCodeForSession(code);
  if (error)
    return NextResponse.redirect(new URL("/login?callback=expired", origin));
  return NextResponse.redirect(
    new URL(
      searchParams.get("next") === "/set-password"
        ? "/set-password"
        : "/dashboard",
      origin,
    ),
  );
}
