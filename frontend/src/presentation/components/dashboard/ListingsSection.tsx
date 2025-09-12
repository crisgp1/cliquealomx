'use client';

import { useState, useEffect } from 'react';
import {
  Title,
  Text,
  Button,
  Group,
  Stack,
  Card,
  Badge,
  Grid,
  ActionIcon,
  Menu,
  TextInput,
  Select,
  Pagination,
  Image,
  Container,
  Flex,
  Paper,
  Loader,
  Center,
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconEye,
  IconHeart,
  IconCar,
  IconMapPin,
  IconCurrencyDollar,
  IconGasStation,
  IconManualGearbox,
  IconGauge,
} from '@tabler/icons-react';
import { Listing } from '@/lib/api/listings';
import { notifications } from '@mantine/notifications';
import { useListingsApi } from '@/hooks/useListingsApi';

export function ListingsSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    sold: 0,
    views: 0,
    likes: 0
  });

  const listingsApi = useListingsApi();

  // Load listings and stats on component mount
  useEffect(() => {
    loadListings();
    loadStats();
  }, []);

  // Reload when filters change
  useEffect(() => {
    loadListings();
  }, [statusFilter]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const filters = {
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        sortBy: 'recent' as const,
      };
      
      const data = await listingsApi.getMyListings(filters);
      setListings(data);
    } catch (error) {
      console.error('Error loading listings:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar los anuncios',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await listingsApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = () => {
    loadListings();
  };

  const handleDeleteListing = async (id: string, title: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el anuncio "${title}"?`)) {
      return;
    }

    try {
      await listingsApi.deleteListing(id);
      notifications.show({
        title: 'Anuncio eliminado',
        message: 'El anuncio ha sido eliminado correctamente',
        color: 'green',
      });
      loadListings();
      loadStats();
    } catch (error) {
      console.error('Error deleting listing:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudo eliminar el anuncio',
        color: 'red',
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await listingsApi.updateStatus(id, newStatus);
      notifications.show({
        title: 'Estado actualizado',
        message: 'El estado del anuncio ha sido actualizado',
        color: 'green',
      });
      loadListings();
      loadStats();
    } catch (error) {
      console.error('Error updating status:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudo actualizar el estado',
        color: 'red',
      });
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
      case 'active': return 'Activo';
      case 'sold': return 'Vendido';
      case 'reserved': return 'Reservado';
      case 'inactive': return 'Inactivo';
      default: return status;
    }
  };

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
      if (!dateObj || isNaN(dateObj.getTime())) {
        return 'Fecha inválida';
      }
      return new Intl.DateTimeFormat('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(dateObj);
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || listing.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Container size="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1} size="h2" mb="xs">
              Mis Anuncios
            </Title>
            <Text size="lg" c="dimmed">
              Gestiona tus publicaciones de autos usados
            </Text>
          </div>
          <Button
            leftSection={<IconPlus size={18} />}
            component="a"
            href="/dashboard/create"
            size="lg"
            radius="md"
          >
            Crear Anuncio
          </Button>
        </Group>

        {/* Stats Cards */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper p="md" withBorder radius="md">
              <Group gap="xs">
                <IconCar size={24} color="var(--mantine-color-blue-6)" />
                <div>
                  <Text size="xl" fw={700}>
                    {stats.total}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Total Anuncios
                  </Text>
                </div>
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper p="md" withBorder radius="md">
              <Group gap="xs">
                <IconEye size={24} color="var(--mantine-color-green-6)" />
                <div>
                  <Text size="xl" fw={700}>
                    {formatNumber(stats.views)}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Visualizaciones
                  </Text>
                </div>
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper p="md" withBorder radius="md">
              <Group gap="xs">
                <IconHeart size={24} color="var(--mantine-color-red-6)" />
                <div>
                  <Text size="xl" fw={700}>
                    {stats.likes}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Me Gusta
                  </Text>
                </div>
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper p="md" withBorder radius="md">
              <Group gap="xs">
                <IconCurrencyDollar size={24} color="var(--mantine-color-orange-6)" />
                <div>
                  <Text size="xl" fw={700}>
                    {stats.active}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Anuncios Activos
                  </Text>
                </div>
              </Group>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Filters */}
        <Paper p="md" withBorder radius="md">
          <Group>
            <TextInput
              placeholder="Buscar por título, marca o modelo..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Estado"
              leftSection={<IconFilter size={16} />}
              value={statusFilter}
              onChange={setStatusFilter}
              data={[
                { value: '', label: 'Todos los estados' },
                { value: 'active', label: 'Activos' },
                { value: 'sold', label: 'Vendidos' },
                { value: 'reserved', label: 'Reservados' },
                { value: 'inactive', label: 'Inactivos' },
              ]}
              style={{ minWidth: 200 }}
            />
          </Group>
        </Paper>

        {/* Listings Grid */}
        {loading ? (
          <Center h={200}>
            <Loader size="lg" />
          </Center>
        ) : filteredListings.length === 0 ? (
          <Paper p="xl" withBorder radius="md" ta="center">
            <IconCar size={48} color="var(--mantine-color-gray-4)" style={{ margin: '0 auto 16px' }} />
            <Title order={3} c="dimmed" mb="xs">
              No hay anuncios
            </Title>
            <Text c="dimmed" mb="lg">
              {searchQuery || statusFilter 
                ? 'No se encontraron anuncios que coincidan con los filtros aplicados.'
                : 'Aún no has creado ningún anuncio. ¡Comienza publicando tu primer auto!'
              }
            </Text>
            <Button component="a" href="/dashboard/create" leftSection={<IconPlus size={16} />}>
              Crear Primer Anuncio
            </Button>
          </Paper>
        ) : (
          <Grid>
            {filteredListings.map((listing) => (
              <Grid.Col key={listing.id} span={{ base: 12, sm: 6, lg: 4 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  {/* Image */}
                  <Card.Section>
                    <Image
                      src={listing.images?.[0] || '/api/placeholder/300/200'}
                      height={200}
                      alt={listing.title}
                      fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xMzAgMTAwSDIzMFY2MEgxMzBWMTAwWk0xMDAgMTMwSDE3MFYxMDBIMTAwVjEzMFoiIGZpbGw9IiNEMEQwRDAiLz4KPC9zdmc+"
                    />
                    <Badge
                      color={getStatusColor(listing.status)}
                      variant="filled"
                      size="sm"
                      style={{ position: 'absolute', top: 8, right: 8 }}
                    >
                      {getStatusLabel(listing.status)}
                    </Badge>
                  </Card.Section>

                  {/* Content */}
                  <Stack gap="sm" mt="md">
                    <Group justify="space-between" align="flex-start">
                      <div style={{ flex: 1 }}>
                        <Title order={4} size="h5" lineClamp={2}>
                          {listing.title}
                        </Title>
                        <Text size="sm" c="dimmed" mt={4}>
                          {listing.brand} {listing.model} {listing.year}
                        </Text>
                      </div>
                      <Menu shadow="md" position="bottom-end">
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray">
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item 
                            leftSection={<IconEye size={14} />}
                            onClick={() => window.open(`/listings/${listing.id}`, '_blank')}
                          >
                            Ver Anuncio
                          </Menu.Item>
                          <Menu.Item 
                            leftSection={<IconEdit size={14} />}
                            onClick={() => window.location.href = `/dashboard/listings/${listing.id}/edit`}
                          >
                            Editar
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Label>Estado del anuncio</Menu.Label>
                          <Menu.Item onClick={() => handleStatusChange(listing.id, 'active')}>
                            Marcar como Activo
                          </Menu.Item>
                          <Menu.Item onClick={() => handleStatusChange(listing.id, 'sold')}>
                            Marcar como Vendido
                          </Menu.Item>
                          <Menu.Item onClick={() => handleStatusChange(listing.id, 'inactive')}>
                            Desactivar
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item 
                            leftSection={<IconTrash size={14} />} 
                            color="red"
                            onClick={() => handleDeleteListing(listing.id, listing.title)}
                          >
                            Eliminar
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>

                    {/* Price */}
                    <Text size="xl" fw={700} c="green.7">
                      {formatPrice(listing.price)}
                    </Text>

                    {/* Details */}
                    <Group gap="xs" c="dimmed">
                      {listing.mileage && (
                        <Group gap={4}>
                          <IconGauge size={14} />
                          <Text size="xs">
                            {listing.mileage ? formatNumber(listing.mileage) : 0} km
                          </Text>
                        </Group>
                      )}
                      {listing.fuelType && (
                        <Group gap={4}>
                          <IconGasStation size={14} />
                          <Text size="xs" tt="capitalize">
                            {listing.fuelType}
                          </Text>
                        </Group>
                      )}
                      {listing.transmission && (
                        <Group gap={4}>
                          <IconManualGearbox size={14} />
                          <Text size="xs" tt="capitalize">
                            {listing.transmission}
                          </Text>
                        </Group>
                      )}
                    </Group>

                    {/* Location */}
                    {listing.location && (
                      <Group gap={4} c="dimmed">
                        <IconMapPin size={14} />
                        <Text size="xs">
                          {listing.location.city}, {listing.location.state}
                        </Text>
                      </Group>
                    )}

                    {/* Stats */}
                    <Group justify="space-between">
                      <Group gap="sm">
                        <Group gap={4}>
                          <IconEye size={14} color="var(--mantine-color-gray-6)" />
                          <Text size="xs" c="dimmed">
                            {listing.viewsCount}
                          </Text>
                        </Group>
                        <Group gap={4}>
                          <IconHeart size={14} color="var(--mantine-color-gray-6)" />
                          <Text size="xs" c="dimmed">
                            {listing.likesCount}
                          </Text>
                        </Group>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {formatDate(listing.createdAt)}
                      </Text>
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        )}

        {/* Pagination */}
        {filteredListings.length > 0 && (
          <Flex justify="center">
            <Pagination total={1} size="sm" />
          </Flex>
        )}
      </Stack>

    </Container>
  );
}