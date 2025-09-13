'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  SimpleGrid,
  Card,
  Image,
  Text,
  Title,
  Badge,
  Group,
  Stack,
  Button,
  Center,
  Loader,
  Alert,
} from '@mantine/core';
import { IconCar, IconMapPin, IconCalendar, IconGauge, IconAlertCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { Listing } from '@/lib/api/listings';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatMileage(mileage: number): string {
  return new Intl.NumberFormat('es-MX').format(mileage) + ' km';
}

export function ListingsCatalog() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/listings`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Error al cargar los anuncios');
        }

        const data = await response.json();
        setListings(data);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const handleViewListing = (id: string) => {
    router.push(`/listings/${id}`);
  };

  if (loading) {
    return (
      <Container size="xl" py={{ base: 60, md: 80 }}>
        <Center>
          <Stack align="center" gap="md">
            <Loader size="xl" />
            <Text c="dimmed">Cargando anuncios...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" py={{ base: 60, md: 80 }}>
        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
          <Text fw={500}>Error al cargar los anuncios</Text>
          <Text size="sm" mt={4}>{error}</Text>
        </Alert>
      </Container>
    );
  }

  if (listings.length === 0) {
    return (
      <Container size="xl" py={{ base: 60, md: 80 }}>
        <Stack gap="xl" align="center">
          <Title order={2} size="h2" ta="center" fw={600}>
            Catálogo vacío
          </Title>
          
          <Card
            p={{ base: 40, md: 60 }}
            radius="lg"
            shadow="sm"
            withBorder
            style={{
              backgroundColor: 'var(--mantine-color-gray-0)',
              border: '2px dashed var(--mantine-color-gray-3)',
              maxWidth: 500,
            }}
          >
            <Stack align="center" gap="lg">
              <IconCar size={60} color="var(--mantine-color-gray-5)" />
              <Stack align="center" gap="xs">
                <Title order={3} size="h4" ta="center" c="dimmed">
                  Aún no hay autos disponibles
                </Title>
                <Text size="sm" c="dimmed" ta="center" maw={300}>
                  Pronto tendremos una gran selección de autos usados para ti
                </Text>
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py={{ base: 60, md: 80 }}>
      <Stack gap="xl">
        <Group justify="space-between" align="flex-end">
          <Stack gap="xs">
            <Title order={2} size="h2" fw={600}>
              Autos Disponibles
            </Title>
            <Text c="dimmed" size="lg">
              Encuentra el auto perfecto para ti
            </Text>
          </Stack>
          
          <Badge size="lg" variant="light" color="cliquealow-green">
            {listings.length} {listings.length === 1 ? 'auto' : 'autos'}
          </Badge>
        </Group>

        <SimpleGrid
          cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}
          spacing={{ base: 'md', sm: 'lg' }}
        >
          {listings.map((listing) => (
            <Card
              key={listing.id}
              shadow="sm"
              padding="md"
              radius="md"
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={() => handleViewListing(listing.id)}
            >
              <Card.Section>
                <Image
                  src={listing.images?.[0] || '/placeholder-car.jpg'}
                  height={200}
                  alt={listing.title}
                  fit="cover"
                />
              </Card.Section>

              <Stack gap="sm" mt="md">
                <Group justify="space-between" align="flex-start">
                  <Stack gap={4}>
                    <Text fw={600} size="lg" lineClamp={1}>
                      {listing.title}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {listing.brand} {listing.model} {listing.year}
                    </Text>
                  </Stack>
                  
                  {listing.isFeatured && (
                    <Badge color="yellow" size="sm">
                      Destacado
                    </Badge>
                  )}
                </Group>

                <Text fw={700} size="xl" c="cliquealow-green">
                  {formatPrice(listing.price)}
                </Text>

                <Group gap="xs" wrap="wrap">
                  <Group gap={4}>
                    <IconCalendar size={14} color="var(--mantine-color-dimmed)" />
                    <Text size="xs" c="dimmed">{listing.year}</Text>
                  </Group>
                  
                  <Group gap={4}>
                    <IconGauge size={14} color="var(--mantine-color-dimmed)" />
                    <Text size="xs" c="dimmed">{listing.mileage ? formatMileage(listing.mileage) : 'No especificado'}</Text>
                  </Group>
                  
                  <Group gap={4}>
                    <IconMapPin size={14} color="var(--mantine-color-dimmed)" />
                    <Text size="xs" c="dimmed">{listing.location?.city || 'No especificado'}</Text>
                  </Group>
                </Group>

                <Button
                  variant="light"
                  size="sm"
                  radius="md"
                  fullWidth
                  mt="sm"
                >
                  Ver detalles
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}