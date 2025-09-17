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
  rem,
  Progress,
  Alert,
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
  IconPlus,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';

// Import the form sections (we'll create Mantine versions)
import { VehicleIdentitySection } from '../forms/VehicleIdentitySectionMantine';
import { VehicleSpecsSection } from '../forms/VehicleSpecsSectionMantine';
import { ImageUploadSection } from './ImageUploadSection';
import { ContactLocationSection } from '../forms/ContactLocationSectionMantine';

const STEPS = [
  {
    label: 'Información Básica',
    description: 'Marca, modelo y título',
    icon: IconCar,
    key: 'identity',
    required: true,
  },
  {
    label: 'Especificaciones',
    description: 'Año, precio, características',
    icon: IconSettings,
    key: 'specs',
    required: true,
  },
  {
    label: 'Fotografías',
    description: 'Imágenes del vehículo',
    icon: IconPhoto,
    key: 'images',
    required: true,
  },
  {
    label: 'Ubicación y Contacto',
    description: 'Datos de contacto',
    icon: IconMapPin,
    key: 'contact',
    required: true,
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

export function StepperCreateForm() {
  const [active, setActive] = useState(0);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm({
    initialValues: {
      // Basic Info
      title: '',
      brand: '',
      model: '',

      // Specs
      year: new Date().getFullYear(),
      price: '',
      description: '',
      mileage: '',
      fuelType: '',
      transmission: '',
      bodyType: '',
      color: '',
      serialNumber: '',
      motorNumber: '',
      features: [],

      // Contact
      city: '',
      state: '',
      phone: '',
      whatsapp: '',
      email: '',
      isFeatured: false,
    },
    validate: (values) => {
      const errors: Record<string, string> = {};

      // Step 0 validation
      if (active === 0 || active === STEPS.length) {
        if (!values.title) errors.title = 'El título es requerido';
        if (!values.brand) errors.brand = 'La marca es requerida';
        if (!values.model) errors.model = 'El modelo es requerido';
      }

      // Step 1 validation
      if (active === 1 || active === STEPS.length) {
        if (!values.year || values.year < 1990) errors.year = 'Año válido requerido';
        if (!values.price || Number(values.price) <= 0) errors.price = 'Precio válido requerido';
      }

      // Step 2 validation
      if (active === 2 || active === STEPS.length) {
        if (uploadedImages.length === 0) errors.images = 'Al menos una imagen es requerida';
      }

      // Step 3 validation
      if (active === 3 || active === STEPS.length) {
        if (!values.city) errors.city = 'La ciudad es requerida';
        if (!values.state) errors.state = 'El estado es requerido';
        if (!values.phone) errors.phone = 'El teléfono es requerido';
      }

      return errors;
    },
  });

  // Step validation functions
  const isStepComplete = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Identity
        return form.values.title && form.values.brand && form.values.model;
      case 1: // Specs
        return form.values.year && form.values.price;
      case 2: // Images
        return uploadedImages.length > 0;
      case 3: // Contact
        return form.values.city && form.values.state && form.values.phone;
      default:
        return false;
    }
  };

  const getStepStatus = (stepIndex: number) => {
    if (isStepComplete(stepIndex)) return 'completed';
    if (stepIndex === active) return 'active';
    return 'pending';
  };

  const getCompletionPercentage = () => {
    const completedSteps = STEPS.filter((_, index) => isStepComplete(index)).length;
    return (completedSteps / STEPS.length) * 100;
  };

  const nextStep = () => {
    const validation = form.validate();
    if (validation.hasErrors) {
      return;
    }

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

  const handleImagesUploaded = (urls: string[]) => {
    setUploadedImages(prev => [...prev, ...urls]);
  };

  const handleImagesChanged = (images: string[]) => {
    setUploadedImages(images);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all steps
    const tempActive = active;
    setActive(STEPS.length); // Trigger validation for all steps
    const validation = form.validate();
    setActive(tempActive);

    if (validation.hasErrors || uploadedImages.length === 0) {
      notifications.show({
        title: 'Formulario incompleto',
        message: 'Por favor completa todos los campos requeridos en todas las secciones.',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Here you would call your create listing API
      // const listingData = {
      //   ...form.values,
      //   images: uploadedImages,
      // };
      // await createListing(listingData);

      notifications.show({
        title: '¡Anuncio creado exitosamente!',
        message: 'Tu anuncio ha sido publicado y ya está visible.',
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      router.push('/dashboard/listings');
    } catch {
      notifications.show({
        title: 'Error al crear el anuncio',
        message: 'Ocurrió un error al publicar tu anuncio. Intenta nuevamente.',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (active) {
      case 0:
        return (
          <VehicleIdentitySection
            formData={form.values}
            handleInputChange={(field, value) => form.setFieldValue(field, value)}
            carBrands={CAR_BRANDS}
            errors={form.errors as Record<string, string>}
          />
        );
      case 1:
        return (
          <VehicleSpecsSection
            formData={form.values}
            handleInputChange={(field, value) => form.setFieldValue(field, value)}
            fuelTypes={FUEL_TYPES}
            transmissionTypes={TRANSMISSION_TYPES}
            bodyTypes={BODY_TYPES}
            commonFeatures={COMMON_FEATURES}
            errors={form.errors as Record<string, string>}
          />
        );
      case 2:
        return (
          <ImageUploadSection
            existingImages={uploadedImages}
            onImagesUploaded={handleImagesUploaded}
            onImagesChanged={handleImagesChanged}
          />
        );
      case 3:
        return (
          <ContactLocationSection
            formData={form.values}
            handleInputChange={(field, value) => form.setFieldValue(field, value)}
            mexicanStates={MEXICAN_STATES}
            errors={form.errors as Record<string, string>}
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
          {/* Header with Progress */}
          <Card withBorder p="lg">
            <Group justify="space-between" mb="lg">
              <div>
                <Title order={2}>Publicar Nuevo Anuncio</Title>
                <Text c="dimmed">
                  Completa la información de tu vehículo paso a paso
                </Text>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Badge
                  size="lg"
                  variant="light"
                  color={getCompletionPercentage() === 100 ? 'green' : 'blue'}
                >
                  {Math.round(getCompletionPercentage())}% Completado
                </Badge>
                <Progress
                  value={getCompletionPercentage()}
                  size="sm"
                  mt="xs"
                  style={{ width: 200 }}
                />
              </div>
            </Group>

            {/* Tips Alert */}
            <Alert
              icon={<IconInfoCircle size={16} />}
              title="Consejos para un mejor anuncio"
              color="blue"
              variant="light"
              mb="lg"
            >
              <Text size="sm">
                • Usa un título descriptivo (ej: &quot;Honda Civic 2020 Seminuevo&quot;)
                • Agrega al menos 5 fotos de buena calidad
                • Incluye todas las características importantes
                • Verifica que tus datos de contacto sean correctos
              </Text>
            </Alert>

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
                          {step.required && (
                            <Badge size="xs" color="red" variant="light">
                              Requerido
                            </Badge>
                          )}
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
                  onClick={() => router.push('/dashboard')}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>

                {active === STEPS.length - 1 ? (
                  <Button
                    type="submit"
                    loading={isSubmitting}
                    leftSection={<IconPlus size={16} />}
                    size="md"
                    disabled={getCompletionPercentage() !== 100}
                  >
                    {isSubmitting ? 'Publicando anuncio...' : 'Publicar Anuncio'}
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