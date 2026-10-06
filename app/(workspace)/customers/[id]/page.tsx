import { CustomerDetailView } from '@/components/crm-views';
export default async function CustomerPage({ params }: PageProps<'/customers/[id]'>) { const { id } = await params; return <CustomerDetailView id={id}/>; }
