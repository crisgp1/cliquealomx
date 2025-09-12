import { DashboardShell } from '@/presentation/components/dashboard/DashboardShell';
import { CreateListingForm } from '@/presentation/components/dashboard/CreateListingForm';
import { Container, Title, Text, Card } from '@mantine/core';

export default function CreateListingPage() {
  return (
    <DashboardShell>
      <Container size="xl">
        <Card withBorder>
          <Title order={1} size="h2" mb="xs">
            Crear Nuevo Anuncio
          </Title>
          <Text size="lg" c="dimmed" mb="xl">
            Publica tu auto y conecta con miles de compradores potenciales
          </Text>
          <CreateListingForm />
        </Card>
      </Container>
    </DashboardShell>
  );
}