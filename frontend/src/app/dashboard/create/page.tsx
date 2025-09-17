import { DashboardShell } from '@/presentation/components/dashboard/DashboardShell';
import { StepperCreateForm } from '@/presentation/components/dashboard/StepperCreateForm';

export default function CreateListingPage() {
  return (
    <DashboardShell>
      <StepperCreateForm />
    </DashboardShell>
  );
}