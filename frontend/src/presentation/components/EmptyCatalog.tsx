'use client';

import {
  Box,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  ThemeIcon,
} from '@mantine/core';
import { IconCar, IconSearch } from '@tabler/icons-react';

export function EmptyCatalog() {
  return (
    <Container size="xl" py={{ base: 60, md: 80 }}>
      <Stack gap="xl" align="center">
        <Title
          order={2}
          size={{ base: 'h2', md: 'h1' }}
          ta="center"
          fw={600}
        >
          Catálogo vacío
        </Title>

        <Paper
          p={{ base: 40, md: 60 }}
          radius="lg"
          shadow="sm"
          withBorder
          style={{
            backgroundColor: 'var(--mantine-color-gray-0)',
            border: '2px dashed var(--mantine-color-gray-3)',
            maxWidth: 500,
            width: '100%',
          }}
        >
          <Stack align="center" gap="lg">
            <ThemeIcon
              size={80}
              radius="xl"
              variant="light"
              color="gray"
            >
              <IconCar size={40} stroke={1.5} />
            </ThemeIcon>

            <Stack align="center" gap="xs">
              <Title order={3} size="h4" ta="center" c="dimmed">
                Aún no hay autos disponibles
              </Title>
              
              <Text
                size="sm"
                c="dimmed"
                ta="center"
                maw={300}
              >
                Pronto tendremos una gran selección de autos usados para ti
              </Text>
            </Stack>

            <Group gap="xs" c="dimmed">
              <IconSearch size={16} />
              <Text size="xs" c="dimmed">
                Mantente atento para las próximas actualizaciones
              </Text>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}