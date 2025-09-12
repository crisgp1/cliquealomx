import { DashboardShell } from '@/presentation/components/dashboard/DashboardShell';
import { ListingsSection } from '@/presentation/components/dashboard/ListingsSection';

export default function ListingsPage() {
  return (
    <DashboardShell>
      <ListingsSection />
    </DashboardShell>
  );
}