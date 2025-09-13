'use client';

import { useState, useCallback } from 'react';
import {
  Button,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Group,
  Stack,
  Grid,
  Title,
  Card,
  MultiSelect,
  Divider,
  Switch,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconCar,
  IconMapPin,
  IconPhone,
  IconMail,
  IconBrandWhatsapp,
  IconFileText,
  IconCheck,
} from '@tabler/icons-react';
import { ImageUploadSection } from './ImageUploadSection';
import { ImageUploadUtil } from '@/lib/utils/imageUpload';
import { useAuth } from '@clerk/nextjs';
import { CreateListingData } from '@/lib/api/listings';
import { useRouter } from 'next/navigation';
import { useListingsApi } from '@/hooks/useListingsApi';

interface CreateListingFormProps {
  onSuccess?: () => void;
}

const carBrands = [
  'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 
  'Dodge', 'Ford', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 
  'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz',
  'Mini', 'Mitsubishi', 'Nissan', 'Pontiac', 'Porsche', 'Ram', 'Subaru',
  'Suzuki', 'Toyota', 'Volkswagen', 'Volvo'
].map(brand => ({ value: brand.toLowerCase(), label: brand }));

const fuelTypes = [
  { value: 'gasolina', label: 'Gasolina' },
  { value: 'diesel', label: 'Diésel' },
  { value: 'hibrido', label: 'Híbrido' },
  { value: 'electrico', label: 'Eléctrico' },
];

const transmissionTypes = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatico', label: 'Automático' },
];

const bodyTypes = [
  { value: 'sedan', label: 'Sedán' },
  { value: 'suv', label: 'SUV' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'pickup', label: 'Pick-up' },
  { value: 'coupe', label: 'Coupé' },
  { value: 'convertible', label: 'Convertible' },
];

const mexicanStates = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
  'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
  'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
  'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
  'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
].map(state => ({ value: state.toLowerCase().replace(/\s+/g, '_'), label: state }));

const commonFeatures = [
  'Aire Acondicionado', 'Dirección Hidráulica', 'Bolsas de Aire', 'ABS',
  'Frenos de Disco', 'Vidrios Eléctricos', 'Seguros Eléctricos', 'Espejos Eléctricos',
  'Radio AM/FM', 'CD/DVD', 'Bluetooth', 'USB', 'Cámara Trasera', 'GPS',
  'Sensores de Estacionamiento', 'Alarma', 'Rines de Aleación', 'Llantas Nuevas',
  'Tapicería de Piel', 'Quemacocos', 'Control de Crucero', 'Computadora de Viaje'
];


export function CreateListingForm({ onSuccess }: CreateListingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const listingsApi = useListingsApi();
  const { getToken } = useAuth();

  const form = useForm({
    initialValues: {
      // Basic Information
      title: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      price: 0,
      description: '',
      
      // Vehicle Details
      mileage: 0,
      fuelType: '',
      transmission: '',
      bodyType: '',
      color: '',
      serialNumber: '',
      motorNumber: '',
      
      // Location & Contact
      city: '',
      state: '',
      phone: '',
      whatsapp: '',
      email: '',
      
      // Features & Documents
      features: [] as string[],
      isFeatured: false,
    },
    
    validate: {
      title: (value) => (!value ? 'El título es requerido' : null),
      brand: (value) => (!value ? 'La marca es requerida' : null),
      model: (value) => (!value ? 'El modelo es requerido' : null),
      year: (value) => (value < 1990 || value > new Date().getFullYear() + 1) ? 'Año inválido' : null,
      price: (value) => (value <= 0 ? 'El precio debe ser mayor a 0' : null),
      city: (value) => (!value ? 'La ciudad es requerida' : null),
      state: (value) => (!value ? 'El estado es requerido' : null),
      phone: (value) => (!value ? 'El teléfono es requerido' : null),
    },
  });

  const handleImagesChanged = useCallback(() => {
    // Images are managed internally by ImageUploadSection
  }, []);

  const handleSubmit = async (values: typeof form.values) => {
    console.log('🚀 Form submit triggered!', values);
    setIsSubmitting(true);
    
    try {
      // Prepare the data for the API
      const listingData: CreateListingData = {
        title: values.title,
        brand: values.brand,
        model: values.model,
        year: values.year,
        price: values.price,
        description: values.description,
        mileage: values.mileage,
        fuelType: values.fuelType,
        transmission: values.transmission,
        bodyType: values.bodyType,
        color: values.color,
        serialNumber: values.serialNumber || undefined,
        motorNumber: values.motorNumber || undefined,
        features: values.features,
        city: values.city,
        state: values.state,
        phone: values.phone,
        whatsapp: values.whatsapp || undefined,
        email: values.email || undefined,
        isFeatured: values.isFeatured,
      };
      
      // Create the listing
      console.log('📡 Sending to API:', listingData);
      const newListing = await listingsApi.createListing(listingData);
      console.log('✅ API response:', newListing);
      
      // Upload pending images if any
      if (ImageUploadUtil.hasPendingImages()) {
        console.log(`📸 Uploading ${ImageUploadUtil.getPendingImagesCount()} pending images...`);
        const uploadedUrls = await ImageUploadUtil.uploadPendingImages(newListing.id, getToken);
        console.log('✅ Images uploaded:', uploadedUrls);
      }
      
      notifications.show({
        title: '¡Anuncio creado exitosamente!',
        message: 'Tu anuncio ha sido publicado y está disponible para los compradores.',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      
      // Reset form and clear any remaining pending images
      form.reset();
      ImageUploadUtil.clearPendingImages();
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Redirect to listings page
      router.push('/dashboard/listings');
      
    } catch (error) {
      console.error('Error creating listing:', error);
      notifications.show({
        title: 'Error al crear anuncio',
        message: error instanceof Error ? error.message : 'Ocurrió un error al publicar tu anuncio. Por favor intenta nuevamente.',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="xl">
        {/* Basic Information */}
        <Card withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <IconCar size={20} />
              <Title order={3}>Información Básica</Title>
            </Group>
            
            <TextInput
              label="Título del Anuncio"
              description="Ejemplo: Honda Civic 2020 Seminuevo"
              placeholder="Escribe un título atractivo para tu auto"
              required
              {...form.getInputProps('title')}
            />
            
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Marca"
                  placeholder="Selecciona la marca"
                  data={carBrands}
                  searchable
                  required
                  {...form.getInputProps('brand')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Modelo"
                  placeholder="Ejemplo: Civic, Corolla, Sentra"
                  required
                  {...form.getInputProps('model')}
                />
              </Grid.Col>
            </Grid>
            
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput
                  label="Año"
                  placeholder={new Date().getFullYear().toString()}
                  min={1990}
                  max={new Date().getFullYear() + 1}
                  required
                  {...form.getInputProps('year')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput
                  label="Precio (MXN)"
                  placeholder="285000"
                  min={0}
                  step={1000}
                  thousandSeparator=","
                  prefix="$"
                  required
                  {...form.getInputProps('price')}
                />
              </Grid.Col>
            </Grid>
            
            <Textarea
              label="Descripción"
              description="Describe las características y condiciones de tu auto"
              placeholder="Excelente estado, un solo dueño, mantenimientos al día..."
              minRows={3}
              {...form.getInputProps('description')}
            />
          </Stack>
        </Card>

        {/* Vehicle Details */}
        <Card withBorder>
          <Stack gap="md">
            <Title order={3}>Detalles del Vehículo</Title>
            
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <NumberInput
                  label="Kilometraje"
                  placeholder="45000"
                  min={0}
                  step={1000}
                  {...form.getInputProps('mileage')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Select
                  label="Tipo de Combustible"
                  placeholder="Selecciona"
                  data={fuelTypes}
                  {...form.getInputProps('fuelType')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Select
                  label="Transmisión"
                  placeholder="Selecciona"
                  data={transmissionTypes}
                  {...form.getInputProps('transmission')}
                />
              </Grid.Col>
            </Grid>
            
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Tipo de Carrocería"
                  placeholder="Selecciona"
                  data={bodyTypes}
                  {...form.getInputProps('bodyType')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Color"
                  placeholder="Ejemplo: Blanco, Negro, Plata"
                  {...form.getInputProps('color')}
                />
              </Grid.Col>
            </Grid>
            
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Número de Serie (VIN)"
                  description="Opcional - Para mayor confianza"
                  placeholder="1HGBH41JXMN109186"
                  {...form.getInputProps('serialNumber')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Número de Motor"
                  description="Opcional"
                  placeholder="K20A3"
                  {...form.getInputProps('motorNumber')}
                />
              </Grid.Col>
            </Grid>
            
            <MultiSelect
              label="Características y Equipamiento"
              description="Selecciona todas las características que apliquen"
              placeholder="Buscar características..."
              data={commonFeatures}
              searchable
              {...form.getInputProps('features')}
            />
          </Stack>
        </Card>

        {/* Images Upload */}
        <ImageUploadSection onImagesChanged={handleImagesChanged} />

        {/* Location & Contact */}
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

        {/* Additional Options */}
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

        {/* Submit Buttons */}
        <Divider />
        <Group justify="flex-end">
          <Button
            type="submit"
            size="lg"
            loading={isSubmitting}
            leftSection={<IconCheck size={18} />}
            onClick={() => console.log('🖱️ Button clicked!')}
          >
            {isSubmitting ? 'Publicando...' : 'Publicar Anuncio'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}