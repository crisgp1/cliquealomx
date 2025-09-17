import { notifications } from '@mantine/notifications';

interface UploadResult {
  url: string;
  thumbnailUrl?: string;
}

export class ImageUploadUtil {
  static async uploadPendingImages(carId: string): Promise<string[]> {
    const pendingFiles = (window as unknown as { pendingImageFiles?: File[] }).pendingImageFiles || [];

    if (pendingFiles.length === 0) {
      return [];
    }

    try {
      console.log(`🖼️ Uploading ${pendingFiles.length} pending images for car ${carId}`);

      const formData = new FormData();
      pendingFiles.forEach(file => {
        formData.append('images', file);
      });
      formData.append('carId', carId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al subir imágenes');
      }

      const result = await response.json();
      const uploadedUrls = result.images?.map((img: UploadResult) => img.url) || [];

      // Limpiar archivos pendientes
      (window as unknown as { pendingImageFiles?: File[] }).pendingImageFiles = undefined;

      console.log(`✅ Successfully uploaded ${uploadedUrls.length} images`);

      notifications.show({
        title: 'Imágenes subidas',
        message: `${uploadedUrls.length} imagen(es) subidas correctamente`,
        color: 'green',
      });

      return uploadedUrls;

    } catch (error) {
      console.error('❌ Error uploading pending images:', error);

      notifications.show({
        title: 'Error al subir imágenes',
        message: 'Las imágenes no se pudieron subir. Puedes intentar editando el anuncio.',
        color: 'orange',
      });

      return [];
    }
  }

  static clearPendingImages(): void {
    (window as unknown as { pendingImageFiles?: File[] }).pendingImageFiles = undefined;
  }

  static hasPendingImages(): boolean {
    const pendingFiles = (window as unknown as { pendingImageFiles?: File[] }).pendingImageFiles || [];
    return pendingFiles.length > 0;
  }

  static getPendingImagesCount(): number {
    const pendingFiles = (window as unknown as { pendingImageFiles?: File[] }).pendingImageFiles || [];
    return pendingFiles.length;
  }
}