'use client';

import { IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

import { useListingEditor } from '@/presentation/hooks/use-listing-editor-static';
import { ImageUploadSection } from './ImageUploadSection';
import { VehicleIdentitySection } from '../forms/VehicleIdentitySectionStatic';
import { VehicleSpecsSection } from '../forms/VehicleSpecsSectionStatic';
import { ContactLocationSection } from '../forms/ContactLocationSectionStatic';

interface EditListingFormProps {
  listingId: string;
}

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
  'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
].map(state => ({ value: state.toLowerCase().replace(/\s+/g, '_'), label: state }));

const COMMON_FEATURES = [
  'Aire Acondicionado', 'Dirección Hidráulica', 'Bolsas de Aire', 'ABS',
  'Frenos de Disco', 'Vidrios Eléctricos', 'Seguros Eléctricos', 'Espejos Eléctricos',
  'Radio AM/FM', 'CD/DVD', 'Bluetooth', 'USB', 'Cámara Trasera', 'GPS',
  'Sensores de Estacionamiento', 'Alarma', 'Rines de Aleación', 'Llantas Nuevas',
  'Tapicería de Piel', 'Quemacocos', 'Control de Crucero', 'Computadora de Viaje'
];

export function EditListingForm({ listingId }: EditListingFormProps) {
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

  if (loading) {
    return (
      <div className="border rounded-lg p-8 bg-white min-h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos del anuncio...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="border rounded-lg p-6 bg-red-50 border-red-200">
        <div className="flex items-start space-x-3">
          <IconAlertCircle size={20} className="text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-red-800 font-medium">Error al cargar el anuncio</h3>
            <p className="text-red-700 mt-1">{error || 'No se pudo cargar el anuncio. Por favor intenta nuevamente.'}</p>
            <div className="mt-4 space-x-3">
              <button
                onClick={retry}
                className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
              >
                Reintentar
              </button>
              <button
                onClick={() => router.push('/dashboard/listings')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Volver a mis anuncios
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <VehicleIdentitySection
        formData={formData}
        handleInputChange={handleInputChange}
        carBrands={CAR_BRANDS}
      />

      <VehicleSpecsSection
        formData={formData}
        handleInputChange={handleInputChange}
        fuelTypes={FUEL_TYPES}
        transmissionTypes={TRANSMISSION_TYPES}
        bodyTypes={BODY_TYPES}
        commonFeatures={COMMON_FEATURES}
      />

      <ImageUploadSection
        listingId={listingId}
        existingImages={currentImages}
        onImagesUploaded={handleImagesUploaded}
        onImagesChanged={handleImagesChanged}
      />

      <ContactLocationSection
        formData={formData}
        handleInputChange={handleInputChange}
        mexicanStates={MEXICAN_STATES}
      />

      <div className="border-t pt-6">
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => router.push('/dashboard/listings')}
            disabled={isSubmitting}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 text-lg"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Guardando cambios...</span>
              </>
            ) : (
              <>
                <IconCheck size={18} />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}