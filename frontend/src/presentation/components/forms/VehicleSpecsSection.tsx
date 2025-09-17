import { Grid, TextInput, Select, NumberInput, MultiSelect, Title, Card, Stack, Textarea } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';

interface VehicleSpecsSectionProps {
  form: UseFormReturnType<Record<string, unknown>>;
  fuelTypes: Array<{ value: string; label: string }>;
  transmissionTypes: Array<{ value: string; label: string }>;
  bodyTypes: Array<{ value: string; label: string }>;
  commonFeatures: string[];
}

export function VehicleSpecsSection({
  form,
  fuelTypes,
  transmissionTypes,
  bodyTypes,
  commonFeatures,
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
              {...form.getInputProps('year')}
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
              {...form.getInputProps('price')}
            />
          </Grid.Col>
        </Grid>

        <Textarea
          label="Descripción"
          description="Describe las características y condiciones de tu auto"
          placeholder="Excelente estado, un solo dueño, mantenimientos al día..."
          minRows={3}
          {...form.getInputProps('description')}
        />

        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <NumberInput
              label="Kilometraje"
              placeholder="45000"
              min={0}
              step={1000}
              {...form.getInputProps('mileage')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Select
              label="Tipo de Combustible"
              placeholder="Selecciona"
              data={fuelTypes}
              {...form.getInputProps('fuelType')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Select
              label="Transmisión"
              placeholder="Selecciona"
              data={transmissionTypes}
              {...form.getInputProps('transmission')}
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Select
              label="Tipo de Carrocería"
              placeholder="Selecciona"
              data={bodyTypes}
              {...form.getInputProps('bodyType')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Color"
              placeholder="Ejemplo: Blanco, Negro, Plata"
              {...form.getInputProps('color')}
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Número de Serie (VIN)"
              description="Opcional - Para mayor confianza"
              placeholder="1HGBH41JXMN109186"
              {...form.getInputProps('serialNumber')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Número de Motor"
              description="Opcional"
              placeholder="K20A3"
              {...form.getInputProps('motorNumber')}
            />
          </Grid.Col>
        </Grid>

        <MultiSelect
          label="Características y Equipamiento"
          description="Selecciona todas las características que apliquen"
          placeholder="Buscar características..."
          data={commonFeatures}
          searchable
          {...form.getInputProps('features')}
        />
      </Stack>
    </Card>
  );
}