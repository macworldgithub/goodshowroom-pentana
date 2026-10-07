"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  EmptyState,
  Icon,
  inputClass,
  Modal,
  PageHeader,
  Panel,
  PanelHeading,
  StatCard,
} from "./ui";

const steps = ["Upload", "Map fields", "Validate", "Review", "Complete"];
const history = [
  [
    "pentana_customers_2026-10-06.csv",
    "Customers",
    "Today, 6:02 am",
    "18 added · 342 updated",
    "2 review",
  ],
  [
    "vehicle_stock_2026-10-06.csv",
    "Stock",
    "Today, 6:01 am",
    "7 added · 86 updated",
    "Complete",
  ],
  [
    "open_deals_2026-10-05.csv",
    "Deals",
    "Yesterday, 4:12 pm",
    "3 added · 21 updated",
    "4 review",
  ],
];

export function ImportsView() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState("");
  const [dataType, setDataType] = useState("Customers");
  const [notice, setNotice] = useState("");
  function close() {
    setOpen(false);
    setStep(0);
    setFileName("");
  }
  return (
    <>
      <PageHeader
        eyebrow="Admin only"
        title="Data imports"
        description="Validate and apply Pentana snapshots without overwriting CRM-owned history."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Icon name="upload" className="h-4 w-4" />
            New import
          </Button>
        }
      />
      {notice && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          {notice}
        </div>
      )}
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Last refresh"
          value="6:02 am"
          detail="Customers imported today"
          icon="refresh"
        />
        <StatCard
          label="Records updated"
          value="449"
          detail="Across today’s imports"
          icon="file"
          tone="blue"
        />
        <StatCard
          label="Needs review"
          value="2"
          detail="Possible customer matches"
          icon="warning"
          tone="amber"
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Panel>
          <PanelHeading
            title="Import history"
            description="Every file, operator and outcome is recorded."
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">File</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Imported</th>
                  <th className="px-5 py-3">Outcome</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map(([file, type, time, outcome, state]) => (
                  <tr key={file}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600">
                          <Icon name="file" className="h-4 w-4" />
                        </span>
                        <strong className="text-sm text-slate-900">
                          {file}
                        </strong>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{type}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{time}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {outcome}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={state === "Complete" ? "green" : "amber"}>
                        {state}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel>
          <PanelHeading title="Import safeguards" />
          <div className="space-y-3 p-5 text-sm text-slate-600">
            {[
              "Stable IDs prevent duplicate reimports",
              "Missing values do not erase data",
              "CRM notes and tasks are protected",
              "Unmatched links require review",
            ].map((rule) => (
              <div className="flex gap-2" key={rule}>
                <Icon
                  name="check"
                  className="h-4 w-4 shrink-0 text-emerald-700"
                />
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Modal
        open={open}
        onClose={close}
        title="Import Pentana data"
        description="Only Admin users can validate and apply imports."
      >
        <div className="border-b border-slate-100 px-6 py-4">
          <div className="flex items-center">
            {steps.map((label, index) => (
              <div
                key={label}
                className="flex flex-1 items-center last:flex-none"
              >
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs font-black ${index <= step ? "bg-red-600 text-white" : "bg-slate-100 text-slate-400"}`}
                >
                  {index < step ? (
                    <Icon name="check" className="h-3.5 w-3.5" />
                  ) : (
                    index + 1
                  )}
                </span>
                {index < steps.length - 1 && (
                  <span
                    className={`mx-1 h-px flex-1 ${index < step ? "bg-red-500" : "bg-slate-200"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="min-h-[310px] p-6">
          {step === 0 && (
            <div>
              <label className="text-sm font-bold text-slate-700">
                Data type
                <select
                  value={dataType}
                  onChange={(event) => setDataType(event.target.value)}
                  className={`mt-2 ${inputClass}`}
                >
                  <option>Customers</option>
                  <option>Stock</option>
                  <option>Open enquiries and deals</option>
                  <option>Service appointments</option>
                  <option>Repair orders</option>
                </select>
              </label>
              <label className="mt-5 grid min-h-40 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-red-500">
                <input
                  className="sr-only"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) =>
                    setFileName(event.target.files?.[0]?.name ?? "")
                  }
                />
                <span>
                  <Icon
                    name="upload"
                    className="mx-auto h-7 w-7 text-red-600"
                  />
                  <strong className="mt-3 block text-sm text-slate-900">
                    {fileName || "Choose a CSV file"}
                  </strong>
                  <small className="text-slate-500">
                    Identifiers remain text to preserve leading zeros.
                  </small>
                </span>
              </label>
            </div>
          )}
          {step === 1 && (
            <div>
              <h3 className="font-black text-slate-900">Map CSV columns</h3>
              <div className="mt-5 space-y-3">
                {[
                  ["Customer Number", "Pentana customer ID"],
                  ["First Name", "First name"],
                  ["Surname", "Last name"],
                  ["Mobile", "Phone number"],
                ].map(([source, target]) => (
                  <div
                    key={source}
                    className="grid grid-cols-[1fr_auto_1fr] items-center gap-3"
                  >
                    <span className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      {source}
                    </span>
                    <Icon name="chevron" className="h-4 w-4 text-slate-400" />
                    <select className={inputClass}>
                      <option>{target}</option>
                      <option>Do not import</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <h3 className="font-black text-slate-900">Validation results</h3>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  ["1,248", "Valid"],
                  ["2", "Review"],
                  ["1", "Invalid"],
                ].map(([value, label]) => (
                  <div
                    className="rounded-xl border border-slate-200 p-4 text-center"
                    key={label}
                  >
                    <strong className="text-2xl text-slate-900">{value}</strong>
                    <span className="block text-xs text-slate-500">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step === 3 && (
            <div>
              <h3 className="font-black text-slate-900">
                Review proposed changes
              </h3>
              <div className="mt-5 divide-y rounded-xl border border-slate-200">
                {[
                  ["New records", "18"],
                  ["Updates", "1,230"],
                  ["Held for review", "2"],
                  ["Skipped", "1"],
                ].map(([label, value]) => (
                  <div className="flex justify-between p-4 text-sm" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step === 4 && (
            <EmptyState
              icon="check"
              title="Import applied"
              description="The snapshot was processed and two possible matches were held for Admin review."
            />
          )}
        </div>
        <div className="flex justify-between border-t border-slate-100 px-6 py-4">
          <Button
            variant="secondary"
            onClick={step === 0 ? close : () => setStep((value) => value - 1)}
          >
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < 4 ? (
            <Button
              disabled={step === 0 && !fileName}
              onClick={() => setStep((value) => value + 1)}
            >
              {step === 3 ? "Apply import" : "Continue"}
            </Button>
          ) : (
            <Button
              onClick={() => {
                close();
                setNotice(`${dataType} import completed successfully.`);
              }}
            >
              Done
            </Button>
          )}
        </div>
      </Modal>
    </>
  );
}
