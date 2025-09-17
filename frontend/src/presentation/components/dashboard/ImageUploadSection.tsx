'use client';

import { useState, useEffect } from 'react';
import {
  Image,
  SimpleGrid,
  ActionIcon,
  Paper,
  Text,
  Group,
  Progress,
  Alert,
  Badge,
  Loader,
  Center,
} from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE, FileWithPath, FileRejection } from '@mantine/dropzone';
import { IconUpload, IconX, IconPhoto, IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@clerk/nextjs';
import { SafeImage } from '../common/SafeImage';

interface ImageUploadSectionProps {
  listingId?: string; // Solo para edición
  existingImages?: string[]; // Imágenes ya existentes
  onImagesUploaded?: (urls: string[]) => void;
  onImagesChanged?: (images: string[]) => void; // Para sincronizar estado
}

interface PendingImage {
  file: FileWithPath;
  preview: string;
}

export function ImageUploadSection({ 
  listingId, 
  existingImages = [], 
  onImagesUploaded, 
  onImagesChanged 
}: ImageUploadSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>(existingImages);
  const { getToken } = useAuth();

  // Exponer imágenes pendientes globalmente para el flujo de creación
  useEffect(() => {
    if (!listingId && pendingImages.length > 0) {
      (window as unknown as { pendingImageFiles?: File[] }).pendingImageFiles = pendingImages.map(img => img.file);
    }
  }, [pendingImages, listingId]);

  // Sincronizar cambios de imágenes con el componente padre
  useEffect(() => {
    const allImages = [...uploadedImages];
    if (onImagesChanged) {
      onImagesChanged(allImages);
    }
  }, [uploadedImages, onImagesChanged]);

  // Actualizar imágenes existentes solo en el montaje inicial
  useEffect(() => {
    if (existingImages && existingImages.length > 0) {
      setUploadedImages(existingImages);
    }
  }, [existingImages]);

  const validateFiles = (files: FileWithPath[]): FileWithPath[] => {
    const validFiles: FileWithPath[] = [];

    files.forEach(file => {
      // Validar tamaño (5MB max) - el tipo ya es validado por Dropzone
      if (file.size > 5 * 1024 * 1024) {
        notifications.show({
          title: 'Error de tamaño',
          message: `${file.name} excede el tamaño máximo de 5MB`,
          color: 'red',
          icon: <IconAlertCircle size={16} />,
        });
        return;
      }

      validFiles.push(file);
    });

    return validFiles;
  };

  const handleFileDrop = async (files: FileWithPath[]) => {
    if (!files || files.length === 0) return;

    // Verificar límite total de imágenes
    const totalImages = uploadedImages.length + pendingImages.length + files.length;
    if (totalImages > 10) {
      notifications.show({
        title: 'Límite excedido',
        message: `Solo puedes subir máximo 10 imágenes. Actualmente tienes ${uploadedImages.length + pendingImages.length}.`,
        color: 'orange',
      });
      return;
    }

    const validFiles = validateFiles(files);
    if (validFiles.length === 0) return;

    // Crear previews locales
    const newPendingImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setPendingImages(prev => [...prev, ...newPendingImages]);

    // Si es modo edición y ya tenemos un listingId, subir inmediatamente
    if (listingId) {
      await uploadImages(validFiles, listingId);
    }
  };

  const uploadImages = async (files: FileWithPath[], carId: string) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });
      formData.append('carId', carId);

      // Obtener token de Clerk para autenticación
      const token = await getToken();

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/upload/car-images`, {
        method: 'POST',
        body: formData,
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al subir imágenes');
      }

      const result = await response.json();

      // Obtener URLs de las imágenes subidas
      const uploadedUrls = result.images?.map((img: { url: string }) => img.url) || [];
      
      setUploadedImages(prev => [...prev, ...uploadedUrls]);

      // Remover imágenes pendientes que se subieron exitosamente
      setPendingImages(prev => 
        prev.filter(pending => !files.includes(pending.file))
      );

      if (onImagesUploaded) {
        onImagesUploaded(uploadedUrls);
      }

      notifications.show({
        title: '¡Imágenes subidas!',
        message: `${files.length} imagen(es) subidas correctamente`,
        color: 'green',
      });

    } catch (error) {
      console.error('Error uploading images:', error);
      notifications.show({
        title: 'Error al subir imágenes',
        message: error instanceof Error ? error.message : 'No se pudieron subir las imágenes. Intenta nuevamente.',
        color: 'red',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removePendingImage = (index: number) => {
    setPendingImages(prev => {
      const newPending = prev.filter((_, i) => i !== index);
      // Limpiar URL de preview para evitar memory leaks
      URL.revokeObjectURL(prev[index].preview);
      return newPending;
    });
  };

  const removeUploadedImage = async (index: number) => {
    // TODO: Implementar eliminación de imagen del servidor si es necesario
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    
    notifications.show({
      title: 'Imagen eliminada',
      message: 'La imagen ha sido removida de tu anuncio',
      color: 'blue',
    });
  };

  const handleReject = (fileRejections: FileRejection[]) => {
    fileRejections.forEach(({ file }) => {
      notifications.show({
        title: 'Archivo rechazado',
        message: `${file.name} no es compatible o es muy grande`,
        color: 'red',
      });
    });
  };

  const totalImages = uploadedImages.length + pendingImages.length;
  const canUploadMore = totalImages < 10;

  return (
    <Paper p="lg" withBorder radius="md">
      <Group mb="md" align="flex-start">
        <IconPhoto size={24} color="var(--mantine-color-blue-6)" />
        <div style={{ flex: 1 }}>
          <Text fw={600} size="lg">Fotografías del vehículo</Text>
          <Text size="sm" c="dimmed" mb="xs">
            Sube hasta 10 fotos de tu auto. La primera será la imagen principal.
          </Text>
          <Badge variant="light" color="blue" size="sm">
            {totalImages}/10 imágenes
          </Badge>
        </div>
      </Group>

      <Dropzone
        onDrop={handleFileDrop}
        onReject={handleReject}
        maxSize={5 * 1024 * 1024} // 5MB
        accept={IMAGE_MIME_TYPE}
        multiple
        loading={uploading}
        disabled={!canUploadMore}
        styles={{
          root: {
            backgroundColor: canUploadMore 
              ? 'var(--mantine-color-gray-0)' 
              : 'var(--mantine-color-gray-2)',
          },
        }}
      >
        <Group justify="center" gap="xl" mih={120} style={{ pointerEvents: 'none' }}>
          <Dropzone.Accept>
            <IconUpload 
              size={40} 
              color="var(--mantine-color-blue-6)" 
              stroke={1.5} 
            />
          </Dropzone.Accept>
          
          <Dropzone.Reject>
            <IconX 
              size={40} 
              color="var(--mantine-color-red-6)" 
              stroke={1.5} 
            />
          </Dropzone.Reject>
          
          <Dropzone.Idle>
            <IconPhoto 
              size={40} 
              color={canUploadMore ? "var(--mantine-color-dimmed)" : "var(--mantine-color-gray-5)"} 
              stroke={1.5} 
            />
          </Dropzone.Idle>

          <div style={{ textAlign: 'center' }}>
            <Text size="lg" fw={500} mb={4}>
              {canUploadMore 
                ? "Arrastra imágenes aquí o haz clic para seleccionar"
                : "Límite de 10 imágenes alcanzado"
              }
            </Text>
            <Text size="sm" c="dimmed">
              {canUploadMore 
                ? "Puedes subir hasta 10 imágenes, máximo 5MB cada una"
                : `Tienes ${totalImages}/10 imágenes. Elimina algunas para agregar más.`
              }
            </Text>
          </div>
        </Group>
      </Dropzone>

      {uploading && (
        <Alert color="blue" mt="md">
          <Group>
            <Loader size="sm" />
            <div style={{ flex: 1 }}>
              <Text size="sm">Subiendo imágenes...</Text>
              {uploadProgress > 0 && (
                <Progress value={uploadProgress} size="sm" mt="xs" />
              )}
            </div>
          </Group>
        </Alert>
      )}

      {(uploadedImages.length > 0 || pendingImages.length > 0) && (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md" mt="md">
          {/* Imágenes ya subidas */}
          {uploadedImages.map((url, index) => (
            <Paper key={`uploaded-${index}`} radius="md" withBorder p={0} style={{ position: 'relative' }}>
              <SafeImage
                src={url}
                alt={`Imagen ${index + 1}`}
                className="h-32 rounded-md"
              />
              
              {/* Badge de imagen principal */}
              {index === 0 && (
                <Badge
                  color="blue"
                  size="xs"
                  style={{ position: 'absolute', bottom: 8, left: 8 }}
                >
                  Principal
                </Badge>
              )}
              
              {/* Botón eliminar */}
              <ActionIcon
                color="red"
                variant="filled"
                size="sm"
                radius="xl"
                style={{ position: 'absolute', top: 8, right: 8 }}
                onClick={() => removeUploadedImage(index)}
              >
                <IconX size={14} />
              </ActionIcon>
            </Paper>
          ))}

          {/* Imágenes pendientes de subir */}
          {pendingImages.map((pending, index) => (
            <Paper 
              key={`pending-${index}`} 
              radius="md" 
              withBorder 
              p={0} 
              style={{ position: 'relative', opacity: listingId ? 0.7 : 1 }}
            >
              <Image
                src={pending.preview}
                height={120}
                alt={`Preview ${index + 1}`}
                radius="md"
                fit="cover"
              />
              
              {/* Badge de pendiente */}
              {!listingId && (
                <Badge
                  color="orange"
                  size="xs"
                  style={{ position: 'absolute', bottom: 8, left: 8 }}
                >
                  Pendiente
                </Badge>
              )}
              
              {/* Badge de imagen principal si es la primera */}
              {(uploadedImages.length === 0 && index === 0) && (
                <Badge
                  color="blue"
                  size="xs"
                  style={{ position: 'absolute', bottom: 8, right: 8 }}
                >
                  Principal
                </Badge>
              )}
              
              {/* Botón eliminar */}
              <ActionIcon
                color="red"
                variant="filled"
                size="sm"
                radius="xl"
                style={{ position: 'absolute', top: 8, right: 8 }}
                onClick={() => removePendingImage(index)}
              >
                <IconX size={14} />
              </ActionIcon>
            </Paper>
          ))}
        </SimpleGrid>
      )}

      {totalImages === 0 && (
        <Center h={120} mt="md">
          <div style={{ textAlign: 'center' }}>
            <IconPhoto size={48} color="var(--mantine-color-gray-4)" />
            <Text size="sm" c="dimmed" mt="xs">
              No hay imágenes seleccionadas
            </Text>
          </div>
        </Center>
      )}

      <Alert icon={<IconPhoto size={16} />} color="blue" variant="light" mt="md">
        <Text size="xs">
          <strong>Recomendaciones para mejores fotos:</strong>
        </Text>
        <Text size="xs" mt={4}>
          • Formatos aceptados: JPG, PNG, WebP (máx. 5MB por imagen)<br />
          • Toma fotos en buena iluminación y diferentes ángulos<br />
          • Incluye exterior, interior, motor y documentos si es posible<br />
          • La primera imagen aparecerá como foto principal del anuncio
        </Text>
      </Alert>

      {!listingId && pendingImages.length > 0 && (
        <Alert icon={<IconAlertCircle size={16} />} color="orange" variant="light" mt="sm">
          <Text size="xs">
            Las imágenes se subirán después de crear el anuncio.
          </Text>
        </Alert>
      )}
    </Paper>
  );
}