import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "@remix-run/node"
import { useLoaderData, Link, Form, useNavigation, useFetcher } from "@remix-run/react"
type ActionResponse = { success?: boolean; action?: 'liked' | 'unliked'; error?: string }
import { formatPrice, formatMileage } from '~/utils/formatters'
import { 
  generateCarListingMeta, 
  generateCarListingJsonLd,
  DEFAULT_SEO
} from "~/lib/seo"
import { ListingModel } from "~/models/Listing.server"
import { UserModel } from "~/models/User.server"
import { BankPartnerModel } from "~/models/BankPartner.server"
import { getClerkUser, ClerkAuth, getClerkUserInfo } from "~/lib/auth-clerk.server"
import { toast } from "~/components/ui/toast"
import { getHotStatus, type Listing } from "~/models/Listing"
import { capitalizeBrandInTitle } from "~/lib/utils"
import { SimpleLightbox, useSimpleLightbox, type MediaItem } from "~/components/ui/simple-lightbox"
import { OptimizedCarousel } from "~/components/lazy"
import {
  ArrowLeft,
  Heart,
  Share2,
  Eye,
  Calendar,
  MapPin,
  Phone,
  MessageCircle,
  Edit,
  Trash2,
  Car,
  Fuel,
  Gauge,
  Palette,
  Settings,
  Star,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Calculator,
  CreditCard,
  DollarSign,
  TrendingUp,
  FileText,
  Home,
  Receipt,
  CheckCircle,
  ArrowRight,
  X,
  Building
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  Badge,
  Divider,
  Spacer,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Progress,
  Tabs,
  Tab
} from "@heroui/react"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data || !data.listing) {
    return generateCarListingMeta({
      title: "Auto no encontrado | Cliquéalo.mx",
      description: "El auto que buscas no se encuentra disponible o ha sido eliminado.",
      url: `${DEFAULT_SEO.url}/listings`,
    });
  }

  const listing = data.listing as any;
  
  // Construir description optimizada para SEO
  const description = `${listing.year} ${listing.brand} ${listing.model} en venta. ${
    listing.price ? `${formatPrice(listing.price)} MXN.` : ''
  } ${listing.mileage ? `${formatMileage(listing.mileage)} km.` : ''} ${
    listing.description ? listing.description.substring(0, 150) + (listing.description.length > 150 ? '...' : '') : 'Encuentra este y más vehículos en Cliquéalo.mx'
  }`;

  // Construir título optimizado para SEO
  const title = `${listing.year} ${listing.brand} ${listing.model} ${
    listing.color ? `${listing.color}` : ''
  } | Cliquéalo.mx`;

  return generateCarListingMeta({
    title,
    description,
    url: `${DEFAULT_SEO.url}/listings/${listing._id}`,
    brand: listing.brand,
    model: listing.model,
    year: listing.year,
    price: listing.price,
    image: listing.images && listing.images.length > 0 ? listing.images[0] : undefined,
    condition: "Usado",
    location: listing.location,
  });
};

export async function loader(args: LoaderFunctionArgs) {
  const { params, request } = args
  const listingId = params.id
  console.log('🎯 LOADER - Listing ID:', listingId)
  
  // Validar que el ID no sea un archivo .js.map o similar
  if (!listingId || listingId.includes('.js') || listingId.includes('.map')) {
    console.log('❌ ID inválido o es un archivo source map:', listingId)
    throw new Response(null, { status: 404 })
  }
  
  // Validar que el ID sea un ObjectId válido de MongoDB (24 caracteres hex)
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(listingId)
  if (!isValidObjectId) {
    console.log('❌ ID no es un ObjectId válido:', listingId)
    return redirect("/?toast=listing-not-found")
  }

  const user = await getClerkUser(args)
  console.log('👤 Usuario actual:', user?.name || 'No logueado')
  
  // Buscar el listing
  const listing = await ListingModel.findByIdWithUser(listingId)
  console.log('📄 Listing encontrado:', !!listing)
  
  if (!listing) {
    console.log('❌ Listing no encontrado para ID:', listingId)
    // Redirigir a home con mensaje de toast en lugar de mostrar 404
    return redirect("/?toast=listing-not-found")
  }

  // Obtener información del propietario via Clerk
  const ownerInfo = await getClerkUserInfo(listing.user)
  console.log('👨‍💼 Propietario via Clerk:', ownerInfo?.name)

  // Add hot status to the listing on the server side
  const listingWithHotStatus = {
    ...listing,
    hotStatus: getHotStatus(listing as Listing),
    owner: ownerInfo // Agregar info del propietario
  }

  console.log('📝 Título del listing:', listing.title)

  // Incrementar contador de vistas (solo si no es el dueño)
  if (!user || listing.user !== user.clerkId) {
    await ListingModel.incrementViews(listingId)
  }

  // Verificar si el usuario le dio like (solo si está logueado)
  const hasLiked = user ? await UserModel.hasLiked(user._id!.toString(), listingId) : false
  
  // Obtener autos similares
  const similarListings = await ListingModel.findSimilar(listingId, 4)
  
  // Obtener aliados bancarios activos que financian vehículos del año del listing
  const bankPartners = listing.year 
    ? await BankPartnerModel.findActiveForVehicleYear(listing.year)
    : await BankPartnerModel.findActiveForSimulator()
    
  
  // Verificar permisos de edición
  const canEdit = user ? ClerkAuth.canEditListing(user, listing) : false

  console.log('🔍 Loader debug:')
  console.log('- Usuario:', user?.name || 'No logueado')
  console.log('- Has liked:', hasLiked)
  console.log('- Can edit:', canEdit)

  return json({
    listing: listingWithHotStatus,
    similarListings,
    bankPartners,
    user,
    hasLiked,
    canEdit
  })
}

export async function action(args: ActionFunctionArgs) {
  const listingId = args.params.id
  console.log('🎯 ACTION EJECUTADO - Listing ID:', listingId)
  
  if (!listingId) {
    console.log('❌ No listing ID')
    // Redirigir a home con mensaje de toast en lugar de mostrar 404
    return redirect("/?toast=listing-not-found")
  }

  const user = await getClerkUser(args)
  
  if (!user) {
    console.log('❌ Usuario NO autenticado')
    return json({ error: "Debes iniciar sesión para dar like" }, { status: 401 })
  }

  console.log('✅ Usuario autenticado:', user.name, 'ID:', user._id)

  const formData = await args.request.formData()
  const intent = formData.get("intent") as string
  console.log('🎯 Intent recibido:', intent)

  try {
    switch (intent) {
      case "like": {
        console.log('➕ Procesando LIKE...')
        const success = await UserModel.likeListing(user._id!.toString(), listingId)
        console.log('✅ Resultado LIKE:', success)
        
        if (success) {
          return json({ success: true, action: "liked" })
        } else {
          console.log('❌ No se pudo dar like (posiblemente es el dueño)')
          return json({ error: "No puedes dar like a tu propio auto" }, { status: 400 })
        }
      }
      
      case "unlike": {
        console.log('➖ Procesando UNLIKE...')
        const success = await UserModel.unlikeListing(user._id!.toString(), listingId)
        console.log('✅ Resultado UNLIKE:', success)
        
        if (success) {
          return json({ success: true, action: "unliked" })
        } else {
          return json({ error: "No se pudo quitar el like" }, { status: 400 })
        }
      }
      
      case "delete": {
        const listing = await ListingModel.findById(listingId)
        if (!listing || !ClerkAuth.canEditListing(user, listing)) {
          throw new Response("No autorizado", { status: 403 })
        }
        
        await ListingModel.delete(listingId)
        return redirect("/?message=listing-deleted")
      }
      
      default:
        console.log('❌ Intent no válido:', intent)
        throw new Response("Acción no válida", { status: 400 })
    }
  } catch (error) {
    console.error("💥 Error en action:", error)
    return json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

type LoaderData = {
  listing: Listing & { hotStatus: string }
  similarListings: Listing[]
  bankPartners: any[]
  user: any
  hasLiked: boolean
  canEdit: boolean
}

type MetaData = {
  listing?: Listing & { hotStatus: string }
}

// Script para JSON-LD estructurado
const ListingJsonLd = ({ listing }: { listing: any }) => {
  // Solo renderizar si hay un listing válido
  if (!listing) return null;

  const jsonLdData = generateCarListingJsonLd({
    title: `${listing.year} ${listing.brand} ${listing.model}`,
    description: listing.description || `${listing.year} ${listing.brand} ${listing.model} en venta en Cliquéalo.mx`,
    url: `${DEFAULT_SEO.url}/listings/${listing._id}`,
    brand: listing.brand,
    model: listing.model,
    year: listing.year,
    price: listing.price,
    image: listing.images && listing.images.length > 0 ? listing.images[0] : undefined,
    condition: "UsedCondition",
    location: listing.location,
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdData }}
    />
  );
};

export default function ListingDetail() {
  const { listing, similarListings, bankPartners, user, hasLiked, canEdit } = useLoaderData<LoaderData>()
  
  const navigation = useNavigation()
  const likeFetcher = useFetcher()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState('info')
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [creditStep, setCreditStep] = useState(1)
  
  // Hook para el simple lightbox
  const {
    isOpen: lightboxOpen,
    currentIndex: lightboxIndex,
    openLightbox,
    closeLightbox,
    updateSlides
  } = useSimpleLightbox()
  
  // Estados para calculadora de crédito
  const [creditData, setCreditData] = useState({
    downPayment: Math.round(listing.price * 0.3), // 30% de enganche mínimo por defecto
    loanTerm: 48, // 48 meses por defecto
    selectedBankId: '' // Banco seleccionado
  })
  
  // Estado para el valor de display del enganche (con formato)
  const [downPaymentDisplay, setDownPaymentDisplay] = useState(
    formatPrice(Math.round(listing.price * 0.3))
  )

  // Calcular el enganche mínimo (30%)
  const minDownPayment = Math.round(listing.price * 0.3)
  
  const isLiking = likeFetcher.state !== "idle"
  const isDeleting = navigation.state === "submitting" && navigation.formData?.get("intent") === "delete"

  // 🔥 SOLUCIÓN: Estado optimista REAL - ARREGLADO TYPESCRIPT
  const getCurrentlyLiked = (): boolean => {
    // 1. Si hay FormData pendiente (estado optimista)
    if (likeFetcher.formData) {
      const intent = likeFetcher.formData.get("intent")
      const intentStr = typeof intent === 'string' ? intent : ''
      console.log('🔄 Estado optimista - Intent:', intentStr)
      return intentStr === "like"
    }
    
    // 2. Si hay respuesta del servidor
    if (likeFetcher.data) {
      const data = likeFetcher.data as ActionResponse | undefined
      console.log('📡 Respuesta servidor - Action:', data?.action)
      if (data?.action === "liked") return true
      if (data?.action === "unliked") return false
      if (data?.error) return hasLiked // Mantener estado original en error
    }
    
    // 3. Estado inicial del loader
    return hasLiked
  }

  const currentlyLiked = getCurrentlyLiked()

  // Mostrar feedback del fetcher
  useEffect(() => {
    if (likeFetcher.data) {
      const data = likeFetcher.data as ActionResponse | undefined
      
      if (data?.error) {
        console.error('❌ Error en like:', data.error)
        toast.error(data.error)
      } else if (data?.success) {
        if (data.action === "liked") {
          console.log('✅ Like exitoso')
          toast.success("Agregado a favoritos ❤️")
        } else if (data.action === "unliked") {
          console.log('✅ Unlike exitoso')
          toast.success("Removido de favoritos")
        }
      }
    }
  }, [likeFetcher.data])

  const images = listing.images || []
  const videos = listing.videos || []
  const allMedia = [
    ...images.map((url: string, index: number) => ({ url, type: 'image' as const, index })),
    ...videos.map((url: string, index: number) => ({ url, type: 'video' as const, index: index + images.length }))
  ]
  const hasMedia = allMedia.length > 0

  // Navegación de imágenes
  const nextMedia = () => {
    if (allMedia.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % allMedia.length)
    }
  }

  const prevMedia = () => {
    if (allMedia.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length)
    }
  }

  // Keyboard navigation para imágenes
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevMedia()
      if (e.key === 'ArrowRight') nextMedia()
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [allMedia.length])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: `${listing.brand} ${listing.model} ${listing.year} - ${formatPrice(listing.price)}`,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: copiar al clipboard
      navigator.clipboard.writeText(window.location.href)
      toast.success('¡Enlace copiado al portapapeles!')
    }
  }

  // 🔧 HELPER para obtener intent de forma segura
  const getCurrentIntent = (): string => {
    if (!likeFetcher.formData) return 'none'
    const intent = likeFetcher.formData.get('intent')
    return typeof intent === 'string' ? intent : 'unknown'
  }

  // 🔧 HELPER para formatear datos del fetcher de forma segura
  const getFetcherDataString = (): string => {
    if (!likeFetcher.data) return 'null'
    try {
      return JSON.stringify(likeFetcher.data)
    } catch {
      return 'error-serializing'
    }
  }

  // Función para calcular el pago mensual del crédito
  const calculateMonthlyPayment = () => {
    // Validar que el enganche sea al menos el 30%
    if (creditData.downPayment < minDownPayment) {
      return 0
    }
    
    // Validar que haya un banco seleccionado
    if (!creditData.selectedBankId) {
      return 0
    }
    
    // Obtener la tasa del banco seleccionado
    const selectedBank = bankPartners.find(bank => bank._id === creditData.selectedBankId)
    if (!selectedBank) {
      return 0
    }
    
    // Validar que el plazo esté dentro del rango del banco
    if (creditData.loanTerm < selectedBank.minTerm || creditData.loanTerm > selectedBank.maxTerm) {
      return 0
    }
    
    const principal = listing.price - creditData.downPayment
    const monthlyRate = selectedBank.creditRate / 100 / 12
    const numPayments = creditData.loanTerm
    
    if (monthlyRate === 0) {
      return principal / numPayments
    }
    
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
                          (Math.pow(1 + monthlyRate, numPayments) - 1)
    
    return monthlyPayment
  }

  // Función para calcular el total a pagar
  const calculateTotalPayment = () => {
    return creditData.downPayment + (calculateMonthlyPayment() * creditData.loanTerm)
  }

  // Función para calcular los intereses totales
  const calculateTotalInterest = () => {
    return calculateTotalPayment() - listing.price
  }

  // Función para generar el mensaje de WhatsApp con la información del crédito
  const generateWhatsAppMessage = () => {
    const selectedBank = bankPartners.find(bank => bank._id === creditData.selectedBankId)
    const bankName = selectedBank ? selectedBank.name : 'Banco seleccionado'
    const interestRate = selectedBank ? selectedBank.creditRate : 0
    
    const message = `🚗 *Solicitud de Crédito Automotriz*

*Vehículo:* ${listing.title}
*Precio:* ${formatPrice(listing.price)} MXN
*ID:* ${listing._id?.slice(-8).toUpperCase() || 'N/A'}

💰 *Detalles del Crédito:*
• Banco: ${bankName}
• Enganche: ${formatPrice(creditData.downPayment)}
• Plazo: ${creditData.loanTerm} meses
• Tasa de interés: ${interestRate}% anual
• Pago mensual: ${formatPrice(calculateMonthlyPayment())}

📋 *Documentos que tengo listos:*
✅ INE (Identificación oficial)
✅ Comprobante de domicilio
✅ Últimos 6 estados de cuenta/nóminas

🙋‍♂️ Estoy interesado en solicitar el crédito para este vehículo. ¿Podrías enviarme la carta de crédito y los siguientes pasos?

¡Gracias!`

    return encodeURIComponent(message)
  }

  // Función para abrir WhatsApp con el mensaje
  const handleWhatsAppContact = () => {
    const whatsappNumber = listing.contactInfo?.whatsapp?.replace(/\D/g, '') || ''
    
    // Verificar que el número existe
    if (!whatsappNumber) {
      toast.error('No hay número de WhatsApp disponible')
      return
    }
    
    // Asegurar que el número tenga el código de país (México +52)
    let formattedNumber = whatsappNumber
    if (whatsappNumber.length === 10) {
      formattedNumber = '52' + whatsappNumber
    } else if (whatsappNumber.startsWith('1') && whatsappNumber.length === 11) {
      formattedNumber = '52' + whatsappNumber.substring(1)
    }
    
    const message = generateWhatsAppMessage()
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${message}`
    
    console.log('WhatsApp URL:', whatsappUrl)
    console.log('Número formateado:', formattedNumber)
    
    window.open(whatsappUrl, '_blank')
    setShowCreditModal(false)
    setCreditStep(1)
  }

  // Función para avanzar al siguiente paso del modal
  const nextStep = () => {
    if (creditStep < 4) {
      setCreditStep(creditStep + 1)
    }
  }

  // Función para retroceder al paso anterior
  const prevStep = () => {
    if (creditStep > 1) {
      setCreditStep(creditStep - 1)
    }
  }

  // Convertir imágenes y videos a formato MediaItem para el lightbox
  // Utilizamos URLs optimizadas para calidad ultra-alta en el lightbox
  const mediaItems: MediaItem[] = useMemo(() => [
    ...images.map((image: string, index: number) => {
      // Optimizar URL para calidad ultra si es una URL de Cloudinary
      let optimizedSrc = image;
      if (image.includes('cloudinary.com')) {
        // Reemplazar los parámetros de transformación con calidad ultra
        optimizedSrc = image.replace(/\/upload\/([^/]*\/)?/, '/upload/w_1800,q_100,f_auto/');
      } else if (image.startsWith('/')) {
        // Para imágenes locales, usar la API de optimización
        optimizedSrc = `/api/optimize-image?src=${encodeURIComponent(image)}&quality=ultra`;
      }
      
      return {
        src: optimizedSrc,
        type: 'image' as const,
        title: `${listing.title} - Imagen ${index + 1}`,
        description: `Imagen ${index + 1} de ${images.length + videos.length}`
      };
    }),
    ...videos.map((video: string, index: number) => ({
      src: video,
      type: 'video' as const,
      title: `${listing.title} - Video ${index + 1}`,
      description: `Video ${index + 1} de ${images.length + videos.length}`
    }))
  ], [images, videos, listing.title])

  // Actualizar slides del lightbox cuando cambien los medios
  useEffect(() => {
    updateSlides(mediaItems)
  }, [mediaItems, updateSlides])

  // Preparar media para OptimizedCarousel
  const optimizedMedias = useMemo(() => {
    return [...images.map((url: string, index: number) => ({
      id: `image-${index}`,
      url,
      type: 'image' as const,
      title: listing.title,
      alt: `${listing.title} - Imagen ${index + 1}`
    })),
    ...videos.map((url: string, index: number) => ({
      id: `video-${index}`,
      url,
      type: 'video' as const,
      title: listing.title,
      alt: `${listing.title} - Video ${index + 1}`
    }))];
  }, [images, videos, listing.title]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30 overflow-x-hidden">
      {/* JSON-LD estructurado para SEO */}
      <ListingJsonLd listing={listing} />
      {/* Enhanced Header with HeroUI */}
      <header className="border-b border-red-100 sticky top-0 bg-white/80 backdrop-blur-md z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 min-w-0">
            <Button
              as={Link}
              to="/"
              variant="light"
              startContent={<ArrowLeft className="w-4 h-4" />}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              <span className="hidden sm:inline">Volver al Catálogo</span>
              <span className="sm:hidden">Volver</span>
            </Button>

            <div className="flex items-center gap-2">
              {/* Like Button with HeroUI */}
              {user && (
                <likeFetcher.Form method="post" style={{ display: 'inline' }}>
                  <input
                    type="hidden"
                    name="intent"
                    value={currentlyLiked ? "unlike" : "like"}
                  />
                  <Button
                    type="submit"
                    isIconOnly
                    variant={currentlyLiked ? "solid" : "light"}
                    color={currentlyLiked ? "danger" : "default"}
                    isLoading={isLiking}
                    className={currentlyLiked ? "scale-110" : ""}
                    title={currentlyLiked ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    onClick={() => {
                      console.log('💗 Click en corazón - Estado actual:', currentlyLiked)
                      console.log('👤 Usuario:', user.name)
                      console.log('🔄 Fetcher state:', likeFetcher.state)
                      console.log('📤 Enviando intent:', currentlyLiked ? 'unlike' : 'like')
                    }}
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        currentlyLiked ? 'fill-current' : ''
                      }`}
                    />
                  </Button>
                </likeFetcher.Form>
              )}
              
              {/* Guest Like Button */}
              {!user && (
                <Button
                  isIconOnly
                  variant="light"
                  color="default"
                  onClick={() => {
                    toast.error(
                      "¡Inicia sesión para dar like! 💖",
                      "Regístrate o inicia sesión para guardar tus autos favoritos"
                    )
                  }}
                  title="Haz clic para registrarte y dar like"
                >
                  <Heart className="w-5 h-5" />
                </Button>
              )}
              
              <Button
                isIconOnly
                variant="light"
                color="default"
                onClick={handleShare}
                title="Compartir"
              >
                <Share2 className="w-5 h-5" />
              </Button>

              {canEdit && (
                <>
                  <Divider orientation="vertical" className="h-8 mx-2" />
                  <div className="flex items-center gap-2">
                    <Button
                      as={Link}
                      to={`/listings/${listing._id}/edit`}
                      variant="flat"
                      color="primary"
                      size="sm"
                      startContent={<Edit className="w-4 h-4" />}
                      title="Editar Listing"
                    >
                      <span className="hidden md:inline">Editar</span>
                    </Button>
                    
                    <Button
                      isIconOnly
                      variant="flat"
                      color="danger"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-12">
          {/* Columna principal - Imágenes e info */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-8 min-w-0">
            {/* Galería optimizada de imágenes y videos */}
            <div className="space-y-4">
              {hasMedia ? (
                <div className="border-2 border-red-500/20 hover:border-red-500/40 transition-colors rounded-2xl overflow-hidden">
                  <OptimizedCarousel
                    medias={optimizedMedias}
                    className="w-full"
                    onMediaClick={(index) => {
                      console.log('🔍 Opening lightbox at index:', index);
                      openLightbox(index);
                    }}
                    autoPlay={false}
                    showThumbnails={true}
                    maxVisibleThumbnails={8}
                    preloadCount={2}
                    imageQuality="high"
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gray-100 rounded-2xl flex items-center justify-center">
                  <Car className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Enhanced Vehicle Information with HeroUI */}
            <Card className="border-l-4 border-red-500 shadow-lg">
              <CardBody className="p-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-gray-900 tracking-tight">
                            {capitalizeBrandInTitle(listing.title)}
                          </h1>
                          {/* Hot Badge with HeroUI */}
                          {(() => {
                            const hotStatus = listing.hotStatus
                            if (hotStatus === 'super-hot') {
                              return (
                                <Chip
                                  startContent={<span>🔥🔥</span>}
                                  variant="solid"
                                  color="danger"
                                  className="bg-gradient-to-r from-red-500 to-orange-500 animate-bounce"
                                >
                                  Super Hot
                                </Chip>
                              )
                            } else if (hotStatus === 'hot') {
                              return (
                                <Chip
                                  startContent={<span>🔥</span>}
                                  variant="solid"
                                  color="danger"
                                  className="animate-pulse"
                                >
                                  Hot
                                </Chip>
                              )
                            }
                            return null
                          })()}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 text-gray-600">
                          <Chip variant="flat" color="default" size="lg">
                            {listing.brand} {listing.model}
                          </Chip>
                          <Chip variant="flat" color="primary" size="sm">
                            {listing.year}
                          </Chip>
                        </div>
                      </div>
                      
                      {/* Vehicle ID Badge */}
                      <Chip
                        variant="bordered"
                        color="default"
                        size="sm"
                        className="font-mono"
                      >
                        ID: {listing._id?.slice(-8).toUpperCase() || 'N/A'}
                      </Chip>
                    </div>
                  </div>

                  {/* Price Card */}
                  <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
                    <CardBody className="p-4">
                      <div className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900 text-center">
                        ${formatPrice(listing.price)}
                        <span className="text-lg text-red-600 font-medium ml-2">MXN</span>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Enhanced Characteristics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <CardBody className="p-4 text-center">
                        <Calendar
className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-sm text-blue-600 font-medium">Año</div>
                        <div className="text-lg font-semibold text-gray-900">{listing.year}</div>
                      </CardBody>
                    </Card>
                    
                    {listing.fuelType && (
                      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <CardBody className="p-4 text-center">
                          <Fuel className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <div className="text-sm text-green-600 font-medium">Combustible</div>
                          <div className="text-lg font-semibold text-gray-900 capitalize">{listing.fuelType}</div>
                        </CardBody>
                      </Card>
                    )}
                    
                    {listing.transmission && (
                      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <CardBody className="p-4 text-center">
                          <Settings className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                          <div className="text-sm text-purple-600 font-medium">Transmisión</div>
                          <div className="text-lg font-semibold text-gray-900 capitalize">{listing.transmission}</div>
                        </CardBody>
                      </Card>
                    )}
                    
                    {listing.mileage && (
                      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                        <CardBody className="p-4 text-center">
                          <Gauge className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                          <div className="text-sm text-orange-600 font-medium">Kilometraje</div>
                          <div className="text-lg font-semibold text-gray-900">{formatMileage(listing.mileage)} km</div>
                        </CardBody>
                      </Card>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Enhanced Description */}
            {listing.description && (
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    Descripción
                  </h2>
                </CardHeader>
                <CardBody className="pt-0">
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {listing.description}
                  </p>
                </CardBody>
              </Card>
            )}

            {/* Enhanced Additional Features */}
            {(listing.color || listing.bodyType || listing.features?.length) && (
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-gray-600" />
                    Características Adicionales
                  </h2>
                </CardHeader>
                <CardBody className="pt-0 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {listing.color && (
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                        <Palette className="w-5 h-5 text-pink-600" />
                        <div>
                          <div className="text-sm text-pink-600 font-medium">Color</div>
                          <div className="text-gray-900 font-semibold">{listing.color}</div>
                        </div>
                      </div>
                    )}
                    
                    {listing.bodyType && (
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                        <Car className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="text-sm text-blue-600 font-medium">Tipo de Carrocería</div>
                          <div className="text-gray-900 font-semibold">{listing.bodyType}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {listing.features && listing.features.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Equipamiento</h3>
                      <div className="flex flex-wrap gap-2">
                        {listing.features.map((feature: string, index: number) => (
                          <Chip
                            key={index}
                            variant="flat"
                            color="primary"
                            size="sm"
                            className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200"
                          >
                            {feature}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {/* Vehicle Documents Section */}
            {listing.vehicleDocuments && listing.vehicleDocuments.length > 0 && (
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    Documentos del Vehículo
                  </h2>
                </CardHeader>
                <CardBody className="pt-0 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {listing.vehicleDocuments.map((doc, index) => (
                      <div key={doc.id || index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <Receipt className="w-5 h-5 text-green-600" />
                        <div className="flex-1">
                          <div className="text-sm text-green-600 font-medium">
                            {doc.type === 'repuve' && 'REPUVE'}
                            {doc.type === 'factura' && 'Factura'}
                            {doc.type === 'tarjeta_circulacion' && 'Tarjeta de Circulación'}
                            {doc.type === 'verificacion' && 'Verificación'}
                            {doc.type === 'tenencia' && 'Tenencia'}
                            {doc.type === 'seguro' && 'Seguro'}
                            {doc.type === 'otro' && 'Otro Documento'}
                          </div>
                          <div className="text-gray-900 font-semibold text-sm">{doc.name}</div>
                          {doc.notes && <div className="text-xs text-gray-600">{doc.notes}</div>}
                        </div>
                        {doc.url && (
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
                    Los documentos mostrados han sido proporcionados por el vendedor
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Enhanced Sidebar with HeroUI Tabs */}
          <div className="space-y-6 min-w-0">
            <Card className="shadow-xl border-0">
              <CardBody className="p-0">
                <Tabs
                  selectedKey={activeTab}
                  onSelectionChange={(key) => setActiveTab(key as string)}
                  color="danger"
                  variant="underlined"
                  classNames={{
                    tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                    cursor: "w-full bg-red-600",
                    tab: "max-w-fit px-4 py-3 h-12",
                    tabContent: "group-data-[selected=true]:text-red-600"
                  }}
                >
                  <Tab
                    key="info"
                    title={
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span className="hidden sm:inline">Contacto</span>
                        <span className="sm:hidden">Info</span>
                      </div>
                    }
                  >
                    <div className="p-6">
                      <div className="space-y-6">
                        <div className="text-center">
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">Información de Contacto</h3>
                        </div>
                        
                        <div className="space-y-4">
                          {/* Seller Info Card */}
                          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                            <CardBody className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                                  <span className="text-white font-semibold text-lg">
                                    {listing.owner?.name?.charAt(0).toUpperCase() || 'V'}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">{listing.owner?.name || 'Vendedor'}</div>
                                  <div className="flex items-center gap-1">
                                    {listing.owner?.role === 'admin' && (
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                    )}
                                    <span className="text-sm text-gray-600">
                                      {listing.owner?.role === 'admin' ? 'Vendedor Verificado' : 'Vendedor'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardBody>
                          </Card>

                          {/* Contact Buttons */}
                          <div className="space-y-3">
                            {listing.contactInfo?.phone && (
                              <Button
                                as="a"
                                href={`tel:${listing.contactInfo.phone}`}
                                variant="flat"
                                color="default"
                                size="lg"
                                startContent={<Phone className="w-5 h-5" />}
                                className="w-full justify-start"
                              >
                                {listing.contactInfo.phone}
                              </Button>
                            )}

                            {listing.contactInfo?.whatsapp && (
                              <Button
                                as="a"
                                href={`https://wa.me/${(() => {
                                  const number = listing.contactInfo.whatsapp.replace(/\D/g, '')
                                  if (number.length === 10) {
                                    return '52' + number
                                  } else if (number.startsWith('1') && number.length === 11) {
                                    return '52' + number.substring(1)
                                  }
                                  return number
                                })()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="flat"
                                color="success"
                                size="lg"
                                startContent={<MessageCircle className="w-5 h-5" />}
                                endContent={<ExternalLink className="w-4 h-4" />}
                                className="w-full justify-start"
                              >
                                WhatsApp
                              </Button>
                            )}

                            <Button
                              color="danger"
                              size="lg"
                              startContent={<Phone className="w-5 h-5" />}
                              className="w-full font-semibold"
                            >
                              Contactar Vendedor
                            </Button>
                          </div>

                          {/* Vehicle Stats */}
                          <Divider />
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-4">Estadísticas del Vehículo</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
                                <CardBody className="p-3 text-center">
                                  <Eye className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                                  <div className="text-lg font-bold text-gray-900">{listing.viewsCount || 0}</div>
                                  <div className="text-xs text-gray-600">Vistas</div>
                                </CardBody>
                              </Card>
                              
                              <Card className="bg-gradient-to-br from-red-50 to-pink-100">
                                <CardBody className="p-3 text-center">
                                  <Heart className="w-5 h-5 text-red-600 mx-auto mb-1" />
                                  <div className="text-lg font-bold text-gray-900">{listing.likesCount || 0}</div>
                                  <div className="text-xs text-gray-600">Me gusta</div>
                                </CardBody>
                              </Card>
                            </div>

                            {listing.location && (
                              <Card className="mt-4 bg-gradient-to-br from-green-50 to-emerald-100">
                                <CardBody className="p-3">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-medium text-gray-900">
                                      {listing.location.city}, {listing.location.state}
                                    </span>
                                  </div>
                                </CardBody>
                              </Card>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Tab>
                  
                  <Tab
                    key="credit"
                    title={
                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4" />
                        Crédito
                      </div>
                    }
                  >
                    <div className="p-6">
                      <div className="space-y-6">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-4">
                            <CreditCard className="w-6 h-6 text-red-600" />
                            <h3 className="text-xl font-semibold text-gray-900">Calculadora de Crédito</h3>
                          </div>
                        </div>

                        {/* Enhanced Credit Controls */}
                        <div className="space-y-4">
                          {/* Down Payment Input */}
                          <div>
                            <Input
                              type="text"
                              label="Enganche"
                              placeholder={`${formatPrice(minDownPayment)} (mínimo)`}
                              value={downPaymentDisplay}
                              startContent={<DollarSign className="w-4 h-4 text-gray-400" />}
                              color={
                                creditData.downPayment < minDownPayment || creditData.downPayment > listing.price
                                  ? "danger"
                                  : "default"
                              }
                              description={
                                creditData.downPayment > 0
                                  ? `${((creditData.downPayment / listing.price) * 100).toFixed(1)}% del precio total`
                                  : 'Ingresa el monto del enganche'
                              }
                              errorMessage={
                                creditData.downPayment > listing.price
                                  ? "No es posible un enganche mayor al 100% del precio"
                                  : creditData.downPayment < minDownPayment && creditData.downPayment > 0
                                  ? `Mínimo: ${formatPrice(minDownPayment)} (30%)`
                                  : undefined
                              }
                              onChange={(e) => {
                                const rawValue = e.target.value.replace(/[^\d]/g, '')
                                const numericValue = rawValue === '' ? 0 : parseFloat(rawValue)
                                
                                setCreditData({
                                  ...creditData,
                                  downPayment: numericValue
                                })
                                
                                if (rawValue === '') {
                                  setDownPaymentDisplay('')
                                } else {
                                  setDownPaymentDisplay(formatPrice(numericValue))
                                }
                              }}
                              onBlur={(e) => {
                                const rawValue = e.target.value.replace(/[^\d]/g, '')
                                const numericValue = rawValue === '' ? 0 : parseFloat(rawValue)
                                const constrainedValue = Math.max(minDownPayment, Math.min(listing.price, numericValue))
                                
                                setCreditData({
                                  ...creditData,
                                  downPayment: constrainedValue
                                })
                                
                                setDownPaymentDisplay(formatPrice(constrainedValue))
                              }}
                              onFocus={() => {
                                if (creditData.downPayment === 0) {
                                  setDownPaymentDisplay('')
                                }
                              }}
                            />
                          </div>

                          {/* Bank Partner Selector */}
                          <div>
                            <div>
                              {bankPartners.length > 0 ? (
                                <Select
                                  label="Escoge tu Aliado Bancario"
                                  placeholder="Selecciona un banco"
                                  selectedKeys={creditData.selectedBankId ? new Set([creditData.selectedBankId]) : new Set([])}
                                  onSelectionChange={(keys) => {
                                    const selectedKey = Array.from(keys)[0] as string
                                    console.log("Banco seleccionado:", selectedKey)
                                    
                                    // Encontrar el banco seleccionado
                                    const selectedBank = bankPartners.find(bank => bank._id === selectedKey);
                                    
                                    // Resetear el plazo si el actual no está disponible en el nuevo banco
                                    let newLoanTerm = creditData.loanTerm;
                                    if (selectedBank) {
                                      if (creditData.loanTerm < selectedBank.minTerm || creditData.loanTerm > selectedBank.maxTerm) {
                                        // Seleccionar el plazo más cercano disponible
                                        const possibleTerms = [12, 24, 36, 48, 60, 72];
                                        const availableTerms = possibleTerms.filter(term => 
                                          term >= selectedBank.minTerm && term <= selectedBank.maxTerm
                                        );
                                        newLoanTerm = availableTerms.length > 0 ? availableTerms[0] : 48;
                                      }
                                    }
                                    
                                    setCreditData({
                                      ...creditData,
                                      selectedBankId: selectedKey || '',
                                      loanTerm: newLoanTerm
                                    })
                                  }}
                                  classNames={{
                                    trigger: "border-2 hover:border-blue-500 focus:border-blue-500",
                                    value: "font-medium text-blue-700",
                                    label: "font-semibold text-gray-800",
                                    base: "min-h-12"
                                  }}
                                  description={
                                    creditData.selectedBankId && bankPartners.find(bank => bank._id === creditData.selectedBankId)
                                      ? `Tasa: ${bankPartners.find(bank => bank._id === creditData.selectedBankId)?.creditRate}% anual`
                                      : 'Selecciona un banco para ver la tasa de interés'
                                  }
                                  renderValue={(items) => {
                                    const selectedBank = bankPartners.find(bank => bank._id === creditData.selectedBankId);
                                    if (!selectedBank) return null;
                                    
                                    return (
                                      <div className="flex items-center gap-2">
                                        <Chip 
                                          size="sm" 
                                          color="primary" 
                                          variant="flat"
                                          className="mr-1"
                                        >
                                          {selectedBank.creditRate}%
                                        </Chip>
                                        <span className="font-medium">{selectedBank.name}</span>
                                      </div>
                                    );
                                  }}
                                >
                                  {bankPartners.map((bank) => (
                                    <SelectItem 
                                      key={bank._id}
                                      className="py-2 px-3 hover:bg-blue-50 data-[selected=true]:bg-blue-100"
                                      startContent={
                                        <Chip 
                                          size="sm" 
                                          variant="flat" 
                                          color="primary"
                                          className="mr-2"
                                        >
                                          {bank.creditRate}%
                                        </Chip>
                                      }
                                      endContent={
                                        bank._id === creditData.selectedBankId && (
                                          <CheckCircle className="w-4 h-4 text-blue-600" />
                                        )
                                      }
                                    >
                                      <span className="font-medium">{bank.name}</span>
                                    </SelectItem>
                                  ))}
                                </Select>
                              ) : (
                                <Card className="bg-yellow-50 border-yellow-200">
                                  <CardBody className="py-4">
                                    <div className="flex items-center gap-3">
                                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                                      <div>
                                        <p className="font-medium text-yellow-800">
                                          No hay bancos disponibles para vehículos del año {listing.year}
                                        </p>
                                        <p className="text-sm text-yellow-700 mt-1">
                                          Los bancos aliados solo financian vehículos más recientes.
                                        </p>
                                      </div>
                                    </div>
                                  </CardBody>
                                </Card>
                              )}
                              
                              {/* Confirmación visual de banco seleccionado */}
                              {creditData.selectedBankId && (
                                <div className="mt-2 p-3 bg-blue-50 border-2 border-blue-300 rounded-lg shadow-sm">
                                  {(() => {
                                    const selectedBank = bankPartners.find(bank => bank._id === creditData.selectedBankId);
                                    if (!selectedBank) return null;
                                    
                                    return (
                                      <div className="flex items-center">
                                        <Building className="w-5 h-5 text-blue-600 mr-3" />
                                        <div>
                                          <div className="font-semibold text-gray-900">{selectedBank.name}</div>
                                          <div className="text-sm text-blue-600 font-medium">
                                            Tasa: {selectedBank.creditRate}% anual
                                          </div>
                                        </div>
                                        <Chip 
                                          size="sm" 
                                          color="success" 
                                          variant="flat"
                                          className="ml-auto"
                                          startContent={<CheckCircle className="w-3 h-3" />}
                                        >
                                          Seleccionado
                                        </Chip>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Loan Term Select - Dinámico basado en banco seleccionado */}
                          <div>
                            {creditData.selectedBankId ? (() => {
                              const selectedBank = bankPartners.find(bank => bank._id === creditData.selectedBankId);
                              if (!selectedBank) return null;
                              
                              // Generar opciones de plazo basadas en min/max del banco
                              const availableTerms = [];
                              const possibleTerms = [12, 24, 36, 48, 60, 72];
                              
                              for (const term of possibleTerms) {
                                if (term >= selectedBank.minTerm && term <= selectedBank.maxTerm) {
                                  availableTerms.push(term);
                                }
                              }
                              
                              // Si no hay términos disponibles, mostrar mensaje
                              if (availableTerms.length === 0) {
                                return (
                                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-700 text-center">
                                      No hay plazos disponibles para este banco
                                    </p>
                                  </div>
                                );
                              }
                              
                              // Usar el plazo actual si está disponible, si no, mostrar el primero disponible
                              const selectedTermValue = availableTerms.includes(creditData.loanTerm) ? creditData.loanTerm : availableTerms[0];
                              
                              return (
                                <div>
                                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    Plazo disponible
                                  </label>
                                  <select
                                    value={selectedTermValue.toString()}
                                    onChange={(e) => {
                                      const newTerm = parseInt(e.target.value);
                                      setCreditData({
                                        ...creditData,
                                        loanTerm: newTerm
                                      })
                                    }}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium text-green-700 bg-white shadow-sm hover:border-green-300 transition-colors"
                                  >
                                    {availableTerms.map((term) => (
                                      <option key={term} value={term.toString()}>
                                        {term} meses
                                      </option>
                                    ))}
                                  </select>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {selectedBank.name} ofrece plazos de {selectedBank.minTerm} a {selectedBank.maxTerm} meses
                                  </p>
                                </div>
                              );
                            })() : (
                              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="text-sm text-gray-600 text-center">
                                  👆 Primero selecciona un banco aliado para ver los plazos disponibles
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Enhanced Results Card */}
                        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
                          <CardHeader className="pb-2">
                            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              <TrendingUp className="w-5 h-5 text-red-600" />
                              Resumen del Crédito
                            </h4>
                          </CardHeader>
                          <CardBody className="pt-0">
                            {creditData.downPayment < minDownPayment ? (
                              <Card className="bg-red-100 border-red-300">
                                <CardBody className="p-3">
                                  <p className="text-sm text-red-700 font-medium">
                                    ⚠️ Enganche insuficiente
                                  </p>
                                  <p className="text-xs text-red-600 mt-1">
                                    El enganche mínimo requerido es del 30% (${formatPrice(minDownPayment)})
                                  </p>
                                </CardBody>
                              </Card>
                            ) : creditData.downPayment > listing.price ? (
                              <Card className="bg-red-100 border-red-300">
                                <CardBody className="p-3">
                                  <p className="text-sm text-red-700 font-medium">
                                    ⚠️ Enganche excesivo
                                  </p>
                                  <p className="text-xs text-red-600 mt-1">
                                    No es posible un enganche mayor al 100% del precio del vehículo
                                  </p>
                                </CardBody>
                              </Card>
                            ) : (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-3">
                                  <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                                    <CardBody className="p-3 text-center">
                                      <div className="text-2xl font-bold text-green-600">
                                        ${formatPrice(calculateMonthlyPayment())}
                                      </div>
                                      <div className="text-sm text-green-700">Pago mensual</div>
                                    </CardBody>
                                  </Card>
                                </div>
                              </div>
                            )}
                          </CardBody>
                        </Card>

                       {/* Credit Request Buttons - DISEÑO ULTRA MINIMALISTA */}
                          {bankPartners.length > 0 && (
                            <div className="space-y-3">
                              {/* Botón Aplicar Crédito Online - AZUL SÓLIDO */}
                              <Button
                                as={Link}
                                to={`/credit/apply?listing=${listing._id}`}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium 
                                          rounded-lg transition-all duration-200 border-0"
                                size="lg"
                              >
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  <span>Aplicar Crédito Online</span>
                                </div>
                              </Button>
                              
                              {/* Separador minimalista */}
                              <div className="flex items-center gap-3 py-2">
                                <div className="flex-1 h-px bg-gray-200"></div>
                                <span className="text-xs text-gray-400">o</span>
                                <div className="flex-1 h-px bg-gray-200"></div>
                              </div>
                              
                              {/* WhatsApp Credit Request - SOLO BORDE VERDE */}
                              <Button
                                variant="bordered"
                                className={`w-full h-12 font-medium rounded-lg transition-all duration-200
                                  ${creditData.downPayment >= minDownPayment && creditData.downPayment <= listing.price
                                    ? 'border-green-600 text-green-600 hover:border-green-700 hover:text-green-700'
                                    : 'border-gray-300 text-gray-400 cursor-not-allowed'
                                  }`}
                                isDisabled={creditData.downPayment < minDownPayment || creditData.downPayment > listing.price}
                                onPress={() => setShowCreditModal(true)}
                              >
                                <div className="flex items-center gap-2">
                                  <MessageCircle className="w-4 h-4" />
                                  <span>Solicitar por WhatsApp</span>
                                </div>
                              </Button>
                            </div>
                          )}
                        <p className="text-xs text-gray-500 text-center">
                          * Los cálculos son estimados. Las condiciones finales pueden variar según la institución financiera.
                        </p>
                      </div>
                    </div>
                  </Tab>
                </Tabs>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Autos similares */}
        {similarListings.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-light text-gray-900 mb-8 border-l-4 border-red-500 pl-4">Autos similares</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarListings.map((similarListing: any) => (
                <Link
                  key={similarListing._id}
                  to={`/listings/${similarListing._id}`}
                  className="group"
                >
                  <Card className="border border-gray-200 overflow-hidden hover:shadow-lg hover:border-red-300 transition-all duration-200">
                    <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                      {similarListing.images?.[0] ? (
                        <img
                          src={similarListing.images[0]}
                          alt={similarListing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <CardBody className="p-4">
                      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                        {similarListing.title}
                      </h3>
                      <p className="text-lg font-light text-gray-900">
                        ${formatPrice(similarListing.price)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {similarListing.brand} {similarListing.model} • {similarListing.year}
                      </p>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Solicitud de Crédito Step-by-Step */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto mx-2 flex flex-col">
            {/* Header del Modal */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  Solicitud de Crédito
                </h3>
                <button
                  onClick={() => {
                    setShowCreditModal(false)
                    setCreditStep(1)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Cerrar"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>Paso {creditStep} de 4</span>
                  <span>{Math.round((creditStep / 4) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(creditStep / 4) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="flex-1 p-6 overflow-y-auto">
              {/* Paso 1: Información del Crédito */}
              {creditStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Resumen de tu Crédito
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Revisa los detalles de tu solicitud de crédito
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vehículo:</span>
                      <span className="font-medium text-gray-900">{listing.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Precio:</span>
                      <span className="font-medium text-gray-900">${formatPrice(listing.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Enganche:</span>
                      <span className="font-medium text-green-600">${formatPrice(creditData.downPayment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plazo:</span>
                      <span className="font-medium text-gray-900">{creditData.loanTerm} meses</span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-gray-600">Pago mensual:</span>
                      <span className="font-bold text-green-600 text-lg">${formatPrice(calculateMonthlyPayment())}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 2: Documentos Requeridos */}
              {creditStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Documentos Necesarios
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Asegúrate de tener estos documentos listos
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-gray-900">INE</h5>
                        <p className="text-sm text-gray-600">Identificación oficial vigente (ambos lados)</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                      <Home className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-gray-900">Comprobante de Domicilio</h5>
                        <p className="text-sm text-gray-600">No mayor a 3 meses (CFE, Telmex, agua, predial)</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <Receipt className="w-5 h-5
text-yellow-600 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-gray-900">Comprobantes de Ingresos</h5>
                        <p className="text-sm text-gray-600">Últimos 6 estados de cuenta o nóminas</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 3: Información Personal */}
              {creditStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-purple-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Información Personal
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Confirma que tienes la información necesaria
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3">Información requerida:</h5>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Nombre completo
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Fecha de nacimiento
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Dirección completa
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Teléfono de contacto
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Información laboral
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Ingresos mensuales
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 4: Contacto */}
              {creditStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      ¡Listo para Solicitar!
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Contacta al vendedor para continuar con tu solicitud
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h5 className="font-medium text-green-800 mb-2">Tu solicitud incluye:</h5>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Vehículo: {listing.title}</li>
                      <li>• Enganche: ${formatPrice(creditData.downPayment)}</li>
                      <li>• Plazo: {creditData.loanTerm} meses</li>
                      <li>• Pago mensual estimado: ${formatPrice(calculateMonthlyPayment())}</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <Button
                      color="success"
                      size="lg"
                      startContent={<MessageCircle className="w-5 h-5" />}
                      className="w-full font-semibold"
                      onClick={handleWhatsAppContact}
                    >
                      Enviar Solicitud por WhatsApp
                    </Button>
                    
                    {listing.contactInfo?.phone && (
                      <Button
                        as="a"
                        href={`tel:${listing.contactInfo.phone}`}
                        variant="bordered"
                        size="lg"
                        startContent={<Phone className="w-5 h-5" />}
                        className="w-full border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                      >
                        Llamar al {listing.contactInfo.phone}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="flex-shrink-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
              <div className="flex justify-between gap-3">
                {creditStep > 1 && (
                  <Button
                    variant="bordered"
                    onClick={prevStep}
                    startContent={<ArrowLeft className="w-4 h-4" />}
                    className="z-10 relative border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-4 py-2 font-medium"
                  >
                    Anterior
                  </Button>
                )}
                
                {creditStep < 4 ? (
                  <Button
                    color="primary"
                    onClick={nextStep}
                    endContent={<ArrowRight className="w-4 h-4" />}
                    className="ml-auto z-10 relative bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 font-medium border-0"
                  >
                    Siguiente
                  </Button>
                ) : (
                  <Button
                    variant="light"
                    onClick={() => {
                      setShowCreditModal(false)
                      setCreditStep(1)
                    }}
                    className="ml-auto z-10 relative bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 font-medium border-0"
                  >
                    Cerrar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simple Lightbox */}
      <SimpleLightbox
        slides={mediaItems}
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        index={lightboxIndex}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Eliminar Listing?
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                Esta acción no se puede deshacer. El listing será eliminado permanentemente.
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="bordered"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                >
                  Cancelar
                </Button>
                
                <Form method="post" className="flex-1">
                  <input type="hidden" name="intent" value="delete" />
                  <Button
                    type="submit"
                    color="danger"
                    isLoading={isDeleting}
                    className="w-full"
                  >
                    Eliminar
                  </Button>
                </Form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}