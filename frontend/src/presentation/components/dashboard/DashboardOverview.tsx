'use client';

import {
  Title,
  Text,
  Card,
  Grid,
  Group,
  Stack,
  Button,
  Paper,
  Badge,
  Progress,
  Container,
  SimpleGrid,
  ThemeIcon,
  List,
  Alert,
} from '@mantine/core';
import {
  IconCar,
  IconEye,
  IconHeart,
  IconCurrencyDollar,
  IconTrendingUp,
  IconPlus,
  IconChartLine,
  IconUsers,
  IconMessageCircle,
  IconInfoCircle,
} from '@tabler/icons-react';

export function DashboardOverview() {
  // Mock data - En producción esto vendría de tu API
  const stats = {
    totalListings: 5,
    activeListings: 3,
    soldListings: 2,
    totalViews: 2847,
    totalLikes: 89,
    messagesThisMonth: 24,
  };

  const recentActivity = [
    {
      id: 1,
      type: 'view',
      message: 'Tu Honda Civic 2020 recibió 15 nuevas visualizaciones',
      time: 'Hace 2 horas',
    },
    {
      id: 2,
      type: 'like',
      message: '3 personas marcaron como favorito tu Toyota RAV4',
      time: 'Hace 4 horas',
    },
    {
      id: 3,
      type: 'message',
      message: 'Nuevo mensaje sobre tu Nissan Sentra 2019',
      time: 'Hace 1 día',
    },
  ];

  const tips = [
    'Sube fotos de alta calidad desde diferentes ángulos',
    'Incluye el historial de mantenimiento en la descripción',
    'Responde rápidamente a los mensajes de los interesados',
    'Mantén el precio competitivo comparando con autos similares',
  ];

  return (
    <Container size="xl">
      <Stack gap="xl">
        {/* Welcome Header */}
        <div>
          <Title order={1} size="h2" mb="xs">
            ¡Bienvenido a tu Dashboard!
          </Title>
          <Text size="lg" c="dimmed">
            Aquí puedes gestionar tus anuncios y ver el rendimiento de tus publicaciones
          </Text>
        </div>

        {/* Main Stats */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          <Card withBorder p="lg" radius="md">
            <Group gap="sm">
              <ThemeIcon size="xl" color="blue" variant="light" radius="md">
                <IconCar size="1.8rem" />
              </ThemeIcon>
              <div>
                <Text size="xl" fw={700} lh={1}>
                  {stats.totalListings}
                </Text>
                <Text size="sm" c="dimmed" lh={1}>
                  Anuncios Totales
                </Text>
              </div>
            </Group>
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group gap="sm">
              <ThemeIcon size="xl" color="green" variant="light" radius="md">
                <IconEye size="1.8rem" />
              </ThemeIcon>
              <div>
                <Text size="xl" fw={700} lh={1}>
                  {stats.totalViews.toLocaleString()}
                </Text>
                <Text size="sm" c="dimmed" lh={1}>
                  Visualizaciones
                </Text>
              </div>
            </Group>
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group gap="sm">
              <ThemeIcon size="xl" color="red" variant="light" radius="md">
                <IconHeart size="1.8rem" />
              </ThemeIcon>
              <div>
                <Text size="xl" fw={700} lh={1}>
                  {stats.totalLikes}
                </Text>
                <Text size="sm" c="dimmed" lh={1}>
                  Me Gusta
                </Text>
              </div>
            </Group>
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group gap="sm">
              <ThemeIcon size="xl" color="orange" variant="light" radius="md">
                <IconMessageCircle size="1.8rem" />
              </ThemeIcon>
              <div>
                <Text size="xl" fw={700} lh={1}>
                  {stats.messagesThisMonth}
                </Text>
                <Text size="sm" c="dimmed" lh={1}>
                  Mensajes este mes
                </Text>
              </div>
            </Group>
          </Card>
        </SimpleGrid>

        {/* Performance Overview */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Card withBorder p="lg" radius="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <Title order={3}>Estado de tus Anuncios</Title>
                  <Button variant="light" leftSection={<IconPlus size={16} />} component="a" href="/dashboard/create">
                    Crear Anuncio
                  </Button>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                  <div>
                    <Group gap="xs" mb="xs">
                      <Badge color="green" variant="light">Activos</Badge>
                      <Text fw={600}>{stats.activeListings}</Text>
                    </Group>
                    <Progress value={(stats.activeListings / stats.totalListings) * 100} color="green" />
                  </div>
                  
                  <div>
                    <Group gap="xs" mb="xs">
                      <Badge color="blue" variant="light">Vendidos</Badge>
                      <Text fw={600}>{stats.soldListings}</Text>
                    </Group>
                    <Progress value={(stats.soldListings / stats.totalListings) * 100} color="blue" />
                  </div>
                  
                  <div>
                    <Group gap="xs" mb="xs">
                      <Badge color="gray" variant="light">Inactivos</Badge>
                      <Text fw={600}>{stats.totalListings - stats.activeListings - stats.soldListings}</Text>
                    </Group>
                    <Progress value={((stats.totalListings - stats.activeListings - stats.soldListings) / stats.totalListings) * 100} color="gray" />
                  </div>
                </SimpleGrid>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder p="lg" radius="md" h="100%">
              <Stack gap="md" h="100%">
                <Title order={3}>Acciones Rápidas</Title>
                <Stack gap="sm" style={{ flex: 1 }}>
                  <Button fullWidth leftSection={<IconPlus size={16} />} component="a" href="/dashboard/create">
                    Crear Anuncio
                  </Button>
                  <Button fullWidth variant="light" leftSection={<IconCar size={16} />} component="a" href="/dashboard/listings">
                    Ver Mis Anuncios
                  </Button>
                  <Button fullWidth variant="light" leftSection={<IconChartLine size={16} />} component="a" href="/dashboard/analytics">
                    Ver Estadísticas
                  </Button>
                  <Button fullWidth variant="light" leftSection={<IconUsers size={16} />} component="a" href="/dashboard/buyers">
                    Gestionar Contactos
                  </Button>
                </Stack>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Recent Activity & Tips */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card withBorder p="lg" radius="md" h="100%">
              <Stack gap="md">
                <Title order={3}>Actividad Reciente</Title>
                <Stack gap="sm">
                  {recentActivity.map((activity) => (
                    <Paper key={activity.id} p="sm" withBorder radius="sm">
                      <Text size="sm" mb="xs">
                        {activity.message}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {activity.time}
                      </Text>
                    </Paper>
                  ))}
                </Stack>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card withBorder p="lg" radius="md" h="100%">
              <Stack gap="md">
                <Group gap="xs">
                  <IconInfoCircle size={20} color="var(--mantine-color-blue-6)" />
                  <Title order={3}>Tips para Vender Mejor</Title>
                </Group>
                <List spacing="sm" size="sm" withPadding>
                  {tips.map((tip, index) => (
                    <List.Item key={index}>{tip}</List.Item>
                  ))}
                </List>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Call to Action */}
        {stats.totalListings === 0 && (
          <Alert icon={<IconInfoCircle size="1rem" />} title="¡Comienza a vender!" color="blue" variant="light">
            <Text mb="sm">
              Aún no has creado ningún anuncio. ¡Es momento de publicar tu primer auto y comenzar a generar ingresos!
            </Text>
            <Button leftSection={<IconPlus size={16} />} component="a" href="/dashboard/create">
              Crear Mi Primer Anuncio
            </Button>
          </Alert>
        )}
      </Stack>
    </Container>
  );
}