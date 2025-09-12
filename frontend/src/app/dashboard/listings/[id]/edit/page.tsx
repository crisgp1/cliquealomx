import { DashboardShell } from '@/presentation/components/dashboard/DashboardShell';
import { EditListingForm } from '@/presentation/components/dashboard/EditListingForm';
import { Container, Title, Text, Card } from '@mantine/core';

interface EditListingPageProps {
  params: {
    id: string;
  };
}

export default function EditListingPage({ params }: EditListingPageProps) {
  return (
    <DashboardShell>
      <Container size="xl">
        <Card withBorder>
          <Title order={1} size="h2" mb="xs">
            Editar Anuncio
          </Title>
          <Text size="lg" c="dimmed" mb="xl">
            Modifica los detalles de tu anuncio
          </Text>
          <EditListingForm listingId={params.id} />
        </Card>
      </Container>
    </DashboardShell>
  );
}