import { useState, useEffect, useCallback } from 'react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconAlertCircle } from '@tabler/icons-react';

import { ListingService } from '@/application/services/listing.service';
import { ListingApiRepository } from '@/infrastructure/api/listing-api.repository';
import { Listing } from '@/domain/entities/listing.entity';
import { ListingFormDataVO, ListingFormFlatData } from '@/domain/value-objects/listing-form-data.vo';
import { ListingFormAdapter } from '@/application/adapters/listing-form.adapter';
import { FormValidationService } from '@/application/services/form-validation.service';
import { useListingsApi } from '@/hooks/useListingsApi';

interface UseListingEditorProps {
  listingId: string;
  onSuccess?: () => void;
}

export function useListingEditor({ listingId, onSuccess }: UseListingEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentImages, setCurrentImages] = useState<string[]>([]);

  const listingsApi = useListingsApi();

  // Static form with stable validation
  const validator = FormValidationService.createListingFormValidator();
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      title: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      price: 0,
      description: '',
      mileage: 0,
      fuelType: '',
      transmission: '',
      bodyType: '',
      color: '',
      serialNumber: '',
      motorNumber: '',
      city: '',
      state: '',
      phone: '',
      whatsapp: '',
      email: '',
      features: [],
      isFeatured: false,
    },
    validate: validator.toMantineValidation(),
  });

  const handleFormSubmit = useCallback(async (values: Record<string, unknown>) => {
    setIsSubmitting(true);

    try {
      const formData = ListingFormDataVO.fromFlatForm(values as unknown as ListingFormFlatData);
      const businessErrors = ListingFormAdapter.validateBusinessRules(formData);
      if (businessErrors.length > 0) {
        throw new Error(businessErrors.join(', '));
      }

      const updateData = ListingFormAdapter.toUpdateRequest(formData);

      const listingService = new ListingService(new ListingApiRepository(listingsApi));
      await listingService.updateListing(listingId, updateData);

      notifications.show({
        title: '¡Anuncio actualizado exitosamente!',
        message: 'Los cambios han sido guardados correctamente.',
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      onSuccess?.();
    } catch (error) {
      notifications.show({
        title: 'Error al actualizar',
        message: error instanceof Error ? error.message : 'Ocurrió un error al actualizar tu anuncio.',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [listingId, listingsApi, onSuccess]);

  const handleSubmit = form.onSubmit(handleFormSubmit);

  // Load listing data only once
  useEffect(() => {
    let isMounted = true;

    const loadListing = async () => {
      try {
        setLoading(true);
        setError(null);

        const listingService = new ListingService(new ListingApiRepository(listingsApi));
        const listingEntity = await listingService.getListing(listingId);

        if (!isMounted) return;

        setListing(listingEntity);
        setCurrentImages(listingEntity.images);

        // Initialize form data once using initialize to prevent re-renders
        const formData = ListingFormAdapter.fromEntity(listingEntity);
        form.initialize(formData.toFlatForm() as unknown as typeof form.values);

      } catch (err) {
        if (!isMounted) return;

        setError(err instanceof Error ? err.message : 'Could not load listing');
        notifications.show({
          title: 'Error al cargar',
          message: 'No se pudo cargar el anuncio',
          color: 'red',
          icon: <IconAlertCircle size={16} />,
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadListing();

    return () => {
      isMounted = false;
    };
  }, [listingId, form, listingsApi]);

  const handleImagesUploaded = useCallback((urls: string[]) => {
    setCurrentImages(prev => [...prev, ...urls]);
  }, []);

  const handleImagesChanged = useCallback((images: string[]) => {
    setCurrentImages(images);
  }, []);

  const retry = useCallback(() => {
    window.location.reload();
  }, []);

  return {
    loading,
    error,
    listing,
    isSubmitting,
    currentImages,
    form,
    handleSubmit,
    handleImagesUploaded,
    handleImagesChanged,
    retry,
  };
}