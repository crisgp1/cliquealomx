'use client';

import { useState } from 'react';
import {
  Stepper,
  Button,
  Group,
  Card,
  Stack,
  Title,
  Text,
  Badge,
  Container,
  Grid,
  Box,
  LoadingOverlay,
  Alert,
  rem,
} from '@mantine/core';
import {
  IconCar,
  IconSettings,
  IconPhoto,
  IconMapPin,
  IconCheck,
  IconAlertCircle,
  IconArrowLeft,
  IconArrowRight,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useListingEditor } from '@/presentation/hooks/use-listing-editor-static';

// Import the form sections (we'll convert them back to Mantine)
import { VehicleIdentitySection } from '../forms/VehicleIdentitySectionMantine';
import { VehicleSpecsSection } from '../forms/VehicleSpecsSectionMantine';
import { ImageUploadSection } from './ImageUploadSection';
import { ContactLocationSection } from '../forms/ContactLocationSectionMantine';

interface StepperEditFormProps {
  listingId: string;
}

const STEPS = [
  {
    label: 'Información Básica',
    description: 'Marca, modelo y título',
    icon: IconCar,
    key: 'identity',
  },
  {
    label: 'Especificaciones',
    description: 'Año, precio, características',
    icon: IconSettings,
    key: 'specs',
  },
  {
    label: 'Fotografías',
    description: 'Imágenes del vehículo',
    icon: IconPhoto,
    key: 'images',
  },
  {
    label: 'Ubicación y Contacto',
    description: 'Datos de contacto',
    icon: IconMapPin,
    key: 'contact',
  },
];

const CAR_BRANDS = [
  'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler',
  'Dodge', 'Ford', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar',
  'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz',
  'Mini', 'Mitsubishi', 'Nissan', 'Pontiac', 'Porsche', 'Ram', 'Subaru',
  'Suzuki', 'Toyota', 'Volkswagen', 'Volvo'
].map(brand => ({ value: brand.toLowerCase(), label: brand }));

const FUEL_TYPES = [
  { value: 'gasolina', label: 'Gasolina' },
  { value: 'diesel', label: 'Diésel' },
  { value: 'hibrido', label: 'Híbrido' },
  { value: 'electrico', label: 'Eléctrico' },
];

const TRANSMISSION_TYPES = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatico', label: 'Automático' },
];

const BODY_TYPES = [
  { value: 'sedan', label: 'Sedán' },
  { value: 'suv', label: 'SUV' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'pickup', label: 'Pick-up' },
  { value: 'coupe', label: 'Coupé' },
  { value: 'convertible', label: 'Convertible' },
];

const MEXICAN_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
  'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
  'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
  'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
  'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán',
  'Zacatecas'
].map(state => ({ value: state.toLowerCase().replace(/\s+/g, '-'), label: state }));

const COMMON_FEATURES = [
  'Aire Acondicionado', 'Sistema de Audio', 'Bluetooth', 'GPS/Navegación',
  'Cámara de Reversa', 'Sensores de Estacionamiento', 'Asientos de Cuero',
  'Asientos Eléctricos', 'Climatizador Automático', 'Control de Velocidad',
  'Vidrios Eléctricos', 'Seguros Eléctricos', 'Espejos Eléctricos',
  'Bolsas de Aire', 'ABS', 'Control de Estabilidad', 'Llanta de Refacción'
];

export function StepperEditForm({ listingId }: StepperEditFormProps) {
  const [active, setActive] = useState(0);
  const router = useRouter();

  const {
    loading,
    error,
    listing,
    isSubmitting,
    currentImages,
    formData,
    handleInputChange,
    handleSubmit,
    handleImagesUploaded,
    handleImagesChanged,
    retry,
  } = useListingEditor({
    listingId,
    onSuccess: () => router.push('/dashboard/listings'),
  });

  // Step validation functions
  const isStepComplete = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Identity
        return formData.title && formData.brand && formData.model;
      case 1: // Specs
        return formData.year && formData.price;
      case 2: // Images
        return currentImages.length > 0;
      case 3: // Contact
        return formData.city && formData.state && formData.phone;
      default:
        return false;
    }
  };

  const getStepStatus = (stepIndex: number) => {
    if (isStepComplete(stepIndex)) return 'completed';
    if (stepIndex === active) return 'active';
    return 'pending';
  };

  const nextStep = () => {
    if (active < STEPS.length - 1) {
      setActive(active + 1);
    }
  };

  const prevStep = () => {
    if (active > 0) {
      setActive(active - 1);
    }
  };

  const jumpToStep = (stepIndex: number) => {
    setActive(stepIndex);
  };

  if (loading) {
    return (
      <Card withBorder pos="relative" mih={400}>
        <LoadingOverlay visible={loading} />
        <Text ta="center" py="xl">Cargando datos del anuncio...</Text>
      </Card>
    );
  }

  if (error || !listing) {
    return (
      <Alert
        icon={<IconAlertCircle size="1.1rem" />}
        title="Error al cargar el anuncio"
        color="red"
        variant="light"
      >
        {error || 'No se pudo cargar el anuncio. Por favor intenta nuevamente.'}
        <Group mt="md">
          <Button variant="light" onClick={retry}>
            Reintentar
          </Button>
          <Button variant="subtle" onClick={() => router.push('/dashboard/listings')}>
            Volver a mis anuncios
          </Button>
        </Group>
      </Alert>
    );
  }

  const renderStepContent = () => {
    switch (active) {
      case 0:
        return (
          <VehicleIdentitySection
            formData={formData}
            handleInputChange={handleInputChange}
            carBrands={CAR_BRANDS}
          />
        );
      case 1:
        return (
          <VehicleSpecsSection
            formData={formData}
            handleInputChange={handleInputChange}
            fuelTypes={FUEL_TYPES}
            transmissionTypes={TRANSMISSION_TYPES}
            bodyTypes={BODY_TYPES}
            commonFeatures={COMMON_FEATURES}
          />
        );
      case 2:
        return (
          <ImageUploadSection
            listingId={listingId}
            existingImages={currentImages}
            onImagesUploaded={handleImagesUploaded}
            onImagesChanged={handleImagesChanged}
          />
        );
      case 3:
        return (
          <ContactLocationSection
            formData={formData}
            handleInputChange={handleInputChange}
            mexicanStates={MEXICAN_STATES}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Container size="xl">
      <form onSubmit={handleSubmit}>
        <Stack gap="xl">
          {/* Header with Quick Navigation */}
          <Card withBorder p="lg">
            <Group justify="space-between" mb="lg">
              <div>
                <Title order={2}>Editar Anuncio</Title>
                <Text c="dimmed">
                  Puedes navegar libremente entre las secciones para editar tu anuncio
                </Text>
              </div>
              <Badge
                size="lg"
                variant="light"
                color={Object.values(STEPS).every((_, index) => isStepComplete(index)) ? 'green' : 'blue'}
              >
                {Object.values(STEPS).filter((_, index) => isStepComplete(index)).length} / {STEPS.length} Completado
              </Badge>
            </Group>

            {/* Quick Navigation Cards */}
            <Grid>
              {STEPS.map((step, index) => {
                const IconComponent = step.icon;
                const status = getStepStatus(index);
                const isComplete = isStepComplete(index);

                return (
                  <Grid.Col key={step.key} span={{ base: 12, sm: 6, md: 3 }}>
                    <Card
                      withBorder
                      p="md"
                      style={{
                        cursor: 'pointer',
                        borderColor: status === 'active' ? 'var(--mantine-color-blue-6)' : undefined,
                        backgroundColor: status === 'active' ? 'var(--mantine-color-blue-0)' : undefined,
                      }}
                      onClick={() => jumpToStep(index)}
                    >
                      <Group gap="sm">
                        <Box
                          style={{
                            padding: rem(8),
                            borderRadius: rem(8),
                            backgroundColor: isComplete
                              ? 'var(--mantine-color-green-1)'
                              : status === 'active'
                                ? 'var(--mantine-color-blue-1)'
                                : 'var(--mantine-color-gray-1)',
                          }}
                        >
                          {isComplete ? (
                            <IconCheck size={20} style={{ color: 'var(--mantine-color-green-6)' }} />
                          ) : (
                            <IconComponent
                              size={20}
                              style={{
                                color: status === 'active'
                                  ? 'var(--mantine-color-blue-6)'
                                  : 'var(--mantine-color-gray-6)'
                              }}
                            />
                          )}
                        </Box>
                        <div style={{ flex: 1 }}>
                          <Text fw={500} size="sm">
                            {step.label}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {step.description}
                          </Text>
                        </div>
                      </Group>
                    </Card>
                  </Grid.Col>
                );
              })}
            </Grid>
          </Card>

          {/* Main Stepper */}
          <Card withBorder p="lg">
            <Stepper
              active={active}
              onStepClick={jumpToStep}
              allowNextStepsSelect={false}
              size="sm"
              mb="xl"
            >
              {STEPS.map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <Stepper.Step
                    key={step.key}
                    label={step.label}
                    description={step.description}
                    icon={isStepComplete(index) ? <IconCheck size={18} /> : <IconComponent size={18} />}
                    completedIcon={<IconCheck size={18} />}
                  />
                );
              })}
            </Stepper>

            {/* Step Content */}
            <Box mt="xl">
              {renderStepContent()}
            </Box>

            {/* Navigation Buttons */}
            <Group justify="space-between" mt="xl">
              <Button
                variant="default"
                leftSection={<IconArrowLeft size={16} />}
                onClick={prevStep}
                disabled={active === 0}
              >
                Anterior
              </Button>

              <Group>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/listings')}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>

                {active === STEPS.length - 1 ? (
                  <Button
                    type="submit"
                    loading={isSubmitting}
                    leftSection={<IconCheck size={16} />}
                    size="md"
                  >
                    {isSubmitting ? 'Guardando cambios...' : 'Guardar Cambios'}
                  </Button>
                ) : (
                  <Button
                    rightSection={<IconArrowRight size={16} />}
                    onClick={nextStep}
                    disabled={active === STEPS.length - 1}
                  >
                    Siguiente
                  </Button>
                )}
              </Group>
            </Group>
          </Card>
        </Stack>
      </form>
    </Container>
  );
}