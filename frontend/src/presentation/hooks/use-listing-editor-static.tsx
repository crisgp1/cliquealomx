import { useState, useEffect, useCallback, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconAlertCircle } from '@tabler/icons-react';

import { ListingService } from '@/application/services/listing.service';
import { ListingApiRepository } from '@/infrastructure/api/listing-api.repository';
import { Listing } from '@/domain/entities/listing.entity';
import { ListingFormDataVO, ListingFormFlatData } from '@/domain/value-objects/listing-form-data.vo';
import { ListingFormAdapter } from '@/application/adapters/listing-form.adapter';
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
  const [formData, setFormData] = useState<Record<string, unknown>>({
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
  });

  const listingsApi = useListingsApi();

  const handleInputChange = useCallback((field: string, value: unknown) => {
    setFormData((prev: Record<string, unknown>) => {
      if (prev[field] === value) {
        return prev; // Prevent unnecessary updates
      }
      return { ...prev, [field]: value };
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataVO = ListingFormDataVO.fromFlatForm(formData as unknown as ListingFormFlatData);
      const businessErrors = ListingFormAdapter.validateBusinessRules(formDataVO);
      if (businessErrors.length > 0) {
        throw new Error(businessErrors.join(', '));
      }

      const updateData = ListingFormAdapter.toUpdateRequest(formDataVO);
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
  }, [formData, listingId, listingsApi, onSuccess]);

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
        // Convert to CDN URLs to avoid CORS issues
        const cdnImages = listingEntity.images.map(url =>
          url.replace(
            'https://cliquealo-blob.sfo3.digitaloceanspaces.com',
            'https://cliquealo-blob.sfo3.cdn.digitaloceanspaces.com'
          )
        );
        setCurrentImages(cdnImages);

        // Set form data once
        const initialFormData = ListingFormAdapter.fromEntity(listingEntity);
        setFormData(initialFormData.toFlatForm() as unknown as Record<string, unknown>);

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
  }, [listingId, listingsApi]);

  const handleImagesUploaded = useCallback((urls: string[]) => {
    setCurrentImages(prev => [...prev, ...urls]);
  }, []);

  const handleImagesChanged = useCallback((images: string[]) => {
    setCurrentImages((prev) => {
      // Only update if images have actually changed
      if (JSON.stringify(prev) === JSON.stringify(images)) {
        return prev;
      }
      return images;
    });
  }, []);

  const retry = useCallback(() => {
    window.location.reload();
  }, []);

  const memoizedReturn = useMemo(() => ({
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
  }), [
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
  ]);

  return memoizedReturn;
}