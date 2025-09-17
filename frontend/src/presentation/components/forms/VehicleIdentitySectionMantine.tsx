import { Grid, TextInput, Title, Group, Card, Stack } from '@mantine/core';
import { IconCar } from '@tabler/icons-react';
import { BrandSelector } from './BrandSelector';

interface VehicleIdentitySectionProps {
  formData: Record<string, unknown>;
  handleInputChange: (field: string, value: unknown) => void;
  carBrands?: Array<{ value: string; label: string }>;
  errors?: Record<string, string>;
}

export function VehicleIdentitySection({
  formData,
  handleInputChange,
  errors = {}
}: VehicleIdentitySectionProps) {
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
          value={(formData.title as string) || ''}
          onChange={(e) => handleInputChange('title', e.target.value)}
          error={errors.title}
        />

        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <BrandSelector
              label="Marca del Vehículo"
              placeholder="Busca la marca (auto, moto, comercial)..."
              required
              value={(formData.brand as string) || ''}
              onChange={(value) => handleInputChange('brand', value)}
              onCustomBrandChange={(customBrand) => handleInputChange('customBrand', customBrand)}
              customBrand={(formData.customBrand as string) || ''}
              error={errors.brand}
              description="Incluye autos, motos, vehículos comerciales y marcas premium"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Modelo"
              placeholder="Ejemplo: Civic, Corolla, Sentra, CBR600"
              required
              value={(formData.model as string) || ''}
              onChange={(e) => handleInputChange('model', e.target.value)}
              error={errors.model}
              description="Modelo específico del vehículo"
            />
          </Grid.Col>
        </Grid>
      </Stack>
    </Card>
  );
}