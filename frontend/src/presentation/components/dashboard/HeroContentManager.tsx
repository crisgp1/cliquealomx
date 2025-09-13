'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Card,
  Badge,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  Switch,
  Paper,
  Alert,
  LoadingOverlay,
  Box,
  Image,
  SimpleGrid,
} from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconGripVertical,
  IconEye,
  IconEyeOff,
  IconAlertCircle,
  IconCheck,
  IconPhoto,
  IconUpload,
  IconX,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { useDisclosure, useListState } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import cx from 'clsx';
import classes from './HeroContentManager.module.css';

interface MediaFile {
  url: string;
  type: 'image' | 'video';
  filename: string;
  size: number;
}

interface HeroContent {
  _id: string;
  title: string;
  description: string;
  isActive: boolean;
  order: number;
  mediaFiles: MediaFile[];
  loopMedia: boolean;
  createdAt: string;
  updatedAt: string;
}

interface HeroContentForm {
  title: string;
  description: string;
  isActive: boolean;
  loopMedia: boolean;
}

interface SortableItemProps {
  content: HeroContent;
  onEdit: (content: HeroContent) => void;
  onDelete: (id: string, title: string) => void;
  onToggleActive: (id: string) => void;
  formatDate: (dateString: string) => string;
}

function SortableItem({ content, onEdit, onDelete, onToggleActive, formatDate }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: content._id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cx(classes.item, { [classes.itemDragging]: isDragging })}
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      {...attributes}
    >
      <Group justify="space-between" align="flex-start">
        {/* Drag Handle */}
        <div className={classes.dragHandle} {...listeners}>
          <IconGripVertical size={18} stroke={1.5} />
        </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Group justify="space-between" align="flex-start" mb="sm">
              <div style={{ flex: 1 }}>
                <Group gap="sm" mb="xs">
                  <Title order={4} size="h5" lineClamp={1}>
                    {content.title}
                  </Title>
                  <Badge
                    color={content.isActive ? 'green' : 'gray'}
                    variant="light"
                    size="sm"
                  >
                    {content.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </Group>
                <Text size="sm" c="dimmed" lineClamp={2} mb="xs">
                  {content.description}
                </Text>
                <Group gap="xs" align="center">
                  <Text size="xs" c="dimmed">
                    Actualizado: {formatDate(content.updatedAt)}
                  </Text>
                  {content.mediaFiles && content.mediaFiles.length > 0 && (
                    <Badge size="xs" variant="light" color="blue">
                      {content.mediaFiles.length} archivo{content.mediaFiles.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {content.loopMedia && (
                    <Badge size="xs" variant="light" color="green">
                      Loop
                    </Badge>
                  )}
                </Group>
              </div>
            </Group>
          </div>

          {/* Actions */}
          <Group gap="xs">
            <ActionIcon
              variant="light"
              color={content.isActive ? 'orange' : 'green'}
              onClick={() => onToggleActive(content._id)}
            >
              {content.isActive ? <IconEyeOff size={16} /> : <IconEye size={16} />}
            </ActionIcon>
            <ActionIcon
              variant="light"
              color="blue"
              onClick={() => onEdit(content)}
            >
              <IconEdit size={16} />
            </ActionIcon>
            <ActionIcon
              variant="light"
              color="red"
              onClick={() => onDelete(content._id, content.title)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        </Group>
    </Card>
  );
}

export function HeroContentManager() {
  const [heroContents, heroContentsHandlers] = useListState<HeroContent>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingContent, setEditingContent] = useState<HeroContent | null>(null);
  const [form, setForm] = useState<HeroContentForm>({
    title: '',
    description: '',
    isActive: true,
    loopMedia: true,
  });
  const [uploadedMedia, setUploadedMedia] = useState<MediaFile[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const loadHeroContents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/hero-content`);
      if (response.ok) {
        const data = await response.json();
        heroContentsHandlers.setState(data);
      } else {
        throw new Error('Failed to load hero contents');
      }
    } catch (error) {
      console.error('Error loading hero contents:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar los contenidos del hero',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHeroContents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo cargar una vez al montar el componente

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim() || !form.description.trim()) {
      notifications.show({
        title: 'Error',
        message: 'El título y la descripción son obligatorios',
        color: 'red',
      });
      return;
    }

    setSubmitting(true);
    try {
      const url = editingContent 
        ? `${API_URL}/hero-content/${editingContent._id}`
        : `${API_URL}/hero-content`;
      
      const method = editingContent ? 'PUT' : 'POST';
      
      const formData = {
        ...form,
        mediaFiles: uploadedMedia,
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        notifications.show({
          title: 'Éxito',
          message: editingContent 
            ? 'Contenido actualizado correctamente'
            : 'Contenido creado correctamente',
          color: 'green',
        });
        
        close();
        resetForm();
        loadHeroContents();
      } else {
        throw new Error('Failed to save content');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudo guardar el contenido',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (content: HeroContent) => {
    setEditingContent(content);
    setForm({
      title: content.title,
      description: content.description,
      isActive: content.isActive,
      loopMedia: content.loopMedia,
    });
    setUploadedMedia(content.mediaFiles || []);
    open();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/hero-content/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        notifications.show({
          title: 'Eliminado',
          message: 'Contenido eliminado correctamente',
          color: 'green',
        });
        loadHeroContents();
      } else {
        throw new Error('Failed to delete content');
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudo eliminar el contenido',
        color: 'red',
      });
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/hero-content/${id}/toggle`, {
        method: 'PUT',
      });

      if (response.ok) {
        notifications.show({
          title: 'Actualizado',
          message: 'Estado actualizado correctamente',
          color: 'green',
        });
        loadHeroContents();
      } else {
        throw new Error('Failed to toggle status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudo actualizar el estado',
        color: 'red',
      });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      }
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = heroContents.findIndex((item) => item._id === String(active.id));
    const newIndex = heroContents.findIndex((item) => item._id === String(over.id));

    // Update local state immediately for better UX using useListState
    heroContentsHandlers.setState(arrayMove(heroContents, oldIndex, newIndex));

    // Send new order to backend
    const newItems = arrayMove(heroContents, oldIndex, newIndex);
    const ids = newItems.map(item => item._id);

    try {
      await fetch(`${API_URL}/hero-content/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });
    } catch (error) {
      console.error('Error reordering:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudo actualizar el orden',
        color: 'red',
      });
      // Reload to get correct order
      loadHeroContents();
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      isActive: true,
      loopMedia: true,
    });
    setUploadedMedia([]);
    setEditingContent(null);
  };

  const handleMediaUpload = async (files: File[]) => {
    if (!files.length) return;

    const contentId = editingContent?._id || 'temp-' + Date.now();
    
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('media', file));
      formData.append('heroContentId', contentId);

      const response = await fetch(`${API_URL}/upload/hero-media`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const newMedia: MediaFile[] = result.mediaFiles.map((file: { url: string; mimeType: string; originalName: string; size: number }) => ({
          url: file.url,
          type: file.mimeType.startsWith('image/') ? 'image' : 'video',
          filename: file.originalName,
          size: file.size,
        }));
        
        setUploadedMedia(prev => [...prev, ...newMedia]);
        notifications.show({
          title: 'Éxito',
          message: 'Archivos multimedia subidos correctamente',
          color: 'green',
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudieron subir los archivos',
        color: 'red',
      });
    }
  };

  const handleRemoveMedia = (index: number) => {
    setUploadedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    close();
    resetForm();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Container size="xl">
      <LoadingOverlay visible={loading} />
      
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1} size="h2" mb="xs">
              Gestión de Contenido del Hero
            </Title>
            <Text size="lg" c="dimmed">
              Administra los textos dinámicos que aparecen en la sección principal de tu sitio web
            </Text>
          </div>
          <Button
            leftSection={<IconPlus size={18} />}
            onClick={open}
            size="lg"
            radius="md"
          >
            Agregar Contenido
          </Button>
        </Group>

        {/* Info Alert */}
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Información importante"
          color="blue"
        >
          Los contenidos activos se mostrarán de forma rotativa en el hero de tu sitio web. 
          Puedes arrastrar y soltar para cambiar el orden de aparición.
        </Alert>

        {/* Content List */}
        {heroContents.length === 0 ? (
          <Paper p="xl" withBorder radius="md" ta="center">
            <IconPhoto size={48} color="var(--mantine-color-gray-4)" style={{ margin: '0 auto 16px' }} />
            <Title order={3} c="dimmed" mb="xs">
              No hay contenidos
            </Title>
            <Text c="dimmed" mb="lg">
              Aún no has creado ningún contenido para el hero. ¡Comienza agregando tu primer texto!
            </Text>
            <Button onClick={open} leftSection={<IconPlus size={16} />}>
              Crear Primer Contenido
            </Button>
          </Paper>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={heroContents.map(content => content._id)}
              strategy={verticalListSortingStrategy}
            >
              <Stack gap="md">
                {heroContents.map((content) => (
                  <SortableItem
                    key={content._id}
                    content={content}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                    formatDate={formatDate}
                  />
                ))}
              </Stack>
            </SortableContext>
          </DndContext>
        )}
      </Stack>

      {/* Modal for Add/Edit */}
      <Modal
        opened={opened}
        onClose={handleClose}
        title={editingContent ? 'Editar Contenido' : 'Agregar Contenido'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Título"
              placeholder="Ej: Autos seminuevos, precios justos"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.currentTarget.value })}
              required
              maxLength={100}
            />
            
            <Textarea
              label="Descripción"
              placeholder="Ej: Compra y vende autos seminuevos de manera simple, transparente y sin complicaciones"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.currentTarget.value })}
              required
              minRows={3}
              maxLength={200}
            />
            
            <Switch
              label="Contenido activo"
              description="Los contenidos activos se mostrarán en el hero del sitio"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.currentTarget.checked })}
            />

            <Switch
              label="Reproducir multimedia en bucle"
              description="Los archivos multimedia se reproducirán automáticamente en bucle"
              checked={form.loopMedia}
              onChange={(e) => setForm({ ...form, loopMedia: e.currentTarget.checked })}
            />

            {/* Multimedia Upload Section */}
            <Box>
              <Text size="sm" fw={500} mb="xs">
                Archivos Multimedia
              </Text>
              <Text size="xs" c="dimmed" mb="md">
                Sube imágenes (JPG, PNG, WebP) o videos (MP4, MOV, AVI, MKV). Máximo 5 archivos.
              </Text>

              <Dropzone
                onDrop={handleMediaUpload}
                accept={{
                  ...IMAGE_MIME_TYPE,
                  'video/mp4': ['.mp4'],
                  'video/quicktime': ['.mov'],
                  'video/x-msvideo': ['.avi'],
                  'video/x-matroska': ['.mkv'],
                }}
                maxFiles={5}
                maxSize={50 * 1024 * 1024} // 50MB
              >
                <Group justify="center" gap="xl" mih={80} style={{ pointerEvents: 'none' }}>
                  <Dropzone.Accept>
                    <IconUpload size={50} color="var(--mantine-color-blue-6)" />
                  </Dropzone.Accept>
                  <Dropzone.Reject>
                    <IconX size={50} color="var(--mantine-color-red-6)" />
                  </Dropzone.Reject>
                  <Dropzone.Idle>
                    <IconPhoto size={50} color="var(--mantine-color-dimmed)" />
                  </Dropzone.Idle>

                  <div>
                    <Text size="xl" inline>
                      Arrastra archivos aquí o haz clic para seleccionar
                    </Text>
                    <Text size="sm" c="dimmed" inline mt={7}>
                      Cada archivo no debe exceder 50MB
                    </Text>
                  </div>
                </Group>
              </Dropzone>

              {/* Preview uploaded media */}
              {uploadedMedia.length > 0 && (
                <Box mt="md">
                  <Text size="sm" fw={500} mb="xs">
                    Archivos subidos ({uploadedMedia.length})
                  </Text>
                  <SimpleGrid cols={3} spacing="sm">
                    {uploadedMedia.map((media, index) => (
                      <Box key={index} style={{ position: 'relative' }}>
                        {media.type === 'image' ? (
                          <Image
                            src={media.url}
                            alt={media.filename}
                            height={80}
                            radius="sm"
                            fit="cover"
                          />
                        ) : (
                          <Box
                            style={{
                              height: 80,
                              backgroundColor: 'var(--mantine-color-gray-1)',
                              border: '1px solid var(--mantine-color-gray-3)',
                              borderRadius: 'var(--mantine-radius-sm)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexDirection: 'column',
                            }}
                          >
                            <IconPlayerPlay size={24} color="var(--mantine-color-gray-6)" />
                            <Text size="xs" c="dimmed" mt={4}>
                              Video
                            </Text>
                          </Box>
                        )}
                        <ActionIcon
                          color="red"
                          size="sm"
                          variant="filled"
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                          }}
                          onClick={() => handleRemoveMedia(index)}
                        >
                          <IconX size={12} />
                        </ActionIcon>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>
              )}
            </Box>

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={submitting}
                leftSection={<IconCheck size={16} />}
              >
                {editingContent ? 'Actualizar' : 'Crear'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}