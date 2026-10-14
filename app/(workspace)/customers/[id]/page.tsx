import { LiveCustomerDetail } from "@/components/live-customer-detail";
export default async function CustomerPage({
  params,
}: PageProps<"/customers/[id]">) {
  const { id } = await params;
  return <LiveCustomerDetail key={id} id={id} />;
}
