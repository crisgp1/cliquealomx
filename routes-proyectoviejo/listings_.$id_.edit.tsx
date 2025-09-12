import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node"
import { useActionData, Link, useNavigation, useLoaderData, useSubmit } from "@remix-run/react"
import { ListingModel } from "~/models/Listing.server"
import { requireClerkAdmin } from "~/lib/auth-clerk.server"
import { HeroCarListingForm } from "~/components/forms/HeroCarListingForm"
import { useState, useEffect } from 'react'
import { motion } from "framer-motion"
import { 
  CheckCircle,
  AlertCircle,
  Sparkles,
  Edit3,
  Home,
  Eye
} from 'lucide-react'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Breadcrumbs,
  BreadcrumbItem,
  Avatar
} from "@heroui/react"
import { AnimationProvider } from "~/components/AnimationProvider"
import { toast } from "~/components/ui/toast"

// 🌐 Configuración de textos en español para la página
const PAGE_TEXTS = {
  header: {
    title: "Editar Vehículo",
    subtitle: "Actualiza la información de tu anuncio para atraer más compradores"
  },
  messages: {
    success: "¡Listing actualizado exitosamente!",
    error: "Error al actualizar el listado"
  },
  dialog: {
    title: "¡Actualización Exitosa!",
    description: "Los cambios se han guardado exitosamente. Tu anuncio actualizado ya está disponible para los compradores.",
    viewListing: "Ver Listado",
    continueEditing: "Continuar editando"
  },
  breadcrumbs: {
    home: "Inicio",
    listing: "Listing",
    edit: "Editar"
  }
} as const

export async function loader(args: LoaderFunctionArgs) {
  const { params, request } = args;
  const user = await requireClerkAdmin(args)
  
  const listingId = params.id
  if (!listingId) {
    throw new Response("Not Found", { status: 404 })
  }
  
  const listing = await ListingModel.findById(listingId)
  if (!listing) {
    throw new Response("Listing no encontrado", { status: 404 })
  }
  
  // Verificar que el usuario sea el dueño del listing O sea admin/superadmin
  const isOwner = await ListingModel.isOwner(listingId, user._id!.toString())
  const isAdminOrSuperAdmin = user.role === 'admin' || user.role === 'superadmin'
  
  if (!isOwner && !isAdminOrSuperAdmin) {
    throw new Response("No autorizado", { status: 403 })
  }
  
  return json({ listing, user })
}

export async function action(args: ActionFunctionArgs) {
  const { params, request } = args;
  const user = await requireClerkAdmin(args)
  const listingId = params.id
  
  if (!listingId) {
    throw new Response("Not Found", { status: 404 })
  }
  
  // Verificar que el usuario sea el dueño del listing O sea admin/superadmin
  const isOwner = await ListingModel.isOwner(listingId, user._id!.toString())
  const isAdminOrSuperAdmin = user.role === 'admin' || user.role === 'superadmin'
  
  if (!isOwner && !isAdminOrSuperAdmin) {
    throw new Response("No autorizado", { status: 403 })
  }
  
  const formData = await request.formData()
  
  // Extract form data
  const make = formData.get("make") as string
  const customMake = formData.get("customMake") as string
  const model = formData.get("model") as string
  const year = parseInt(formData.get("year") as string)
  const price = parseFloat(formData.get("price") as string)
  const mileage = parseFloat(formData.get("mileage") as string)
  const fuelTypeValue = formData.get("fuelType") as string
  const transmissionValue = formData.get("transmission") as string
  const locationValue = formData.get("location") as string
  const description = formData.get("description") as string
  const contactPhone = formData.get("contactPhone") as string
  const contactWhatsapp = formData.get("contactWhatsapp") as string
  const contactEmail = formData.get("contactEmail") as string
  const images = formData.get("images") as string
  const videos = formData.get("videos") as string
  const mediaData = formData.get("mediaData") as string
  const serialNumber = formData.get("serialNumber") as string
  const motorNumber = formData.get("motorNumber") as string
  const repuveDocument = formData.get("repuveDocument") as string
  
  // Convert to expected types for the model
  const fuelType = fuelTypeValue as "gasolina" | "diesel" | "hibrido" | "electrico" | undefined
  const transmission = transmissionValue as "manual" | "automatico" | undefined
  const location = locationValue ? {
    city: locationValue.split(',')[0]?.trim() || "",
    state: locationValue.split(',')[1]?.trim() || ""
  } : undefined
  
  const contactInfo = {
    phone: contactPhone,
    whatsapp: contactWhatsapp,
    email: contactEmail
  }
  
  // Determinar la marca final a usar
  const finalMake = make === "other" ? customMake : make
  const title = `${year} ${finalMake} ${model}`
  
  // Validaciones
  if (!make || !model || !year || !price) {
    return json({ error: "Marca, modelo, año y precio son requeridos" }, { status: 400 })
  }
  
  // Validar marca personalizada si se seleccionó "Otra"
  if (make === "other" && !customMake) {
    return json({ error: "Debes especificar la marca del vehículo" }, { status: 400 })
  }
  
  if (year < 1900 || year > new Date().getFullYear() + 1) {
    return json({ error: "Año inválido" }, { status: 400 })
  }
  
  if (price < 0) {
    return json({ error: "El precio debe ser mayor a 0" }, { status: 400 })
  }
  
  try {
    const imageUrls = images
      ? images.split(',').map(url => url.trim()).filter(Boolean)
      : []
    
    const videoUrls = videos
      ? videos.split(',').map(url => url.trim()).filter(Boolean)
      : []
    
    // Procesar mediaData si está disponible
    let mediaFiles = undefined
    if (mediaData) {
      try {
        const parsedMediaData = JSON.parse(mediaData)
        if (Array.isArray(parsedMediaData)) {
          mediaFiles = parsedMediaData.map(item => ({
            id: item.id || `${item.type}-${Date.now()}-${Math.random()}`,
            url: item.url,
            type: item.type,
            name: item.name,
            size: item.size,
            uploadedAt: item.uploadedAt ? new Date(item.uploadedAt) : new Date()
          }))
        }
      } catch (error) {
        console.error('Error parsing mediaData:', error)
      }
    }
    
    const updateData: any = {
      title,
      description: description?.trim() || "",
      brand: finalMake.trim(),
      model: model.trim(),
      year,
      price,
      mileage,
      fuelType,
      transmission,
      location,
      contactInfo,
      images: imageUrls,
      videos: videoUrls,
      serialNumber: serialNumber?.trim() || undefined,
      motorNumber: motorNumber?.trim() || undefined
    }
    
    // Solo agregar media si se procesó correctamente
    if (mediaFiles) {
      updateData.media = mediaFiles
    }
    
    // Handle REPUVE document if provided
    if (repuveDocument?.trim()) {
      const existingListing = await ListingModel.findById(listingId)
      const vehicleDocuments = existingListing?.vehicleDocuments || []
      
      // Remove existing REPUVE document if any
      const filteredDocs = vehicleDocuments.filter(doc => doc.type !== 'repuve')
      
      // Add new REPUVE document
      filteredDocs.push({
        id: `repuve_${Date.now()}`,
        name: repuveDocument.trim(),
        type: 'repuve',
        url: repuveDocument.trim(), // TODO: This should be the actual uploaded file URL
        uploadedAt: new Date(),
        notes: 'Documento REPUVE actualizado'
      })
      
      updateData.vehicleDocuments = filteredDocs
    }
    
    const success = await ListingModel.update(listingId, updateData)
    
    if (!success) {
      return json({ error: "Error al actualizar la publicación" }, { status: 500 })
    }
    
    return json({ 
      success: true, 
      message: "¡Listing actualizado exitosamente!",
      listingId 
    })
  } catch (error) {
    console.error(error)
    return json({ error: "Error al actualizar la publicación" }, { status: 500 })
  }
}

export default function EditListing() {
  const { listing, user } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const submit = useSubmit()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [formStatus, setFormStatus] = useState<"idle" | "success" | "error">("idle")
  
  const isSubmitting = navigation.state === "submitting"
  
  // Función para manejar envío del formulario
  const handleSubmit = (data: any) => {
    const formData = new FormData()
    
    // Agregar todos los campos del formulario
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === "media" && Array.isArray(value)) {
          // El MediaUpload component ya maneja correctamente tanto imágenes existentes como nuevas
          // Separar imágenes y videos del array de media, preservando IDs
          const images = value.filter(item => item.type === 'image').map(item => item.url)
          const videos = value.filter(item => item.type === 'video').map(item => item.url)
          
          // Enviar la información completa de media para preservar IDs y metadatos
          formData.append("mediaData", JSON.stringify(value))
          formData.append("images", images.join(','))
          formData.append("videos", videos.join(','))
        } else if (key !== "media" && key !== "images" && key !== "videos" && key !== "mediaData") {
          // Excluir campos que ya se procesan arriba
          formData.append(key, String(value))
        }
      }
    })
    
    // Enviar el formulario
    submit(formData, { method: "post" })
  }
  
  useEffect(() => {
    if (actionData) {
      if ('success' in actionData && actionData.success) {
        setFormStatus("success")
        onOpen()
        toast.success("¡Listing actualizado exitosamente!")
      } else if ('error' in actionData) {
        setFormStatus("error")
        toast.error(actionData.error || PAGE_TEXTS.messages.error)
      }
    }
  }, [actionData, onOpen])

  useEffect(() => {
    if (isSubmitting) {
      setFormStatus("idle")
    }
  }, [isSubmitting])

  // Preparar valores por defecto para el formulario
  const defaultValues = {
    make: listing.brand || "",
    model: listing.model || "",
    year: listing.year || new Date().getFullYear(),
    price: listing.price || 0,
    mileage: listing.mileage || 0,
    condition: "used" as const,
    fuelType: listing.fuelType || "",
    transmission: listing.transmission || "",
    description: listing.description || "",
    location: listing.location ? `${listing.location.city}, ${listing.location.state}` : "",
    contactPhone: listing.contactInfo?.phone || "",
    contactWhatsapp: listing.contactInfo?.whatsapp || "",
    contactEmail: listing.contactInfo?.email || "",
    images: listing.images || [],
    media: listing.media ? listing.media.map(mediaFile => ({
      id: mediaFile.id,
      url: mediaFile.url,
      type: mediaFile.type,
      name: mediaFile.name,
      size: mediaFile.size
    })) : [
      // Fallback para listings antiguos sin campo media
      ...(listing.images || []).map((url, index) => ({
        id: `existing-image-${index}`,
        url,
        type: 'image' as const
      })),
      ...(listing.videos || []).map((url, index) => ({
        id: `existing-video-${index}`,
        url,
        type: 'video' as const
      }))
    ]
  }

  return (
    <AnimationProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        {/* Header moderno con HeroUI */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-40"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Breadcrumbs */}
              <Breadcrumbs 
                size="lg"
                classNames={{
                  list: "gap-2",
                }}
              >
                <BreadcrumbItem 
                  href="/"
                  startContent={<Home className="w-4 h-4" />}
                >
                  {PAGE_TEXTS.breadcrumbs.home}
                </BreadcrumbItem>
                <BreadcrumbItem href={`/listings/${listing._id}`}>
                  {PAGE_TEXTS.breadcrumbs.listing}
                </BreadcrumbItem>
                <BreadcrumbItem>
                  {PAGE_TEXTS.breadcrumbs.edit}
                </BreadcrumbItem>
              </Breadcrumbs>

              {/* User info */}
              <div className="flex items-center space-x-3">
                <Chip 
                  color={user.role === "admin" ? "primary" : "secondary"}
                  variant="flat"
                  size="sm"
                  startContent={<Edit3 className="w-3 h-3" />}
                >
                  Editando
                </Chip>
                <Avatar
                  size="sm"
                  name={user.name}
                  classNames={{
                    base: "bg-gradient-to-br from-blue-500 to-purple-500",
                    name: "text-white font-medium"
                  }}
                />
              </div>
            </div>
          </div>
        </motion.header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Edit3 className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              {PAGE_TEXTS.header.title}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {PAGE_TEXTS.header.subtitle}
            </p>
          </motion.div>

          {/* Mensajes de estado */}
          {actionData && 'error' in actionData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6"
            >
              <Card className="bg-danger-50 border-danger-200">
                <CardBody className="flex flex-row items-center gap-3 p-4">
                  <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0" />
                  <p className="text-danger-700 font-medium">{actionData.error}</p>
                </CardBody>
              </Card>
            </motion.div>
          )}

          {/* Formulario HeroUI */}
          <HeroCarListingForm
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
            status={formStatus}
            defaultValues={defaultValues}
          />

          {/* Modal de éxito */}
          <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            size="md"
            classNames={{
              backdrop: "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20"
            }}
          >
            <ModalContent>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-success-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {PAGE_TEXTS.dialog.title}
                  </h3>
                </div>
              </ModalHeader>
              <ModalBody>
                <p className="text-gray-600 text-base">
                  {PAGE_TEXTS.dialog.description}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button 
                  variant="light" 
                  onPress={onClose}
                  className="text-gray-600"
                >
                  {PAGE_TEXTS.dialog.continueEditing}
                </Button>
                {actionData && 'listingId' in actionData && (
                  <Button 
                    color="primary" 
                    as={Link}
                    href={`/listings/${actionData.listingId}`}
                    startContent={<Eye className="w-4 h-4" />}
                  >
                    {PAGE_TEXTS.dialog.viewListing}
                  </Button>
                )}
              </ModalFooter>
            </ModalContent>
          </Modal>
        </main>
      </div>
    </AnimationProvider>
  )
}