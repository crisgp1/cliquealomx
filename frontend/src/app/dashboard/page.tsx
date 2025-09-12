import { DashboardShell } from '@/presentation/components/dashboard/DashboardShell';
import { DashboardOverview } from '@/presentation/components/dashboard/DashboardOverview';

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardOverview />
    </DashboardShell>
  );
}