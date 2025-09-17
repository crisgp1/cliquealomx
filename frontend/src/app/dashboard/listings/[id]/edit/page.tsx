import { DashboardShell } from '@/presentation/components/dashboard/DashboardShell';
import { StepperEditForm } from '@/presentation/components/dashboard/StepperEditForm';

interface EditListingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params;

  return (
    <DashboardShell>
      <StepperEditForm listingId={id} />
    </DashboardShell>
  );
}