import { Grid, TextInput, Select, Title, Group, Card, Stack } from '@mantine/core';
import { IconCar } from '@tabler/icons-react';
import { UseFormReturnType } from '@mantine/form';

interface VehicleIdentitySectionProps {
  form: UseFormReturnType<Record<string, unknown>>;
  carBrands: Array<{ value: string; label: string }>;
}

export function VehicleIdentitySection({ form, carBrands }: VehicleIdentitySectionProps) {
  return (
    <Card withBorder>
      <Stack gap="md">
        <Group gap="xs">
          <IconCar size={20} />
          <Title order={3}>Información Básica</Title>
        </Group>

        <TextInput
          label="Título del Anuncio"
          description="Ejemplo: Honda Civic 2020 Seminuevo"
          placeholder="Escribe un título atractivo para tu auto"
          required
          key={form.key('title')}
          {...form.getInputProps('title')}
        />

        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Select
              label="Marca"
              placeholder="Selecciona la marca"
              data={carBrands}
              searchable
              required
              key={form.key('brand')}
              {...form.getInputProps('brand')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Modelo"
              placeholder="Ejemplo: Civic, Corolla, Sentra"
              required
              key={form.key('model')}
              {...form.getInputProps('model')}
            />
          </Grid.Col>
        </Grid>
      </Stack>
    </Card>
  );
}