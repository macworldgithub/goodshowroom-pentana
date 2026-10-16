type RouteContext = { params: Promise<{ path: string[] }> };
async function forward(request: Request, context: RouteContext) {
  const { path } = await context.params;
  if (!path.length || path.some((part) => !/^[a-zA-Z0-9_-]+$/.test(part)))
    return Response.json({ message: "Invalid API path" }, { status: 400 });
  const publicSetup =
    request.method === "POST" && path.join("/") === "auth/initial-user";
  const token = request.headers.get("authorization");
  if (!publicSetup && !token?.startsWith("Bearer "))
    return Response.json({ message: "Sign in to continue" }, { status: 401 });
  const incomingOrigin = request.headers.get("origin");
  if (
    request.method !== "GET" &&
    incomingOrigin &&
    incomingOrigin !== new URL(request.url).origin
  )
    return Response.json(
      { message: "Invalid request origin" },
      { status: 403 },
    );
  const base = process.env.BACKEND_API_URL;
  if (!base)
    return Response.json(
      { message: "The backend address has not been configured." },
      { status: 503 },
    );
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token) headers.set("Authorization", token);
  const key = request.headers.get("idempotency-key");
  if (key) headers.set("Idempotency-Key", key);
  try {
    const response = await fetch(
      `${base.replace(/\/$/, "")}/${path.join("/")}${new URL(request.url).search}`,
      {
        method: request.method,
        headers,
        body: request.method === "GET" ? undefined : await request.text(),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(45000),
      },
    );
    const hasNoBody = [204, 205, 304].includes(response.status);
    return new Response(hasNoBody ? null : await response.text(), {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json(
      {
        message:
          "Cannot reach the backend. Check that it is running, then refresh. If a write was submitted, check its status before trying again.",
      },
      { status: 502 },
    );
  }
}
export const GET = forward;
export const POST = forward;
export const PATCH = forward;
