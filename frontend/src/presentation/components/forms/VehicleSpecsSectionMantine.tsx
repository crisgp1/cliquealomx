import { Grid, TextInput, Select, NumberInput, MultiSelect, Title, Card, Stack, Textarea } from '@mantine/core';

interface VehicleSpecsSectionProps {
  formData: Record<string, unknown>;
  handleInputChange: (field: string, value: unknown) => void;
  fuelTypes: Array<{ value: string; label: string }>;
  transmissionTypes: Array<{ value: string; label: string }>;
  bodyTypes: Array<{ value: string; label: string }>;
  commonFeatures: string[];
  errors?: Record<string, string>;
}

export function VehicleSpecsSection({
  formData,
  handleInputChange,
  fuelTypes,
  transmissionTypes,
  bodyTypes,
  commonFeatures,
  errors = {}
}: VehicleSpecsSectionProps) {
  return (
    <Card withBorder>
      <Stack gap="md">
        <Title order={3}>Detalles del Vehículo</Title>

        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <NumberInput
              label="Año"
              placeholder={new Date().getFullYear().toString()}
              min={1990}
              max={new Date().getFullYear() + 1}
              required
              value={(formData.year as number) || new Date().getFullYear()}
              onChange={(value) => handleInputChange('year', value)}
              error={errors.year}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <NumberInput
              label="Precio (MXN)"
              placeholder="285000"
              min={0}
              step={1000}
              thousandSeparator=","
              prefix="$"
              required
              value={(formData.price as number) || undefined}
              onChange={(value) => handleInputChange('price', value)}
              error={errors.price}
            />
          </Grid.Col>
        </Grid>

        <Textarea
          label="Descripción"
          description="Describe las características y condiciones de tu auto"
          placeholder="Excelente estado, un solo dueño, mantenimientos al día..."
          minRows={3}
          value={(formData.description as string) || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          error={errors.description}
        />

        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <NumberInput
              label="Kilometraje"
              placeholder="45000"
              min={0}
              step={1000}
              value={formData.mileage ? Number(formData.mileage) : undefined}
              onChange={(value) => handleInputChange('mileage', value)}
              error={errors.mileage}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Select
              label="Tipo de Combustible"
              placeholder="Selecciona"
              data={fuelTypes}
              value={(formData.fuelType as string) || ''}
              onChange={(value) => handleInputChange('fuelType', value)}
              error={errors.fuelType}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Select
              label="Transmisión"
              placeholder="Selecciona"
              data={transmissionTypes}
              value={(formData.transmission as string) || ''}
              onChange={(value) => handleInputChange('transmission', value)}
              error={errors.transmission}
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Select
              label="Tipo de Carrocería"
              placeholder="Selecciona"
              data={bodyTypes}
              value={(formData.bodyType as string) || ''}
              onChange={(value) => handleInputChange('bodyType', value)}
              error={errors.bodyType}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Color"
              placeholder="Ejemplo: Blanco, Negro, Plata"
              value={(formData.color as string) || ''}
              onChange={(e) => handleInputChange('color', e.target.value)}
              error={errors.color}
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Número de Serie (VIN)"
              description="Opcional - Para mayor confianza"
              placeholder="1HGBH41JXMN109186"
              value={(formData.serialNumber as string) || ''}
              onChange={(e) => handleInputChange('serialNumber', e.target.value)}
              error={errors.serialNumber}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Número de Motor"
              description="Opcional"
              placeholder="K20A3"
              value={(formData.motorNumber as string) || ''}
              onChange={(e) => handleInputChange('motorNumber', e.target.value)}
              error={errors.motorNumber}
            />
          </Grid.Col>
        </Grid>

        <MultiSelect
          label="Características y Equipamiento"
          description="Selecciona todas las características que apliquen"
          placeholder="Buscar características..."
          data={commonFeatures}
          searchable
          value={(formData.features as string[]) || []}
          onChange={(value) => handleInputChange('features', value)}
          error={errors.features}
        />
      </Stack>
    </Card>
  );
}