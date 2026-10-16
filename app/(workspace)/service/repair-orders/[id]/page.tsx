import { LiveRepairOrderDetail } from "@/components/live-repair-orders";
export default async function RepairOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LiveRepairOrderDetail key={id} id={id} />;
}
