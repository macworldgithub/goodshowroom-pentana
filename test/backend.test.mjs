import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

test("Supabase browser configuration reports the current project path and uses public settings", () => {
  const missing = moduleFrom("lib/supabase/client.ts", {
    require: () => ({
      createBrowserClient: () =>
        assert.fail("Missing configuration must not initialize Supabase"),
    }),
  });
  assert.throws(
    () => missing.createClient(),
    /goodshowroom-pentana\/\.env\.local/,
  );
  const client = {};
  const configured = moduleFrom("lib/supabase/client.ts", {
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-test-key",
    },
    require: () => ({
      createBrowserClient: (url, key) => {
        assert.equal(url, "https://example.supabase.co");
        assert.equal(key, "public-test-key");
        return client;
      },
    }),
  });
  assert.equal(configured.createClient(), client);
});

test("workspace displays missing Supabase configuration without an uncaught effect error", async () => {
  const effects = [];
  const updates = [];
  let state = 0;
  const workspace = moduleFrom("components/workspace-provider.tsx", {
    require: (id) => {
      if (id === "react")
        return {
          createContext: () => ({}),
          useContext: () => null,
          useCallback: (fn) => fn,
          useRef: (value) => ({ current: value }),
          useEffect: (fn) => effects.push(fn),
          useState: (value) => {
            const index = state++;
            return [value, (next) => updates.push({ index, value: next })];
          },
        };
      if (id === "react/jsx-runtime")
        return {
          jsx: (type, props) => ({ type, props }),
          jsxs: (type, props) => ({ type, props }),
        };
      if (id === "next/navigation")
        return {
          useRouter: () => ({
            replace: () =>
              assert.fail("Do not redirect on configuration errors"),
          }),
        };
      if (id === "@/lib/supabase/client")
        return {
          createClient: () => {
            throw new Error("Supabase configuration missing");
          },
        };
      if (id === "@/lib/backend")
        return { errorMessage: (cause) => cause.message };
      return {};
    },
  });
  const previousWindow = globalThis.window;
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  try {
    workspace.WorkspaceProvider({ children: null });
    const cleanup = effects[0]();
    await Promise.resolve();
    assert.ok(
      updates.some(
        (update) => update.value === "Supabase configuration missing",
      ),
    );
    cleanup();
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

function moduleFrom(file, dependencies = {}) {
  const code = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const compiled = { exports: {} };
  new Function("module", "exports", "require", "fetch", "process", code)(
    compiled,
    compiled.exports,
    (id) => dependencies.require?.(id),
    dependencies.fetch,
    { env: dependencies.env ?? {} },
  );
  return compiled.exports;
}

function salesDialog(file, exportName, state, transport, props, resourceData) {
  let index = 0;
  const jsx = (type, props) => ({ type, props });
  const view = moduleFrom(file, {
    require: (id) => {
      if (id === "react/jsx-runtime")
        return { jsx, jsxs: jsx, Fragment: "Fragment" };
      if (id === "react")
        return {
          useState: (initial) => [state[index++] ?? initial, () => {}],
          useEffect: () => {},
        };
      if (id === "next/link") return { default: "Link" };
      if (id === "@/lib/backend") return transport;
      if (id === "@/lib/backend-types")
        return { customerName: (customer) => customer.first_name };
      if (id === "./workspace-provider")
        return {
          useWorkspace: () => ({
            site: { id: "site-id", name: "Site", timezone: "Australia/Sydney" },
            context: { user: { id: "staff-id" } },
            can: (permission) =>
              [
                "sales.write",
                "tasks.write",
                "service.write",
                "service.assign_work",
                "messages.write",
              ].includes(permission),
          }),
        };
      if (id === "./live-common")
        return {
          ActionDialog: "ActionDialog",
          localDate: (value) => String(value).slice(0, 16),
          timestamp: (value) => value ?? "",
          useResource: (path) => ({
            data:
              typeof resourceData === "function"
                ? resourceData(path)
                : resourceData,
            reload: () => {},
          }),
          useDirectory: () => ({
            items: [],
            error: "",
            loading: false,
            reload: () => {},
          }),
        };
      return new Proxy({}, { get: (_, key) => key });
    },
  });
  const tree = view[exportName](props);
  function find(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "ActionDialog") return node.props;
    for (const child of [node.props?.children].flat(Infinity)) {
      const result = find(child);
      if (result) return result;
    }
  }
  const dialog = find(tree);
  assert.ok(dialog, "Expected the workflow dialog to be rendered");
  return dialog;
}

test("RO check-in and collection forms use queued versioned actions and never edit payment context", async () => {
  const calls = [];
  const transport = client(
    async (url, init) => {
      calls.push({ url, init });
      return Response.json({});
    },
    { access_token: "test-token" },
  );
  const row = {
    id: "ro-id",
    number: "SIM-RO",
    customer_id: "customer-id",
    appointment_id: "appointment-id",
    vehicle: "Test vehicle",
    assigned_to: "staff-id",
    brand_id: "brand-id",
    status: "ready",
    version: 4,
    integration_mode: "simulated",
    promised_at: "2026-10-16T00:00:00Z",
    operations_summary: "Service",
    authority_notes: [],
    status_history: [],
    allowedTransitions: [],
  };
  const data = {
    repairOrder: row,
    commands: [],
    integration: { writesEnabled: true },
    advisor: { fullName: "Advisor" },
  };
  const checkIn = salesDialog(
    "components/live-repair-orders.tsx",
    "LiveRepairOrderDetail",
    [Date.now(), "check-in", ""],
    transport,
    { id: "ro-id" },
    (path) =>
      path?.includes("loan-cars")
        ? { loanCars: [] }
        : path?.includes("/staff")
          ? { staff: [] }
          : data,
  );
  await checkIn.onSubmit(
    {
      mileageIn: "42000",
      fuelLevel: "half",
      signatureConfirmed: true,
      loanCarId: "",
      notes: "Arrival",
    },
    "stable-arrival-key",
  );
  assert.equal(
    calls[0].url,
    "/api/backend/service/repair-orders/ro-id/actions/check-in",
  );
  assert.equal(calls[0].init.headers["Idempotency-Key"], "stable-arrival-key");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    siteId: "site-id",
    version: 4,
    mileageIn: 42000,
    fuelLevel: "half",
    signatureConfirmed: true,
    loanCarId: "",
    notes: "Arrival",
  });
  const collect = salesDialog(
    "components/live-repair-orders.tsx",
    "LiveRepairOrderDetail",
    [Date.now(), "collect", ""],
    transport,
    { id: "ro-id" },
    data,
  );
  await collect.onSubmit(
    { keysReturned: true, loanReturned: true, notes: "Customer collected" },
    "stable-collection-key",
  );
  const body = JSON.parse(calls[1].init.body);
  assert.equal(body.version, 4);
  assert.equal(body.keysReturned, true);
  assert.ok(!("paymentStatus" in body));
  assert.ok(!("invoiced_at" in body));
});

test("RO customer update saves a linked draft and performs no send", async () => {
  const calls = [];
  const transport = client(
    async (url, init) => {
      calls.push({ url, init });
      return Response.json({});
    },
    { access_token: "test-token" },
  );
  const row = {
    id: "ro-id",
    number: "SIM-RO",
    customer_id: "customer-id",
    appointment_id: "appointment-id",
    vehicle: "Test",
    assigned_to: "staff-id",
    status: "ready",
    version: 1,
    promised_at: "2026-10-16T00:00:00Z",
    authority_notes: [],
    status_history: [],
    allowedTransitions: [],
  };
  const dialog = salesDialog(
    "components/live-repair-orders.tsx",
    "LiveRepairOrderDetail",
    [Date.now(), "message", ""],
    transport,
    { id: "ro-id" },
    {
      repairOrder: row,
      commands: [],
      integration: { writesEnabled: true },
      advisor: { fullName: "Advisor" },
    },
  );
  await dialog.onSubmit(
    { channel: "sms", subject: "Update", body: "Review before sending" },
    "stable-draft-key",
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/backend/customers/customer-id/messages");
  assert.equal(JSON.parse(calls[0].init.body).repairOrderId, "ro-id");
  assert.equal(JSON.parse(calls[0].init.body).appointmentId, "appointment-id");
});

test("Workshop forms send typed hours, resource versions and safe retry keys", async () => {
  const calls = [];
  const transport = client(
    async (url, init) => {
      calls.push({ url, init });
      return Response.json({});
    },
    { access_token: "test-token" },
  );
  const create = salesDialog(
    "components/live-service-diary.tsx",
    "LiveServiceDiary",
    ["", "", "60", 0, "new"],
    transport,
    { onBook: () => {} },
  );
  const values = {
    name: "Bay one",
    days: "1,2,3,4,5",
    openMinute: "480",
    closeMinute: "1020",
  };
  await create.onSubmit(values, "stable-resource-key");
  assert.equal(calls[0].url, "/api/backend/service/resources");
  assert.equal(calls[0].init.headers["Idempotency-Key"], "stable-resource-key");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    siteId: "site-id",
    name: "Bay one",
    days: [1, 2, 3, 4, 5],
    openMinute: 480,
    closeMinute: 1020,
  });
  const row = {
    id: "bay-id",
    name: values.name,
    days: [1, 2, 3, 4, 5],
    open_minute: 480,
    close_minute: 1020,
    active: true,
    version: 3,
  };
  const edit = salesDialog(
    "components/live-service-diary.tsx",
    "LiveServiceDiary",
    ["", "", "60", 0, row],
    transport,
    { onBook: () => {} },
  );
  await edit.onSubmit({ ...values, active: false });
  assert.equal(calls[1].init.method, "PATCH");
  assert.equal(JSON.parse(calls[1].init.body).version, 3);
  assert.equal(JSON.parse(calls[1].init.body).active, false);
});

test("Service appointment forms preserve booking times, versions and explicit outcomes", async () => {
  const calls = [];
  const transport = client(
    async (url, init) => {
      calls.push({ url, init });
      return Response.json({});
    },
    { access_token: "test-token" },
  );
  const booking = salesDialog(
    "components/live-service-appointments.tsx",
    "LiveServiceAppointments",
    ["booked", 0, { kind: "new" }],
    transport,
  );
  const values = {
    customerId: "customer-id",
    brandId: "brand-id",
    resourceId: "bay-id",
    title: "Maintenance",
    vehicle: "Kia TEST-123",
    notes: "",
    startsAt: "2026-10-20T10:00",
    endsAt: "2026-10-20T11:00",
  };
  await booking.onSubmit(values, "stable-booking-key");
  assert.equal(calls[0].url, "/api/backend/service/appointments");
  assert.equal(calls[0].init.headers["Idempotency-Key"], "stable-booking-key");
  assert.equal(
    JSON.parse(calls[0].init.body).startsAt,
    new Date(values.startsAt).toISOString(),
  );
  assert.equal(JSON.parse(calls[0].init.body).resourceId, "bay-id");
  const row = {
    id: "appointment-id",
    resource_id: "bay-id",
    version: 3,
    title: values.title,
    vehicle: values.vehicle,
    notes: "",
    status: "booked",
    starts_at: "2026-10-20T10:00",
    ends_at: "2026-10-20T11:00",
  };
  const edit = salesDialog(
    "components/live-service-appointments.tsx",
    "LiveServiceAppointments",
    ["booked", 0, { kind: "edit", row }],
    transport,
  );
  await edit.onSubmit(values);
  assert.equal(calls[1].init.method, "PATCH");
  assert.equal(JSON.parse(calls[1].init.body).version, 3);
  assert.equal(
    Object.hasOwn(JSON.parse(calls[1].init.body), "startsAt"),
    false,
    "Unchanged schedule should preserve confirmation",
  );
  const outcome = salesDialog(
    "components/live-service-appointments.tsx",
    "LiveServiceAppointments",
    ["booked", 0, { kind: "status", row }],
    transport,
  );
  await outcome.onSubmit({
    status: "cancelled",
    outcomeNote: "Customer changed plans",
  });
  assert.deepEqual(JSON.parse(calls[2].init.body), {
    siteId: "site-id",
    version: 3,
    status: "cancelled",
    outcomeNote: "Customer changed plans",
  });
});

test("enquiry and pipeline forms send JSON objects through the authenticated transport with their version and retry key", async () => {
  const calls = [];
  const transport = client(
    async (url, init) => {
      calls.push({ url, init });
      return Response.json({});
    },
    { access_token: "test-token" },
  );
  const create = salesDialog(
    "components/live-leads.tsx",
    "LiveLeads",
    ["", "", "", 0, "new"],
    transport,
  );
  await create.onSubmit(
    {
      customerId: "customer-id",
      title: "SUV interest",
      source: "Website",
      vehicleInterest: "SUV",
      followUpAt: "2026-10-14T09:00",
    },
    "stable-enquiry-key",
  );
  assert.equal(calls[0].url, "/api/backend/sales/leads");
  assert.equal(calls[0].init.headers["Idempotency-Key"], "stable-enquiry-key");
  assert.equal(JSON.parse(calls[0].init.body).customerId, "customer-id");
  assert.equal(typeof JSON.parse(calls[0].init.body), "object");
  const lead = {
    id: "lead-id",
    title: "SUV interest",
    source: "Website",
    status: "qualified",
    version: 4,
    pipeline_stage: "test_drive",
  };
  const edit = salesDialog(
    "components/live-leads.tsx",
    "LiveLeads",
    ["", "", "", 0, lead],
    transport,
  );
  await edit.onSubmit(
    {
      title: "Updated interest",
      source: "Website",
      status: "qualified",
      vehicleInterest: "",
    },
    "unused-edit-key",
  );
  assert.equal(calls[1].url, "/api/backend/sales/leads/lead-id");
  assert.equal(calls[1].init.method, "PATCH");
  assert.equal(JSON.parse(calls[1].init.body).version, 4);
  const move = salesDialog(
    "components/live-pipeline.tsx",
    "LivePipeline",
    ["", "", "", 0, lead],
    transport,
  );
  await move.onSubmit({
    stage: "negotiation",
    reason: "Customer discussed options",
  });
  assert.equal(calls[2].url, "/api/backend/sales/pipeline/lead-id/stage");
  assert.deepEqual(JSON.parse(calls[2].init.body), {
    siteId: "site-id",
    version: 4,
    stage: "negotiation",
    reason: "Customer discussed options",
  });
  const stock = salesDialog(
    "components/live-stock.tsx",
    "LiveStock",
    ["", "", "available", "", "", "", {}, 0, "", "new"],
    transport,
  );
  await stock.onSubmit(
    {
      brandId: "brand-id",
      stockNumber: "S-001",
      make: "Kia",
      model: "Sportage",
      variant: "",
      year: "2026",
      odometerKm: "150",
      bodyType: "SUV",
      fuelType: "Petrol",
      transmission: "Automatic",
      colour: "",
      vin: "",
      price: "34990.25",
    },
    "stable-stock-key",
  );
  assert.equal(calls[3].url, "/api/backend/sales/stock");
  assert.equal(calls[3].init.headers["Idempotency-Key"], "stable-stock-key");
  const stockBody = JSON.parse(calls[3].init.body);
  assert.equal(stockBody.priceCents, 3499025);
  assert.equal(stockBody.year, 2026);
  assert.equal(stockBody.brandId, "brand-id");
  const shortlist = salesDialog(
    "components/live-stock.tsx",
    "LiveStock",
    [
      "",
      "",
      "available",
      "",
      "",
      "",
      {},
      0,
      "",
      null,
      {
        vehicle: { id: "stock-id", make: "Kia", model: "Sportage" },
        lead: { id: "lead-id", title: "SUV", version: 4 },
        action: "add",
      },
    ],
    transport,
  );
  await shortlist.onSubmit({ note: "Matches the requested SUV" });
  assert.equal(calls[4].url, "/api/backend/sales/leads/lead-id/stock");
  assert.deepEqual(JSON.parse(calls[4].init.body), {
    siteId: "site-id",
    version: 4,
    stockId: "stock-id",
    action: "add",
    note: "Matches the requested SUV",
  });
  const appraisalProps = {
    lead: { id: "lead-id", title: "Trade-in enquiry", status: "new" },
    onClose: () => {},
    onSaved: () => {},
  };
  const draft = salesDialog(
    "components/live-appraisals.tsx",
    "LiveAppraisals",
    [0, "new"],
    transport,
    appraisalProps,
  );
  const vehicle = {
    make: "Toyota",
    model: "Corolla",
    year: "2020",
    odometerKm: "85000",
    registration: "ABC123",
    vin: "",
    conditionNotes: "Good condition; minor scratches",
  };
  await draft.onSubmit(vehicle, "stable-appraisal-key");
  assert.equal(calls[5].url, "/api/backend/sales/leads/lead-id/appraisals");
  assert.equal(
    calls[5].init.headers["Idempotency-Key"],
    "stable-appraisal-key",
  );
  assert.equal(JSON.parse(calls[5].init.body).year, 2020);
  const assessment = salesDialog(
    "components/live-appraisals.tsx",
    "LiveAppraisals",
    [0, { id: "appraisal-id", version: 2 }],
    transport,
    appraisalProps,
  );
  await assessment.onSubmit(
    {
      ...vehicle,
      status: "valued",
      valuation: "14500.50",
      valuationNotes: "Internal condition assessment",
      withdrawalReason: "",
    },
    "unused-key",
  );
  assert.equal(
    calls[6].url,
    "/api/backend/sales/leads/lead-id/appraisals/appraisal-id",
  );
  const valued = JSON.parse(calls[6].init.body);
  assert.equal(valued.version, 2);
  assert.equal(valued.valuationCents, 1450050);
  assert.equal(valued.status, "valued");
  const proposalProps = {
    lead: { id: "lead-id", title: "Vehicle enquiry", status: "new" },
    onClose: () => {},
    onSaved: () => {},
  };
  const proposal = salesDialog(
    "components/live-deals.tsx",
    "LiveDeals",
    [0, "new"],
    transport,
    proposalProps,
  );
  const proposalValues = {
    stockId: "stock-id",
    appraisalId: "appraisal-id",
    salePrice: "34990.00",
    discount: "1000.00",
    fees: "500.00",
    notes: "Internal pricing proposal",
  };
  await proposal.onSubmit(proposalValues, "stable-deal-key");
  assert.equal(calls[7].url, "/api/backend/sales/leads/lead-id/deals");
  assert.equal(calls[7].init.headers["Idempotency-Key"], "stable-deal-key");
  const proposalBody = JSON.parse(calls[7].init.body);
  assert.equal(proposalBody.salePriceCents, 3499000);
  assert.equal(proposalBody.discountCents, 100000);
  assert.equal(proposalBody.feesCents, 50000);
  assert.equal(proposalBody.appraisalId, "appraisal-id");
  assert.equal(proposalBody.totalCents, undefined);
  const submit = salesDialog(
    "components/live-deals.tsx",
    "LiveDeals",
    [
      0,
      null,
      {
        deal: {
          id: "deal-id",
          stock_label: "Stock vehicle",
          total_cents: 1998950,
          version: 2,
        },
        name: "submit",
      },
    ],
    transport,
    proposalProps,
  );
  await submit.onSubmit({ note: "Ready for internal review" });
  assert.equal(
    calls[8].url,
    "/api/backend/sales/leads/lead-id/deals/deal-id/status",
  );
  assert.deepEqual(JSON.parse(calls[8].init.body), {
    siteId: "site-id",
    version: 2,
    action: "submit",
    note: "Ready for internal review",
  });
  const reservationProps = {
    leadId: "lead-id",
    deal: {
      id: "deal-id",
      version: 2,
      status: "approved",
      stock_label: "Vehicle",
    },
    onClose: () => {},
    onSaved: () => {},
  };
  const reserve = salesDialog(
    "components/live-reservations.tsx",
    "LiveReservations",
    [0, "new", "2026-10-15T09:00"],
    transport,
    reservationProps,
  );
  await reserve.onSubmit(
    { expiresAt: "2026-10-15T09:00", note: "Hold for approved proposal" },
    "stable-reservation-key",
  );
  assert.equal(
    calls[9].url,
    "/api/backend/sales/leads/lead-id/deals/deal-id/reservations",
  );
  assert.equal(
    calls[9].init.headers["Idempotency-Key"],
    "stable-reservation-key",
  );
  assert.equal(JSON.parse(calls[9].init.body).dealVersion, 2);
  const release = salesDialog(
    "components/live-reservations.tsx",
    "LiveReservations",
    [0, { id: "hold-id", version: 0 }, "2026-10-15T09:00"],
    transport,
    reservationProps,
  );
  await release.onSubmit({ note: "Customer requested release" });
  assert.equal(
    calls[10].url,
    "/api/backend/sales/leads/lead-id/deals/deal-id/reservations/hold-id/release",
  );
  assert.deepEqual(JSON.parse(calls[10].init.body), {
    siteId: "site-id",
    version: 0,
    note: "Customer requested release",
  });
  const deliveryProps = {
    leadId: "lead-id",
    deal: { id: "deal-id", status: "approved", stock_label: "Stock vehicle" },
    onClose: () => {},
    onSaved: () => {},
  };
  const planning = salesDialog(
    "components/live-deliveries.tsx",
    "LiveDeliveryDialog",
    [{ kind: "plan" }, "2026-10-15T09:00"],
    transport,
    deliveryProps,
  );
  await planning.onSubmit(
    { scheduledAt: "2026-10-15T09:00", notes: "Delivery planning test" },
    "stable-delivery-key",
  );
  assert.equal(calls[11].url, "/api/backend/sales/deliveries");
  assert.equal(
    calls[11].init.headers["Idempotency-Key"],
    "stable-delivery-key",
  );
  const planned = JSON.parse(calls[11].init.body);
  assert.equal(planned.leadId, "lead-id");
  assert.equal(planned.dealId, "deal-id");
  const checklist = salesDialog(
    "components/live-deliveries.tsx",
    "LiveDeliveryDialog",
    [
      {
        kind: "check",
        plan: { id: "delivery-id", version: 3 },
        item: "documents",
        complete: true,
      },
      "2026-10-15T09:00",
    ],
    transport,
    deliveryProps,
  );
  await checklist.onSubmit({ complete: true, note: "Documents reviewed" });
  assert.equal(
    calls[12].url,
    "/api/backend/sales/deliveries/delivery-id/checklist",
  );
  assert.deepEqual(JSON.parse(calls[12].init.body), {
    siteId: "site-id",
    version: 3,
    item: "documents",
    complete: true,
    note: "Documents reviewed",
  });
  const reschedule = salesDialog(
    "components/live-deliveries.tsx",
    "LiveDeliveryDialog",
    [
      {
        kind: "plan",
        plan: {
          id: "delivery-id",
          version: 4,
          scheduled_at: "2026-10-15T09:00:00.000Z",
        },
      },
      "2026-10-15T09:00",
    ],
    transport,
    deliveryProps,
  );
  await reschedule.onSubmit({
    scheduledAt: "2026-10-15T10:00",
    notes: "New appointment time",
  });
  assert.equal(calls[13].url, "/api/backend/sales/deliveries/delivery-id");
  assert.equal(JSON.parse(calls[13].init.body).version, 4);
  const cancelPlan = salesDialog(
    "components/live-deliveries.tsx",
    "LiveDeliveryDialog",
    [
      { kind: "cancel", plan: { id: "delivery-id", version: 5 } },
      "2026-10-15T09:00",
    ],
    transport,
    deliveryProps,
  );
  await cancelPlan.onSubmit({ note: "Customer requested another date" });
  assert.equal(
    calls[14].url,
    "/api/backend/sales/deliveries/delivery-id/cancel",
  );
  assert.equal(JSON.parse(calls[14].init.body).version, 5);
});
function proxy(fetch, env = { BACKEND_API_URL: "http://backend.test/api" }) {
  return moduleFrom("app/api/backend/[...path]/route.ts", { fetch, env });
}
const route = (path) => ({
  params: Promise.resolve({ path: path.split("/") }),
});
const incoming = (path, init = {}) =>
  new Request("http://frontend.test/api/backend/" + path, init);
test("proxy rejects unauthenticated requests and traversal before contacting backend", async () => {
  let calls = 0;
  const handler = proxy(() => {
    calls++;
  });
  assert.equal(
    (await handler.GET(incoming("customers"), route("customers"))).status,
    401,
  );
  assert.equal(
    (await handler.GET(incoming("customers"), route("customers/.."))).status,
    400,
  );
  assert.equal(calls, 0);
});
test("proxy preserves token, idempotency key, JSON body, query and backend status without forwarding cookies", async () => {
  let target, options;
  const handler = proxy(async (url, init) => {
    target = url;
    options = init;
    return Response.json({ command: { status: "queued" } }, { status: 202 });
  });
  const response = await handler.POST(
    incoming("customers?siteId=site", {
      method: "POST",
      headers: {
        Authorization: "Bearer user-token",
        Cookie: "secret=cookie",
        "Idempotency-Key": "stable-key",
        Origin: "http://frontend.test",
      },
      body: JSON.stringify({
        firstName: "Test",
        expectedRevision: "source-revision-1",
      }),
    }),
    route("customers"),
  );
  assert.equal(target, "http://backend.test/api/customers?siteId=site");
  assert.equal(options.headers.get("Authorization"), "Bearer user-token");
  assert.equal(options.headers.get("Cookie"), null);
  assert.equal(options.headers.get("Idempotency-Key"), "stable-key");
  assert.deepEqual(JSON.parse(options.body), {
    firstName: "Test",
    expectedRevision: "source-revision-1",
  });
  assert.equal(options.cache, "no-store");
  assert.equal(options.redirect, "error");
  assert.equal(response.status, 202);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});
test("proxy refuses cross-origin writes and only permits public initial account creation", async () => {
  let calls = 0;
  const handler = proxy(async () => {
    calls++;
    return Response.json({});
  });
  assert.equal(
    (
      await handler.POST(
        incoming("customers", {
          method: "POST",
          headers: {
            Authorization: "Bearer token",
            Origin: "https://other.test",
          },
          body: "{}",
        }),
        route("customers"),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handler.POST(
        incoming("admin/users", { method: "POST", body: "{}" }),
        route("admin/users"),
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await handler.POST(
        incoming("auth/initial-user", { method: "POST", body: "{}" }),
        route("auth/initial-user"),
      )
    ).status,
    200,
  );
  assert.equal(calls, 1);
});
test("proxy returns actionable unavailable responses without raw upstream diagnostics", async () => {
  const handler = proxy(async () => {
    throw new Error("Private endpoint/password");
  });
  const response = await handler.GET(
    incoming("auth/me", { headers: { Authorization: "Bearer token" } }),
    route("auth/me"),
  );
  assert.equal(response.status, 502);
  assert.match((await response.json()).message, /check its status/i);
  const disabled = proxy(() => {
    throw new Error("Should not call");
  }, {});
  assert.equal(
    (
      await disabled.GET(
        incoming("auth/me", { headers: { Authorization: "Bearer token" } }),
        route("auth/me"),
      )
    ).status,
    503,
  );
});
function client(
  fetch,
  session,
  refresh = async () => ({ data: { session: null }, error: null }),
) {
  return moduleFrom("lib/backend.ts", {
    fetch,
    require: () => ({
      createClient: () => ({
        auth: {
          getSession: async () => ({ data: { session }, error: null }),
          refreshSession: refresh,
        },
      }),
    }),
  });
}
test("client obtains session token for every request and refreshes 401 once while preserving the write key", async () => {
  const calls = [];
  let refreshCount = 0;
  const helper = client(
    async (url, init) => {
      calls.push({ url, init });
      return calls.length === 1
        ? Response.json({ message: "Expired" }, { status: 401 })
        : Response.json({ command: { id: "command" } }, { status: 202 });
    },
    { access_token: "old-token" },
    async () => {
      refreshCount++;
      return { data: { session: { access_token: "new-token" } }, error: null };
    },
  );
  await helper.api("customers", {
    method: "POST",
    key: "stable-idempotency",
    body: { firstName: "Test", expectedRevision: "source-revision-1" },
  });
  assert.equal(calls.length, 2);
  assert.equal(refreshCount, 1);
  assert.equal(calls[0].init.headers.Authorization, "Bearer old-token");
  assert.equal(calls[1].init.headers.Authorization, "Bearer new-token");
  assert.equal(
    calls[0].init.headers["Idempotency-Key"],
    calls[1].init.headers["Idempotency-Key"],
  );
  assert.equal(calls[0].init.body, calls[1].init.body);
});
test("client rejects missing session before fetching and preserves backend consent/access errors", async () => {
  const noSession = client(() => {
    throw new Error("Should not fetch");
  }, null);
  await assert.rejects(
    noSession.api("customers"),
    (error) => error.status === 401,
  );
  const helper = client(
    async () =>
      Response.json(
        { message: "Confirmed email consent is required" },
        { status: 403 },
      ),
    { access_token: "token" },
  );
  await assert.rejects(
    helper.api("messages/id/send", {
      method: "POST",
      key: "test-send",
      body: {},
    }),
    (error) => error.status === 403 && /consent/.test(error.message),
  );
});
test("client preserves abort signals and handles public setup without acquiring a session token", async () => {
  const controller = new AbortController();
  let init;
  const helper = client(async (_url, options) => {
    init = options;
    return Response.json({ created: true });
  }, null);
  await helper.api("auth/initial-user", {
    public: true,
    method: "POST",
    signal: controller.signal,
    body: { email: "test@example.test" },
  });
  assert.equal(init.signal, controller.signal);
  assert.equal(init.headers.Authorization, undefined);
  assert.equal(
    helper.query({ search: "A & B", offset: 20, absent: undefined }),
    "search=A+%26+B&offset=20",
  );
});
