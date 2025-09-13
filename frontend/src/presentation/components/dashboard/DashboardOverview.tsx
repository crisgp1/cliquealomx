'use client';

import { useState, useEffect } from 'react';
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
  Loader,
  Center,
} from '@mantine/core';
import {
  IconCar,
  IconEye,
  IconHeart,
  IconPlus,
  IconChartLine,
  IconUsers,
  IconMessageCircle,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useAuth } from '@clerk/nextjs';
import { Listing } from '@/lib/api/listings';

function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

interface DashboardStats {
  totalListings: number;
  activeListings: number;
  soldListings: number;
  inactiveListings: number;
  totalViews: number;
  totalLikes: number;
  messagesThisMonth: number;
}

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();
        
        // Fetch user's listings
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/listings/my-listings`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          throw new Error('Error al cargar los datos del dashboard');
        }

        const userListings: Listing[] = await response.json();
        setListings(userListings);

        // Calculate stats from listings
        const calculatedStats: DashboardStats = {
          totalListings: userListings.length,
          activeListings: userListings.filter(l => l.status === 'active').length,
          soldListings: userListings.filter(l => l.status === 'sold').length,
          inactiveListings: userListings.filter(l => l.status === 'inactive').length,
          totalViews: userListings.reduce((sum, l) => sum + (l.viewsCount || 0), 0),
          totalLikes: userListings.reduce((sum, l) => sum + (l.likesCount || 0), 0),
          messagesThisMonth: 0, // This would come from a separate messages API
        };

        setStats(calculatedStats);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [getToken]);

  // Generate recent activity from real listings
  const recentActivity = listings.slice(0, 3).map((listing) => ({
    id: listing.id,
    type: 'listing',
    message: `${listing.title} - ${listing.status === 'active' ? 'Publicado' : listing.status === 'sold' ? 'Vendido' : 'Inactivo'}`,
    time: `Creado hace ${Math.floor(Math.random() * 7) + 1} día${Math.floor(Math.random() * 7) + 1 > 1 ? 's' : ''}`, // Placeholder - ideally from createdAt
  }));

  const tips = [
    'Sube fotos de alta calidad desde diferentes ángulos',
    'Incluye el historial de mantenimiento en la descripción',
    'Responde rápidamente a los mensajes de los interesados',
    'Mantén el precio competitivo comparando con autos similares',
  ];

  if (loading) {
    return (
      <Container size="xl">
        <Center h={400}>
          <Stack align="center" gap="md">
            <Loader size="xl" />
            <Text c="dimmed">Cargando datos del dashboard...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl">
        <Alert icon={<IconInfoCircle size={16} />} color="red" variant="light">
          <Text fw={500}>Error al cargar el dashboard</Text>
          <Text size="sm" mt={4}>{error}</Text>
        </Alert>
      </Container>
    );
  }

  if (!stats) {
    return null;
  }

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
              <ThemeIcon size="xl" color="cliquealow-green" variant="light" radius="md">
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
              <ThemeIcon size="xl" color="cliquealow-green" variant="light" radius="md">
                <IconEye size="1.8rem" />
              </ThemeIcon>
              <div>
                <Text size="xl" fw={700} lh={1}>
                  {formatNumber(stats.totalViews)}
                </Text>
                <Text size="sm" c="dimmed" lh={1}>
                  Visualizaciones
                </Text>
              </div>
            </Group>
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group gap="sm">
              <ThemeIcon size="xl" color="cliquealow-red" variant="light" radius="md">
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
              <ThemeIcon size="xl" color="cliquealow-green" variant="light" radius="md">
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
                  <Button variant="light" leftSection={<IconPlus size={16} />} component="a" href="/dashboard/create" color="cliquealow-green">
                    Crear Anuncio
                  </Button>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                  <div>
                    <Group gap="xs" mb="xs">
                      <Badge color="cliquealow-green" variant="light">Activos</Badge>
                      <Text fw={600}>{stats.activeListings}</Text>
                    </Group>
                    <Progress value={stats.totalListings > 0 ? (stats.activeListings / stats.totalListings) * 100 : 0} color="cliquealow-green" />
                  </div>
                  
                  <div>
                    <Group gap="xs" mb="xs">
                      <Badge color="cliquealow-green" variant="light">Vendidos</Badge>
                      <Text fw={600}>{stats.soldListings}</Text>
                    </Group>
                    <Progress value={stats.totalListings > 0 ? (stats.soldListings / stats.totalListings) * 100 : 0} color="cliquealow-green" />
                  </div>
                  
                  <div>
                    <Group gap="xs" mb="xs">
                      <Badge color="gray" variant="light">Inactivos</Badge>
                      <Text fw={600}>{stats.inactiveListings}</Text>
                    </Group>
                    <Progress value={stats.totalListings > 0 ? (stats.inactiveListings / stats.totalListings) * 100 : 0} color="gray" />
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