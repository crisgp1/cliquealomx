import { Grid, TextInput, Select, Title, Group, Card, Stack, Switch } from '@mantine/core';
import { IconMapPin, IconPhone, IconMail, IconBrandWhatsapp, IconFileText } from '@tabler/icons-react';
import { UseFormReturnType } from '@mantine/form';

interface ContactLocationSectionProps {
  form: UseFormReturnType<Record<string, unknown>>;
  mexicanStates: Array<{ value: string; label: string }>;
}

export function ContactLocationSection({ form, mexicanStates }: ContactLocationSectionProps) {
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
                {...form.getInputProps('city')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Estado"
                placeholder="Selecciona tu estado"
                data={mexicanStates}
                searchable
                required
                {...form.getInputProps('state')}
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
                {...form.getInputProps('phone')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput
                label="WhatsApp"
                description="Opcional"
                placeholder="+52 33 1234 5678"
                leftSection={<IconBrandWhatsapp size={16} />}
                {...form.getInputProps('whatsapp')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput
                label="Email"
                description="Opcional"
                placeholder="contacto@email.com"
                leftSection={<IconMail size={16} />}
                {...form.getInputProps('email')}
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
            {...form.getInputProps('isFeatured', { type: 'checkbox' })}
          />
        </Stack>
      </Card>
    </>
  );
}