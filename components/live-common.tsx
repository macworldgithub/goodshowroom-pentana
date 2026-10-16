"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { api, errorMessage } from "@/lib/backend";
import type { Page } from "@/lib/backend-types";
import { Button, FormField, inputClass, Modal } from "./ui";
export function useResource<T>(path: string | null, refreshMs = 0) {
  const [snapshot, setSnapshot] = useState<{
    path: string;
    revision: number;
    value?: T;
    error?: string;
  }>();
  const [revision, update] = useState(0);
  const reload = useCallback(() => update((value) => value + 1), []);
  useEffect(() => {
    if (!path || refreshMs < 1000) return;
    const timer = setInterval(() => { if (document.visibilityState === "visible") reload(); }, refreshMs);
    return () => clearInterval(timer);
  }, [path, refreshMs, reload]);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    if (!path) return;
    api<T>(path, { signal: controller.signal })
      .then((result) => {
        if (active) setSnapshot({ path, revision, value: result });
      })
      .catch((cause) => {
        if (active)
          setSnapshot((previous) => ({
            path,
            revision,
            error: errorMessage(cause),
            value: previous?.path === path ? previous.value : undefined,
          }));
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [path, revision]);
  return {
    data: snapshot?.path === path ? snapshot.value : undefined,
    error:
      snapshot?.path === path && snapshot.revision === revision
        ? (snapshot.error ?? "")
        : "",
    loading:
      !!path && (snapshot?.path !== path || snapshot.revision !== revision),
    reload,
  };
}
export function Feedback({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  return (
    <>
      {error && (
        <p
          role="alert"
          className="my-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="my-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
        >
          {message}
        </p>
      )}
    </>
  );
}
export function ResourceState({
  resource,
}: {
  resource: { loading: boolean; error: string; reload: () => void };
}) {
  return (
    <>
      {resource.loading && (
        <p role="status" className="p-4 text-slate-500">
          Loading…
        </p>
      )}
      <Feedback error={resource.error} />
      {resource.error && (
        <Button variant="secondary" onClick={resource.reload}>
          Retry
        </Button>
      )}
    </>
  );
}
export function Pager({
  page,
  offset,
  setOffset,
}: {
  page?: Page;
  offset: number;
  setOffset: (offset: number) => void;
}) {
  if (!page) return null;
  return (
    <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
      <Button
        variant="secondary"
        disabled={!offset}
        onClick={() => setOffset(Math.max(0, offset - page.limit))}
      >
        Previous
      </Button>
      <span className="text-sm text-slate-500">
        Page {Math.floor(offset / page.limit) + 1}
      </span>
      <Button
        variant="secondary"
        disabled={!page.hasMore}
        onClick={() => setOffset(page.nextOffset!)}
      >
        Next
      </Button>
    </div>
  );
}
export type Field = {
  name: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "tel"
    | "password"
    | "datetime-local"
    | "textarea"
    | "select"
    | "checkbox"
    | "number";
  value?: string | number | boolean;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  options?: { value: string; label: string }[];
  hint?: string;
  onChange?: (value: string) => void;
};
export type Values = Record<string, string | boolean>;
export function ActionDialog({
  title,
  description,
  fields,
  submitLabel = "Save",
  onClose,
  onSubmit,
  children,
}: {
  title: string;
  description?: string;
  fields: Field[];
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (values: Values, key: string) => Promise<void>;
  children?: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const keys = useRef(new Map<string, string>());
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const values: Values = Object.fromEntries(
      fields.map((field) => [
        field.name,
        field.type === "checkbox"
          ? form.has(field.name)
          : field.type === "password"
            ? String(form.get(field.name) ?? "")
            : String(form.get(field.name) ?? "").trim(),
      ]),
    );
    const fingerprint = JSON.stringify(values);
    const key = keys.current.get(fingerprint) ?? crypto.randomUUID();
    keys.current.set(fingerprint, key);
    setBusy(true);
    setError("");
    try {
      await onSubmit(values, key);
      onClose();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open
      title={title}
      description={description}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form onSubmit={submit} className="space-y-4 p-5">
        {fields.map((field) => (
          <FormField key={field.name} label={field.label}>
            {field.type === "select" ? (
              <select
                name={field.name}
                aria-label={field.label}
                className={inputClass}
                defaultValue={String(field.value ?? "")}
                required={field.required}
                onChange={(event) => field.onChange?.(event.target.value)}
              >
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field.type === "checkbox" ? (
              <input
                name={field.name}
                aria-label={field.label}
                type="checkbox"
                defaultChecked={field.value === true}
                className="h-5 w-5 accent-red-700"
              />
            ) : field.type === "textarea" ? (
              <textarea
                name={field.name}
                aria-label={field.label}
                className={`${inputClass} min-h-28 py-3`}
                defaultValue={String(field.value ?? "")}
                required={field.required}
                minLength={field.minLength}
                maxLength={field.maxLength ?? 5000}
              />
            ) : (
              <input
                name={field.name}
                aria-label={field.label}
                type={field.type ?? "text"}
                className={inputClass}
                defaultValue={String(field.value ?? "")}
                required={field.required}
                minLength={field.minLength}
                maxLength={field.maxLength}
                autoComplete={
                  field.type === "password" ? "new-password" : undefined
                }
              />
            )}
            {field.hint && (
              <span className="mt-1 block text-xs font-normal text-slate-500">
                {field.hint}
              </span>
            )}
          </FormField>
        ))}
        {children}
        <Feedback error={error} />
        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export const panelClass =
  "rounded-xl border border-slate-200 bg-white p-5 shadow-sm";
export function timestamp(value?: string | null, timezone?: string) {
  return value
    ? new Intl.DateTimeFormat("en-AU", {
        dateStyle: "medium",
        timeStyle: "short",
        ...(timezone ? { timeZone: timezone } : {}),
      }).format(new Date(value))
    : "—";
}
// datetime-local is explicitly displayed/entered in this device's timezone.
export function localDate(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

// Dropdowns need all choices, fetched through the backend's paginated contract.
export function useDirectory<T>(path: string | null, collection: string) {
  const [snapshot, setSnapshot] = useState<{
    path: string;
    revision: number;
    items: T[];
    error?: string;
  }>();
  const [revision, update] = useState(0);
  const reload = useCallback(() => update((value) => value + 1), []);
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    let active = true;
    async function load() {
      const items: T[] = [];
      let offset = 0;
      while (true) {
        const data = await api<{ pagination: Page } & Record<string, unknown>>(
          `${path}${path!.includes("?") ? "&" : "?"}offset=${offset}&limit=100`,
          { signal: controller.signal },
        );
        if (!Array.isArray(data[collection]))
          throw new Error("Invalid directory response");
        items.push(...(data[collection] as T[]));
        if (!data.pagination.hasMore) return items;
        if (
          data.pagination.nextOffset === null ||
          data.pagination.nextOffset <= offset
        )
          throw new Error("Invalid directory pagination");
        offset = data.pagination.nextOffset;
      }
    }
    load()
      .then((items) => {
        if (active) setSnapshot({ path, revision, items });
      })
      .catch((cause) => {
        if (active)
          setSnapshot({
            path,
            revision,
            items: [],
            error: errorMessage(cause),
          });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [path, collection, revision]);
  return {
    items: snapshot?.path === path ? snapshot.items : [],
    error: snapshot?.path === path ? (snapshot.error ?? "") : "",
    loading:
      !!path && (snapshot?.path !== path || snapshot.revision !== revision),
    reload,
  };
}
