'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Title,
  Text,
  Image,
  Grid,
  Badge,
  Group,
  Stack,
  Card,
  Divider,
  Button,
  List,
  Skeleton,
  Center,
  Alert,
  SimpleGrid,
} from '@mantine/core';
import { Carousel } from '@mantine/carousel';
import {
  IconCar,
  IconMapPin,
  IconPhone,
  IconBrandWhatsapp,
  IconMail,
  IconEye,
  IconHeart,
  IconGasStation,
  IconManualGearbox,
  IconGauge,
  IconCalendar,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useListingsApi } from '@/hooks/useListingsApi';
import { Listing } from '@/lib/api/listings';

interface ListingDetailPageProps {
  listingId: string;
}

export function ListingDetailPage({ listingId }: ListingDetailPageProps) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const listingsApi = useListingsApi();

  const loadListing = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listingsApi.getListing(listingId);
      setListing(data);
    } catch (err) {
      console.error('Error loading listing:', err);
      setError('No se pudo cargar el anuncio');
    } finally {
      setLoading(false);
    }
  }, [listingsApi, listingId]);

  useEffect(() => {
    loadListing();
  }, [loadListing]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(dateObj);
    } catch {
      return 'Fecha no disponible';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'sold': return 'blue';
      case 'reserved': return 'orange';
      case 'inactive': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Disponible';
      case 'sold': return 'Vendido';
      case 'reserved': return 'Reservado';
      case 'inactive': return 'No disponible';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="md">
              <Skeleton height={400} />
              <Skeleton height={40} />
              <Skeleton height={20} width="60%" />
              <Skeleton height={100} />
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md">
              <Skeleton height={200} />
              <Skeleton height={150} />
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    );
  }

  if (error || !listing) {
    return (
      <Container size="xl" py="xl">
        <Center h={300}>
          <Alert 
            icon={<IconAlertCircle size="1.1rem" />} 
            title="Error al cargar anuncio" 
            color="red"
            variant="light"
          >
            {error || 'El anuncio no existe o no está disponible.'}
            <Button 
              variant="light" 
              size="sm" 
              mt="sm" 
              onClick={() => window.history.back()}
            >
              Volver
            </Button>
          </Alert>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Grid gutter="xl">
        {/* Main Content */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="lg">
            {/* Images Carousel */}
            <Card withBorder radius="md" p={0}>
              <Carousel
                withIndicators
                height={400}
                slideSize="100%"
                emblaOptions={{ 
                  loop: listing.images && listing.images.length > 1,
                  align: 'center'
                }}
                previousControlProps={{ 'aria-label': 'Imagen anterior' }}
                nextControlProps={{ 'aria-label': 'Siguiente imagen' }}
                controlsOffset="xs"
                controlSize={36}
                styles={{
                  control: {
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    border: 'none',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    },
                  },
                  indicator: {
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    '&[data-active]': {
                      backgroundColor: 'white',
                    },
                  },
                  slide: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8f9fa',
                  },
                }}
              >
                {listing.images && listing.images.length > 0 ? (
                  listing.images.map((image, index) => (
                    <Carousel.Slide key={index}>
                      <Image
                        src={image}
                        alt={`${listing.title} - Imagen ${index + 1}`}
                        fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDgwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0zNTAgMjAwSDQ1MFYxNTBIMzUwVjIwMFpNMzAwIDI1MEg0MDBWMJAWSDNJMEY1MEgiIGZpbGw9IiNEMEQwRDAiLz4KPC9zdmc+"
                        fit="contain"
                        style={{ 
                          maxHeight: '100%',
                          maxWidth: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </Carousel.Slide>
                  ))
                ) : (
                  <Carousel.Slide>
                    <Image
                      src="/api/placeholder/800/400"
                      alt={listing.title}
                      fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDgwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0zNTAgMjAwSDQ1MFYxNTBIMzUwVjIwMFpNMzAwIDI1MEg0MDBWMJAWSDNJMEY1MEgiIGZpbGw9IiNEMEQwRDAiLz4KPC9zdmc+"
                      fit="contain"
                      style={{ 
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  </Carousel.Slide>
                )}
              </Carousel>
              <Group justify="space-between" p="md">
                <Badge color={getStatusColor(listing.status)} size="lg">
                  {getStatusLabel(listing.status)}
                </Badge>
                <Group gap="sm">
                  <Group gap={4}>
                    <IconEye size={16} />
                    <Text size="sm">{listing.viewsCount || 0}</Text>
                  </Group>
                  <Group gap={4}>
                    <IconHeart size={16} />
                    <Text size="sm">{listing.likesCount || 0}</Text>
                  </Group>
                </Group>
              </Group>
            </Card>

            {/* Title and Basic Info */}
            <Stack gap="sm">
              <Title order={1} size="h2">
                {listing.title}
              </Title>
              <Group gap="md">
                <Text size="lg" c="dimmed">
                  {listing.brand} {listing.model} {listing.year}
                </Text>
                {listing.location && (
                  <Group gap={4}>
                    <IconMapPin size={16} />
                    <Text size="sm" c="dimmed">
                      {listing.location.city}, {listing.location.state}
                    </Text>
                  </Group>
                )}
              </Group>
              <Text size="2xl" fw={700} c="green.7">
                {formatPrice(listing.price)}
              </Text>
            </Stack>

            <Divider />

            {/* Vehicle Details */}
            <Card withBorder p="lg">
              <Title order={3} mb="md">Detalles del Vehículo</Title>
              <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
                {listing.mileage && (
                  <Group gap="xs">
                    <IconGauge size={20} color="var(--mantine-color-cliquealow-green-6)" />
                    <div>
                      <Text size="sm" fw={500}>Kilometraje</Text>
                      <Text size="xs" c="dimmed">{listing.mileage.toLocaleString()} km</Text>
                    </div>
                  </Group>
                )}
                {listing.fuelType && (
                  <Group gap="xs">
                    <IconGasStation size={20} color="var(--mantine-color-cliquealow-green-6)" />
                    <div>
                      <Text size="sm" fw={500}>Combustible</Text>
                      <Text size="xs" c="dimmed" tt="capitalize">{listing.fuelType}</Text>
                    </div>
                  </Group>
                )}
                {listing.transmission && (
                  <Group gap="xs">
                    <IconManualGearbox size={20} color="var(--mantine-color-cliquealow-green-6)" />
                    <div>
                      <Text size="sm" fw={500}>Transmisión</Text>
                      <Text size="xs" c="dimmed" tt="capitalize">{listing.transmission}</Text>
                    </div>
                  </Group>
                )}
                <Group gap="xs">
                  <IconCalendar size={20} color="var(--mantine-color-cliquealow-green-6)" />
                  <div>
                    <Text size="sm" fw={500}>Año</Text>
                    <Text size="xs" c="dimmed">{listing.year}</Text>
                  </div>
                </Group>
                {listing.color && (
                  <Group gap="xs">
                    <IconCar size={20} color="var(--mantine-color-cliquealow-green-6)" />
                    <div>
                      <Text size="sm" fw={500}>Color</Text>
                      <Text size="xs" c="dimmed">{listing.color}</Text>
                    </div>
                  </Group>
                )}
                {listing.bodyType && (
                  <Group gap="xs">
                    <IconCar size={20} color="var(--mantine-color-cliquealow-green-6)" />
                    <div>
                      <Text size="sm" fw={500}>Tipo</Text>
                      <Text size="xs" c="dimmed" tt="capitalize">{listing.bodyType}</Text>
                    </div>
                  </Group>
                )}
              </SimpleGrid>
            </Card>

            {/* Description */}
            {listing.description && (
              <Card withBorder p="lg">
                <Title order={3} mb="md">Descripción</Title>
                <Text style={{ whiteSpace: 'pre-wrap' }}>
                  {listing.description}
                </Text>
              </Card>
            )}

            {/* Features */}
            {listing.features && listing.features.length > 0 && (
              <Card withBorder p="lg">
                <Title order={3} mb="md">Características y Equipamiento</Title>
                <List spacing="xs" size="sm">
                  {listing.features.map((feature, index) => (
                    <List.Item key={index}>{feature}</List.Item>
                  ))}
                </List>
              </Card>
            )}
          </Stack>
        </Grid.Col>

        {/* Sidebar */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="lg">
            {/* Price Card */}
            <Card withBorder p="lg" ta="center">
              <Stack gap="sm">
                <Text size="3xl" fw={700} c="green.7">
                  {formatPrice(listing.price)}
                </Text>
                <Text size="sm" c="dimmed">
                  Publicado el {formatDate(listing.createdAt)}
                </Text>
              </Stack>
            </Card>

            {/* Contact Information */}
            {listing.contactInfo && (
              <Card withBorder p="lg">
                <Title order={4} mb="md">Información de Contacto</Title>
                <Stack gap="sm">
                  {listing.contactInfo.phone && (
                    <Group gap="sm">
                      <IconPhone size={18} color="var(--mantine-color-cliquealow-green-6)" />
                      <div>
                        <Text size="sm" fw={500}>Teléfono</Text>
                        <Text size="xs" c="cliquealow-green" component="a" href={`tel:${listing.contactInfo.phone}`}>
                          {listing.contactInfo.phone}
                        </Text>
                      </div>
                    </Group>
                  )}
                  {listing.contactInfo.whatsapp && (
                    <Group gap="sm">
                      <IconBrandWhatsapp size={18} color="var(--mantine-color-green-6)" />
                      <div>
                        <Text size="sm" fw={500}>WhatsApp</Text>
                        <Text 
                          size="xs" 
                          c="green" 
                          component="a" 
                          href={`https://wa.me/${listing.contactInfo.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                        >
                          {listing.contactInfo.whatsapp}
                        </Text>
                      </div>
                    </Group>
                  )}
                  {listing.contactInfo.email && (
                    <Group gap="sm">
                      <IconMail size={18} color="var(--mantine-color-cliquealow-green-6)" />
                      <div>
                        <Text size="sm" fw={500}>Email</Text>
                        <Text size="xs" c="cliquealow-green" component="a" href={`mailto:${listing.contactInfo.email}`}>
                          {listing.contactInfo.email}
                        </Text>
                      </div>
                    </Group>
                  )}
                </Stack>
              </Card>
            )}

            {/* Additional Info */}
            <Card withBorder p="lg">
              <Title order={4} mb="md">Información Adicional</Title>
              <Stack gap="xs">
                {listing.serialNumber && (
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Número de Serie</Text>
                    <Text size="sm">{listing.serialNumber}</Text>
                  </Group>
                )}
                {listing.motorNumber && (
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Número de Motor</Text>
                    <Text size="sm">{listing.motorNumber}</Text>
                  </Group>
                )}
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Visualizaciones</Text>
                  <Text size="sm">{listing.viewsCount || 0}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Me Gusta</Text>
                  <Text size="sm">{listing.likesCount || 0}</Text>
                </Group>
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
}