export type Page = {
  offset: number;
  limit: number;
  hasMore: boolean;
  nextOffset: number | null;
};
export type GrantRole = "ADMIN" | "SALES" | "SERVICE";
export type Site = {
  id: string;
  organisation_id: string;
  name: string;
  timezone: string;
  roles: GrantRole[];
  permissions: string[];
  brands: { id: string; name: string }[];
  brand_ids?: string[];
};
export type Membership = {
  id: string;
  organisation_id: string;
  site_id: string | null;
  user_id: string;
  role: GrantRole;
  status: "active" | "suspended";
  extra_permissions: string[];
  brand_ids?: string[] | null;
  user?: { fullName: string | null; email: string | null };
};
export type Context = {
  user: { id: string; email?: string };
  sites: Site[];
  memberships: Membership[];
  needsInitialSetup: boolean;
};
export type Consent = "unknown" | "granted" | "denied";
export type Privacy = {
  do_not_contact: boolean;
  email: Consent;
  sms: Consent;
  call: Consent;
};
export const unknownPrivacy: Privacy = {
  do_not_contact: false,
  email: "unknown",
  sms: "unknown",
  call: "unknown",
};
export type Customer = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  assigned_to: string;
  site_id: string;
  source: string;
  integration_mode?: "simulated" | "scraping";
  integration_external_id?: string;
  source_revision?: string;
  updated_at: string;
  privacy?: Privacy;
};
export type Task = {
  id: string;
  customer_id: string;
  assigned_to: string;
  title: string;
  details: string | null;
  due_at: string;
  priority: "low" | "normal" | "high";
  kind?: "follow_up" | "call";
  version?: number;
  completed_at: string | null;
  cancelled_at?: string | null;
  customer?: { id: string; first_name: string; last_name: string };
  bucket?: string;
};
export type Activity = {
  id: string;
  type: string;
  summary: string;
  occurredAt: string;
  recordedAt: string;
  author: { id: string; fullName: string | null };
  taskId?: string;
  repairOrderId?: string;
  messageId?: string;
  commandId?: string;
  journal?: {
    text: string;
    kind: string;
    direction?: string;
    outcome?: string;
  };
};
export type Change = {
  id: string;
  kind: string;
  status: string;
  state: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
};
export type Integration = {
  mode: "disabled" | "simulated" | "scraping";
  simulated: boolean;
  writesEnabled: boolean;
  workerEnabled?: boolean;
  supportedCommands: string[];
};
export type Command = {
  id: string;
  site_id: string;
  customer_id: string;
  kind: string;
  mode: string;
  status: string;
  attempts: number;
  created_at: string;
  actor_user_id: string;
  payload: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    privacy?: Privacy;
  };
  error?: { code: string; message: string };
  result?: unknown;
};
export type Message = {
  id: string;
  created_by: string;
  subject: string;
  body: string;
  channel: "email" | "sms";
  status: string;
  version: number;
  transport?: string;
  to?: string;
  provider_id?: string;
  created_at: string;
  send_started_at?: string;
  repair_order_id?: string | null;
  appointment_id?: string | null;
};
export type Invitation = {
  id: string;
  organisation_id: string;
  site_id: string | null;
  email: string;
  roles: GrantRole[];
  status: string;
  delivery_status: string;
  expires_at: string;
};
export type CustomerVehicle = {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  year: number;
  registration: string;
  vin: string;
  odometer_km?: number | null;
  next_service_date?: string | null;
  open_campaigns?: string[];
  notes?: string | null;
  updated_at: string;
};
export type CustomerRelationship = {
  id: string;
  customer_id: string;
  related_customer_id: string;
  relation_type: string;
  notes?: string | null;
  relatedCustomer?: { id: string; fullName: string; email: string | null; phone: string | null } | null;
  updated_at: string;
};
export type LoanCar = {
  id: string;
  site_id: string;
  brand_id: string;
  make: string;
  model: string;
  year: number;
  registration: string;
  rego: string;
  status: "available" | "allocated" | "maintenance";
  allocated_repair_order_id?: string | null;
  allocated_customer_id?: string | null;
  allocated_ro_id?: string | null;
  allocated_ro_number?: string | null;
  allocated_customer_name?: string | null;
  allocated_at?: string | null;
  notes?: string | null;
};
export type HandoverItem = {
  id: string;
  deal_id: string;
  delivery_plan_id: string;
  customer_id: string;
  stock_id: string;
  vehicle_label: string;
  stock_label: string;
  customer_name: string;
  scheduled_delivery_at: string;
  scheduled_at: string;
  pdi_due_date: string;
  pdi_status: "pending" | "booked" | "in_progress" | "completed";
  pdi_appointment_id?: string | null;
  pdi_technician?: string | null;
  pdi_notes?: string | null;
  accessories_status: "pending" | "in_progress" | "ready" | "parts_ordered" | "fitted";
  accessories_notes?: string | null;
  accessories_items?: string[];
  first_service_status: "not_booked" | "booked";
  first_service_booked: boolean;
  first_service_scheduled_date?: string | null;
  first_service_appointment_id?: string | null;
  customer_service_preference?: {
    mobility_need?: string;
    preferred_channel?: string;
  } | null;
  notes?: string | null;
  status: "active" | "completed" | "cancelled" | "handed_over";
  customer?: { id: string; fullName: string; phone: string | null; email: string | null } | null;
  risks?: { pdiRisk: boolean; firstServiceMissing: boolean; hoursUntilDelivery: number };
};
export const customerName = (
  customer: Pick<Customer, "first_name" | "last_name">,
) => `${customer.first_name} ${customer.last_name}`;
