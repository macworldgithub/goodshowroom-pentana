"use client";
import { useState } from "react";
import { api, errorMessage } from "@/lib/backend";
import type { Page, Task } from "@/lib/backend-types";
import { useWorkspace } from "./workspace-provider";
import {
  ActionDialog,
  Feedback,
  localDate,
  Pager,
  panelClass,
  timestamp,
  useResource,
  type Field,
} from "./live-common";
import { Badge, Button } from "./ui";
type Staff = { userId: string; fullName: string | null; permissions: string[] };
export function useStaff() {
  const { site, can } = useWorkspace();
  const [offset, setOffset] = useState(0);
  const resource = useResource<{ staff: Staff[]; pagination: Page }>(
    can("tasks.assign") || can("customers.assign")
      ? `sites/${site.id}/staff?limit=100&offset=${offset}`
      : null,
  );
  return { ...resource, offset, setOffset };
}
export function TaskEditor({
  task,
  customerId,
  onClose,
  onSaved,
}: {
  task?: Task;
  customerId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { site, can } = useWorkspace();
  const staff = useStaff();
  const fields: Field[] = [
    {
      name: "title",
      label: "Task title",
      value: task?.title ?? "",
      required: true,
      minLength: 2,
      maxLength: 180,
    },
    {
      name: "details",
      label: "Details",
      type: "textarea",
      value: task?.details ?? "",
    },
    {
      name: "dueAt",
      label: "Due time (your device’s timezone)",
      type: "datetime-local",
      value: localDate(task?.due_at ?? new Date().toISOString()),
      required: true,
    },
    {
      name: "priority",
      label: "Priority",
      type: "select",
      value: task?.priority ?? "normal",
      options: ["low", "normal", "high"].map((value) => ({
        value,
        label: value,
      })),
    },
    {
      name: "kind",
      label: "Work type",
      type: "select",
      value: task?.kind ?? "follow_up",
      options: [
        { value: "follow_up", label: "Follow-up" },
        { value: "call", label: "Scheduled call" },
      ],
    },
    ...(task && can("tasks.assign")
      ? [
          {
            name: "assignedTo",
            label: "Assigned staff member",
            type: "select" as const,
            value: task.assigned_to,
            options: [
              { value: task.assigned_to, label: "Current assignee" },
              ...(staff.data?.staff
                .filter(
                  (item) =>
                    item.permissions.includes("tasks.write") &&
                    item.userId !== task.assigned_to,
                )
                .map((item) => ({
                  value: item.userId,
                  label: item.fullName ?? `Staff ${item.userId.slice(0, 8)}`,
                })) ?? []),
            ],
          },
        ]
      : []),
  ];
  return (
    <ActionDialog
      title={task ? "Edit task" : "Create follow-up"}
      fields={fields}
      onClose={onClose}
      onSubmit={async (values) => {
        const body = {
          ...values,
          siteId: site.id,
          dueAt: new Date(String(values.dueAt)).toISOString(),
          ...(task ? { version: task.version ?? 0 } : { customerId }),
        };
        await api(task ? `tasks/${task.id}` : "tasks", {
          method: task ? "PATCH" : "POST",
          body,
        });
        onSaved();
      }}
    >
      {task && can("tasks.assign") && (
        <>
          <Feedback error={staff.error} />
          <Pager
            page={staff.data?.pagination}
            offset={staff.offset}
            setOffset={staff.setOffset}
          />
        </>
      )}
    </ActionDialog>
  );
}
export function TaskCard({
  task,
  onSaved,
  customerLink = true,
}: {
  task: Task;
  onSaved: () => void;
  customerLink?: boolean;
}) {
  const { site, can, context } = useWorkspace();
  const [dialog, setDialog] = useState<"edit" | "cancel" | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const open = !task.completed_at && !task.cancelled_at;
  const manageable =
    can("tasks.write") &&
    (task.assigned_to === context.user.id || can("tasks.view_team"));
  return (
    <div
      className={`${panelClass} flex flex-wrap items-start justify-between gap-4`}
    >
      <div className="min-w-0">
        <h3 className="font-bold">{task.title}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {timestamp(task.due_at, site.timezone)} ·{" "}
          {task.kind === "call" ? "Call" : "Follow-up"} · {task.priority}
        </p>
        {customerLink && (
          <a
            href={`/customers/${task.customer_id}`}
            className="mt-2 inline-block text-sm font-semibold text-brand underline"
          >
            {task.customer
              ? `${task.customer.first_name} ${task.customer.last_name}`
              : "Open customer"}
          </a>
        )}
        {task.details && (
          <p className="mt-2 whitespace-pre-wrap break-words text-sm">
            {task.details}
          </p>
        )}
        <Feedback error={error} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge
          tone={open ? (task.bucket === "overdue" ? "red" : "blue") : "slate"}
        >
          {task.cancelled_at
            ? "Cancelled"
            : task.completed_at
              ? "Completed"
              : (task.bucket ?? "Open")}
        </Badge>
        {open && manageable && (
          <>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setDialog("edit")}
            >
              Edit
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setDialog("cancel")}
            >
              Cancel task
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await api(`tasks/${task.id}/complete?siteId=${site.id}`, {
                    method: "PATCH",
                  });
                  onSaved();
                } catch (cause) {
                  setError(errorMessage(cause));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Complete
            </Button>
          </>
        )}
      </div>
      {dialog === "edit" && (
        <TaskEditor
          task={task}
          onClose={() => setDialog(null)}
          onSaved={onSaved}
        />
      )}
      {dialog === "cancel" && (
        <ActionDialog
          title="Cancel follow-up"
          fields={[
            {
              name: "reason",
              label: "Reason",
              type: "textarea",
              required: true,
              minLength: 3,
              maxLength: 1000,
            },
          ]}
          onClose={() => setDialog(null)}
          submitLabel="Cancel task"
          onSubmit={async (values) => {
            await api(`tasks/${task.id}/cancel`, {
              method: "PATCH",
              body: {
                siteId: site.id,
                version: task.version ?? 0,
                reason: values.reason,
              },
            });
            onSaved();
          }}
        />
      )}
    </div>
  );
}
