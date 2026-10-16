import { LiveRepairOrders } from "@/components/live-repair-orders";
export default async function RepairOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ appointmentId?: string }>;
}) {
  const { appointmentId } = await searchParams;
  return (
    <LiveRepairOrders
      key={appointmentId ?? "all"}
      appointmentId={appointmentId}
    />
  );
}
