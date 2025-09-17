import { Grid, TextInput, Select, Title, Group, Card, Stack, Switch } from '@mantine/core';
import { IconMapPin, IconPhone, IconMail, IconBrandWhatsapp, IconFileText } from '@tabler/icons-react';

interface ContactLocationSectionProps {
  formData: Record<string, unknown>;
  handleInputChange: (field: string, value: unknown) => void;
  mexicanStates: Array<{ value: string; label: string }>;
  errors?: Record<string, string>;
}

export function ContactLocationSection({
  formData,
  handleInputChange,
  mexicanStates,
  errors = {}
}: ContactLocationSectionProps) {
  return (
    <>
      <Card withBorder>
        <Stack gap="md">
          <Group gap="xs">
            <IconMapPin size={20} />
            <Title order={3}>Ubicación y Contacto</Title>
          </Group>

          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Ciudad"
                placeholder="Guadalajara"
                required
                value={(formData.city as string) || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                error={errors.city}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Estado"
                placeholder="Selecciona tu estado"
                data={mexicanStates}
                searchable
                required
                value={(formData.state as string) || ''}
                onChange={(value) => handleInputChange('state', value)}
                error={errors.state}
              />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput
                label="Teléfono"
                description="Número principal"
                placeholder="+52 33 1234 5678"
                leftSection={<IconPhone size={16} />}
                required
                value={(formData.phone as string) || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                error={errors.phone}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput
                label="WhatsApp"
                description="Opcional"
                placeholder="+52 33 1234 5678"
                leftSection={<IconBrandWhatsapp size={16} />}
                value={(formData.whatsapp as string) || ''}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                error={errors.whatsapp}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput
                label="Email"
                description="Opcional"
                placeholder="contacto@email.com"
                leftSection={<IconMail size={16} />}
                value={(formData.email as string) || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={errors.email}
              />
            </Grid.Col>
          </Grid>
        </Stack>
      </Card>

      <Card withBorder>
        <Stack gap="md">
          <Group gap="xs">
            <IconFileText size={20} />
            <Title order={3}>Opciones Adicionales</Title>
          </Group>

          <Switch
            label="Anuncio Destacado"
            description="Tu anuncio aparecerá en las primeras posiciones (costo adicional)"
            checked={(formData.isFeatured as boolean) || false}
            onChange={(event) => handleInputChange('isFeatured', event.currentTarget.checked)}
          />
        </Stack>
      </Card>
    </>
  );
}