import { DashboardShell } from '@/presentation/components/dashboard/DashboardShell';
import { HeroContentManager } from '@/presentation/components/dashboard/HeroContentManager';

export default function HeroContentPage() {
  return (
    <DashboardShell>
      <HeroContentManager />
    </DashboardShell>
  );
}