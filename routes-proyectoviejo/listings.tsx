import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node"
import { useLoaderData, Link, Form, useSearchParams, useFetcher } from "@remix-run/react"
import { ListingModel } from "~/models/Listing.server"
import { UserModel } from "~/models/User.server"
import { getClerkUser } from "~/lib/auth-clerk.server"
import { toast } from "~/components/ui/toast"
import { getHotStatus } from "~/models/Listing"
import { capitalizeBrandInTitle, capitalizeBrand } from "~/lib/utils"
import HeroSection from "~/components/HeroSection"
import {
  Search,
  Heart,
  Eye,
  Filter,
  Grid,
  List,
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Star,
  TrendingUp,
  User  // ✅ IMPORT AGREGADO
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { formatPrice } from '~/utils/formatters'
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
  Pagination,
  Divider,
  Spacer
} from "@heroui/react"

// Tipo para la respuesta del action
type ActionResponse = { success?: boolean; action?: 'liked' | 'unliked'; error?: string; listingId?: string }

export async function loader(args: LoaderFunctionArgs) {
  const url = new URL(args.request.url)
  const search = url.searchParams.get("search") || ""
  const brand = url.searchParams.get("brand") || ""
  const minPrice = url.searchParams.get("minPrice") ? parseInt(url.searchParams.get("minPrice") || "") : undefined
  const maxPrice = url.searchParams.get("maxPrice") ? parseInt(url.searchParams.get("maxPrice") || "") : undefined
  const minYear = url.searchParams.get("minYear") ? parseInt(url.searchParams.get("minYear") || "") : undefined
  const maxYear = url.searchParams.get("maxYear") ? parseInt(url.searchParams.get("maxYear") || "") : undefined
  const page = parseInt(url.searchParams.get("page") || "1")
  const limit = 12
  const skip = (page - 1) * limit
  
  // Get total count for pagination
  const totalCount = await ListingModel.getStats()
  
  const listings = await ListingModel.findMany({
    search,
    brand,
    minPrice,
    maxPrice,
    minYear,
    maxYear,
    status: 'active', // Solo mostrar listings activos en la página pública
    limit,
    skip,
    sortBy: 'views' // Usar ordenamiento inteligente que prioriza hot listings
  })
  
  const user = await getClerkUser(args)

  // Get brands for filter dropdown
  const brands = await ListingModel.getBrandStats()
  
  //  Verificar qué listings tienen like del usuario actual
  let likedListings: string[] = []
  if (user) {
    // Obtener los IDs de listings que el usuario ha marcado como favoritos
    const userLikes = await UserModel.findById(user._id!.toString())
    if (userLikes?.likedListings) {
      likedListings = userLikes.likedListings.map(id => id.toString())
    }
  }
  
  return json({ 
    listings, 
    search, 
    brand, 
    minPrice, 
    maxPrice, 
    minYear, 
    maxYear, 
    user,
    currentPage: page,
    totalPages: Math.ceil(totalCount.total / limit),
    totalCount: totalCount.total,
    brands: brands.map(b => b._id),
    likedListings 
  })
}

// Action para manejar likes/unlikes
export async function action(args: ActionFunctionArgs) {
  const user = await getClerkUser(args)
  
  if (!user) {
    return json({ error: "Debes iniciar sesión para dar like" }, { status: 401 })
  }

  const formData = await args.request.formData()
  const intent = formData.get("intent") as string
  const listingId = formData.get("listingId") as string

  if (!listingId) {
    return json({ error: "ID del listing requerido" }, { status: 400 })
  }

  try {
    switch (intent) {
      case "like": {
        const success = await UserModel.likeListing(user._id!.toString(), listingId)
        if (success) {
          return json({ success: true, action: "liked", listingId })
        } else {
          return json({ error: "No puedes dar like a tu propio auto" }, { status: 400 })
        }
      }
      
      case "unlike": {
        const success = await UserModel.unlikeListing(user._id!.toString(), listingId)
        if (success) {
          return json({ success: true, action: "unliked", listingId })
        } else {
          return json({ error: "No se pudo quitar el like" }, { status: 400 })
        }
      }
      
      default:
        return json({ error: "Acción no válida" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error en action:", error)
    return json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// Componente para el botón de like
function LikeButton({ listing, isLiked: initialLiked, user }: { 
  listing: any, 
  isLiked: boolean, 
  user: any 
}) {
  const fetcher = useFetcher()
  const isLoading = fetcher.state !== "idle"

  // Estado optimista para mostrar el like inmediatamente
  const getCurrentlyLiked = (): boolean => {
    // Si hay FormData pendiente (estado optimista)
    if (fetcher.formData) {
      const intent = fetcher.formData.get("intent")
      const fetcherListingId = fetcher.formData.get("listingId")
      const intentStr = typeof intent === 'string' ? intent : ''
      const listingIdStr = typeof fetcherListingId === 'string' ? fetcherListingId : ''
      
      // Solo aplicar estado optimista si es para este listing
      if (listingIdStr === listing._id) {
        return intentStr === "like"
      }
    }
    
    // Si hay respuesta del servidor
    if (fetcher.data) {
      const data = fetcher.data as ActionResponse | undefined
      // Solo aplicar si es para este listing
      if (data?.listingId === listing._id) {
        if (data?.action === "liked") return true
        if (data?.action === "unliked") return false
        if (data?.error) return initialLiked // Mantener estado original en error
      }
    }
    
    // Estado inicial del loader
    return initialLiked
  }

  const currentlyLiked = getCurrentlyLiked()

  // Mostrar feedback del fetcher
  useEffect(() => {
    if (fetcher.data) {
      const data = fetcher.data as ActionResponse | undefined
      
      // Solo mostrar toast si es para este listing
      if (data?.listingId === listing._id) {
        if (data?.error) {
          toast.error(data.error)
        } else if (data?.success) {
          if (data.action === "liked") {
            toast.success("Agregado a favoritos ❤️")
          } else if (data.action === "unliked") {
            toast.success("Removido de favoritos")
          }
        }
      }
    }
  }, [fetcher.data, listing._id])

  // Si no hay usuario, mostrar corazón clickeable que invita a registrarse
  if (!user) {
    return (
      <button
        onClick={() => {
          toast.error(
            "¡Inicia sesión para dar like! 💖",
            "Regístrate o inicia sesión para guardar tus autos favoritos"
          )
        }}
        className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-50 hover:scale-105 transition-all duration-200 cursor-pointer"
        title="Haz clic para registrarte y dar like"
      >
        <Heart className="w-5 h-5 text-gray-600 hover:text-red-600 hover:fill-current transition-colors" />
      </button>
    )
  }

  return (
    <fetcher.Form method="post" style={{ display: 'inline' }}>
      <input type="hidden" name="intent" value={currentlyLiked ? "unlike" : "like"} />
      <input type="hidden" name="listingId" value={listing._id} />
      <button
        type="submit"
        disabled={isLoading}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!isLoading) {
            e.currentTarget.form?.requestSubmit()
          }
        }}
        className={`absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 ${
          currentlyLiked
            ? 'hover:bg-red-50 scale-110'
            : 'hover:bg-white'
        } ${isLoading ? 'opacity-50 cursor-not-allowed animate-pulse' : 'hover:scale-105'}`}
        title={currentlyLiked ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      >
        <Heart
          className={`w-5 h-5 transition-all duration-200 ${
            currentlyLiked
              ? 'fill-red-500 text-red-500'
              : 'text-gray-600'
          }`}
        />
      </button>
    </fetcher.Form>
  )
}

export default function ListingsIndex() {
  const { 
    listings, 
    search, 
    brand, 
    minPrice, 
    maxPrice, 
    minYear, 
    maxYear, 
    user,
    currentPage,
    totalPages,
    totalCount,
    brands,
    likedListings 
  } = useLoaderData<typeof loader>()
  const [searchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [allListings, setAllListings] = useState(listings)
  const [nextPage, setNextPage] = useState(currentPage + 1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  const fetcher = useFetcher()
  
  // Referencia para el elemento de carga
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)
  
  // Configurar intersection observer
  useEffect(() => {
    const element = loadMoreRef.current
    if (!element || isLoadingMore || nextPage > totalPages) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
      observer.disconnect()
    }
  }, [isLoadingMore, nextPage, totalPages])

  // Función para cargar más resultados
  const loadMoreResults = () => {
    if (isLoadingMore || nextPage > totalPages) return;
    
    setIsLoadingMore(true);
    
    // Usar fetcher para cargar la siguiente página
    const searchParams = new URLSearchParams({
      ...(search && { search }),
      ...(brand && { brand }),
      ...(minPrice && { minPrice: minPrice.toString() }),
      ...(maxPrice && { maxPrice: maxPrice.toString() }),
      ...(minYear && { minYear: minYear.toString() }),
      ...(maxYear && { maxYear: maxYear.toString() }),
      page: nextPage.toString()
    });
    
    fetcher.load(`/listings?${searchParams.toString()}`);
  };

  // Efecto para cargar más cuando se detecta la intersección
  useEffect(() => {
    if (isIntersecting && !isLoadingMore && nextPage <= totalPages) {
      loadMoreResults()
    }
  }, [isIntersecting])

  // Manejar la respuesta del fetcher
  useEffect(() => {
    if (fetcher.data && fetcher.state === 'idle' && isLoadingMore) {
      const newData = fetcher.data as any;
      if (newData.listings && newData.listings.length > 0) {
        setAllListings(prev => [...prev, ...newData.listings]);
        setNextPage(prev => prev + 1);
      }
      setIsLoadingMore(false);
    }
  }, [fetcher.data, fetcher.state, isLoadingMore]);

  // Reset listings cuando cambian los filtros
  useEffect(() => {
    setAllListings(listings);
    setNextPage(currentPage + 1);
  }, [listings, currentPage]);

  const hasActiveFilters = brand || minPrice || maxPrice || minYear || maxYear

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Search and Filters Section */}
      <HeroSection 
        type="listings" 
        search={search} 
        totalCount={totalCount} 
        brandsCount={brands.length}
        listings={allListings}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters and View Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-colors ${
                hasActiveFilters || showFilters
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filtros</span>
              {hasActiveFilters && !showFilters && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </button>

            {allListings.length > 0 && (
              <span className="text-sm text-gray-600">
                {allListings.length} resultado{allListings.length !== 1 ? 's' : ''} de {totalCount}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Ver en cuadrícula"
              aria-label="Ver autos en formato cuadrícula"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Ver en lista"
              aria-label="Ver autos en formato lista"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Enhanced Filters Panel */}
        {showFilters && (
          <Card className="mb-12 bg-gradient-to-br from-red-50/50 to-gray-50/50 border-red-200/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-lg font-semibold text-gray-900">Filtros Avanzados</h3>
                {hasActiveFilters && (
                  <Chip color="danger" variant="flat" size="sm">
                    {[brand, minPrice, maxPrice, minYear, maxYear].filter(Boolean).length} activos
                  </Chip>
                )}
              </div>
            </CardHeader>
            <CardBody>
              <Form method="get" className="space-y-6">
                <input type="hidden" name="search" value={search} />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Select
                      name="brand"
                      label="Marca"
                      placeholder="Seleccionar marca"
                      defaultSelectedKeys={brand ? [brand] : []}
                      variant="flat"
                      classNames={{
                        trigger: "bg-white border-0"
                      }}
                    >
                      {brands.map((brandOption: string) => (
                        <SelectItem key={brandOption}>
                          {brandOption}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Input
                      type="number"
                      name="minYear"
                      label="Año mínimo"
                      placeholder="2010"
                      defaultValue={minYear?.toString() || ''}
                      min="1990"
                      max="2025"
                      variant="flat"
                      classNames={{
                        inputWrapper: "bg-white border-0"
                      }}
                    />
                  </div>

                  <div>
                    <Input
                      type="number"
                      name="minPrice"
                      label="Precio mínimo"
                      placeholder="50,000"
                      defaultValue={minPrice?.toString() || ''}
                      step="10000"
                      startContent={
                        <div className="pointer-events-none flex items-center">
                          <span className="text-default-400 text-small">$</span>
                        </div>
                      }
                      variant="flat"
                      classNames={{
                        inputWrapper: "bg-white border-0"
                      }}
                    />
                  </div>

                  <div>
                    <Input
                      type="number"
                      name="maxPrice"
                      label="Precio máximo"
                      placeholder="500,000"
                      defaultValue={maxPrice?.toString() || ''}
                      step="10000"
                      startContent={
                        <div className="pointer-events-none flex items-center">
                          <span className="text-default-400 text-small">$</span>
                        </div>
                      }
                      variant="flat"
                      classNames={{
                        inputWrapper: "bg-white border-0"
                      }}
                    />
                  </div>
                </div>

                <Divider />

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Button
                    type="submit"
                    color="danger"
                    size="lg"
                    className="font-medium"
                    endContent={<Filter className="w-4 h-4" />}
                  >
                    Aplicar Filtros
                  </Button>
                  
                  {hasActiveFilters && (
                    <Button
                      as={Link}
                      to="/listings"
                      variant="light"
                      color="default"
                      size="lg"
                    >
                      Limpiar Filtros
                    </Button>
                  )}
                  
                  <Spacer />
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Vista:</span>
                    <Button
                      isIconOnly
                      variant={viewMode === 'grid' ? 'solid' : 'light'}
                      color="default"
                      size="sm"
                      onPress={() => setViewMode('grid')}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      isIconOnly
                      variant={viewMode === 'list' ? 'solid' : 'light'}
                      color="default"
                      size="sm"
                      onPress={() => setViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Form>
            </CardBody>
          </Card>
        )}

        {/* Results */}
        {allListings.length > 0 ? (
          <div className={`grid gap-8 ${
            viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1 max-w-4xl mx-auto px-2 sm:px-4'
          }`}>
            {allListings.map((listing) => {
              //  Verificar si este listing tiene like del usuario
              const isLiked = likedListings.includes(listing._id)
              
              // 🔥 Algoritmo Hot View - Usar función inteligente del modelo
              const hotStatus = getHotStatus(listing as any)
              const isHot = hotStatus === 'hot'
              const isSuperHot = hotStatus === 'super-hot'
              
              return (
                <article
                  key={listing._id}
                  className={`group ${
                    viewMode === 'list' ? 'flex flex-col sm:flex-row sm:space-x-6 space-y-4 sm:space-y-0' : ''
                  } ${(isHot || isSuperHot) ? 'ring-2 ring-red-200 rounded-2xl p-2' : ''}`}
                >
                  <Link
                    to={`/listings/${listing._id}`}
                    className={`relative overflow-hidden rounded-2xl bg-gray-100 block ${
                      viewMode === 'list' ? 'w-full sm:w-80 h-48 xs:h-52 sm:h-60 flex-shrink-0' : 'aspect-[4/3]'
                    } ${(isHot || isSuperHot) ? 'border-2 border-red-300' : 'border border-gray-200 hover:border-red-300 transition-colors'}`}
                  >
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : listing.videos && listing.videos.length > 0 ? (
                      <div className="relative w-full h-full bg-black flex items-center justify-center">
                        <video
                          src={listing.videos[0]}
                          className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          muted
                          playsInline
                          preload="metadata"
                          autoPlay
                          loop
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center pointer-events-none">
                          <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                      </div>
                    )}
                    
                    <div className="absolute top-4 left-4 flex items-center space-x-2">
                      {listing.year && (
                        <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                          {listing.year}
                        </div>
                      )}
                      
                      {/* 🔥 Hot Badge */}
                      {isSuperHot && (
                        <div className="bg-gradient-to-r from-red-500 to-orange-500 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 animate-bounce">
                          <span>🔥🔥</span>
                          <span>Super Hot</span>
                        </div>
                      )}
                      {isHot && !isSuperHot && (
                        <div className="bg-red-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 animate-pulse">
                          <span>🔥</span>
                          <span>Hot</span>
                        </div>
                      )}
                    </div>

                    {/* Botón de like funcional */}
                    <LikeButton
                      listing={listing}
                      isLiked={isLiked}
                      user={user}
                    />
                  </Link>

                  <div className={`${viewMode === 'list' ? 'flex-1 py-2 w-full' : 'pt-6'}`}>
                    <Link
                      to={`/listings/${listing._id}`}
                      className="block"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 group-hover:text-gray-600 transition-colors line-clamp-1">
                            {capitalizeBrandInTitle(listing.title)}
                          </h3>
                          {listing.brand && listing.model && (
                            <p className="text-sm text-gray-500">
                              {capitalizeBrand(listing.brand)} {listing.model}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>

                    {listing.description && viewMode === 'list' && (
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {listing.description}
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                      <span className="text-xl sm:text-2xl font-light text-gray-900 truncate max-w-full">
                        ${listing.price ? formatPrice(listing.price) : '0'}
                      </span>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {listing.likesCount && listing.likesCount > 0 && (
                          <span className="flex items-center space-x-1">
                            <Heart className="w-4 h-4" />
                            <span>{listing.likesCount}</span>
                          </span>
                        )}
                        <span className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{listing.viewsCount || 0}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                      <div className="text-sm text-gray-500">
                        {/* Owner info removed - shown in detail page */}
                      </div>

                     <Link
  to={`/listings/${listing._id}`}
  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium group shadow-md hover:shadow-lg w-[110px] h-[45px] flex items-center justify-center text-center flex-shrink-0 text-sm gap-2"
>
  <span>Ver detalles</span>
  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
</Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-8 flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-light text-gray-900 mb-4">
              {search || hasActiveFilters ? 'Sin resultados' : 'No hay autos disponibles'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {search || hasActiveFilters
                ? 'Intenta ajustar tus filtros de búsqueda'
                : 'Estamos preparando increíbles autos para ti'
              }
            </p>
            
            <Link
              to="/"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              <span>Volver al inicio</span>
            </Link>
          </div>
        )}

        {/* Indicador de carga con lazy loading */}
        {nextPage <= totalPages && (
          <div ref={loadMoreRef} className="text-center mt-16 py-8 min-h-[60px] flex items-center justify-center">
            {isLoadingMore || fetcher.state === 'loading' ? (
              <div className="inline-flex items-center space-x-2 text-red-700">
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Cargando más autos...</span>
              </div>
            ) : (
              <div className="text-transparent">.</div>
            )}
          </div>
        )}

        {/* Botón manual de carga (solo visible si el lazy loading falla) */}
        {nextPage <= totalPages && !isLoadingMore && allListings.length > 0 && (
          <div className="text-center mt-4">
            <button
              onClick={loadMoreResults}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Cargar más manualmente
            </button>
          </div>
        )}

      </div>
    </div>
  )
}