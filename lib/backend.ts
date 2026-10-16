import { createClient } from "./supabase/client";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
type Options = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  key?: string;
  signal?: AbortSignal;
  public?: boolean;
};
export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const client = createClient();
  let token: string | undefined;
  if (!options.public) {
    const { data, error } = await client.auth.getSession();
    if (error || !data.session) throw new ApiError("Sign in to continue", 401);
    token = data.session.access_token;
  }
  const send = () =>
    fetch(`/api/backend/${path}`, {
      method: options.method ?? "GET",
      cache: "no-store",
      signal: options.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.key ? { "Idempotency-Key": options.key } : {}),
      },
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    });
  let response = await send();
  if (response.status === 401 && !options.public) {
    const { data, error } = await client.auth.refreshSession();
    if (!error && data.session) {
      token = data.session.access_token;
      response = await send();
    }
  }
  if (response.status === 204 || response.status === 205) return undefined as T;
  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      "The service returned an unreadable response. Refresh to check the latest status before retrying a write.",
      response.ok ? 502 : response.status,
    );
  }
  if (!response.ok)
    throw new ApiError(
      Array.isArray(data?.message)
        ? data.message.join(". ")
        : (typeof data?.message === "string" ? data.message : "Request failed"),
      response.status,
    );
  return data as T;
}
export const query = (values: Record<string, string | number | undefined>) =>
  new URLSearchParams(
    Object.entries(values)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  ).toString();
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to complete this action.";
