import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "@remix-run/node"
import { useLoaderData, Link, Form, useFetcher, useSearchParams } from "@remix-run/react"
import { DEFAULT_SEO, generateBasicMeta } from "~/lib/seo"
import { ListingModel } from "~/models/Listing.server"
import { UserModel } from "~/models/User.server"
import { getClerkUser, ClerkAuth } from "~/lib/auth-clerk.server"
import { toast } from "~/components/ui/toast"
import { getHotStatus } from "~/models/Listing"
import { capitalizeBrandInTitle, capitalizeBrand } from "~/lib/utils"
import HeroSection from "~/components/HeroSection"
import {
  Search,
  Heart,
  Eye,
  Plus,
  Filter,
  Grid,
  List,
  ArrowRight,
  ChevronRight,
  X
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { formatPrice } from '~/utils/formatters'
import { motion } from 'framer-motion'

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
  Avatar,
  Divider,
  Spacer
} from "@heroui/react"

// Tipo para la respuesta del action
type ActionResponse = { success?: boolean; action?: 'liked' | 'unliked'; error?: string; listingId?: string }

// Meta function para SEO específico de la página de inicio
export const meta: MetaFunction = () => {
  return generateBasicMeta({
    title: DEFAULT_SEO.title,
    description: "Encuentra tu auto ideal en Cliquéalo.mx. Catálogo seleccionado de autos usados certificados con opciones de financiamiento y precios competitivos. La mejor experiencia de compra de autos en México.",
    url: DEFAULT_SEO.url,
    keywords: "autos usados, venta de carros, compra de vehículos, financiamiento automotriz, autos seminuevos, carros usados méxico, vehículos certificados, cliquéalo"
  });
};

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args
  const url = new URL(request.url)
  const search = url.searchParams.get("search") || ""
  const brand = url.searchParams.get("brand") || ""
  const minPrice = url.searchParams.get("minPrice") ? parseInt(url.searchParams.get("minPrice") || "") : undefined
  const maxPrice = url.searchParams.get("maxPrice") ? parseInt(url.searchParams.get("maxPrice") || "") : undefined
  const minYear = url.searchParams.get("minYear") ? parseInt(url.searchParams.get("minYear") || "") : undefined
  const maxYear = url.searchParams.get("maxYear") ? parseInt(url.searchParams.get("maxYear") || "") : undefined
  const page = parseInt(url.searchParams.get("page") || "1")
  const toastParam = url.searchParams.get("toast")
  const redirectTo = url.searchParams.get("redirectTo")
  
  // Get user first to check authentication status
  const user = await getClerkUser(args)
  
  // If user is authenticated and there's a redirectTo parameter, redirect them
  if (user && redirectTo) {
    const decodedRedirectTo = decodeURIComponent(redirectTo)
    // Validate that the redirect URL is safe (internal to our app)
    if (decodedRedirectTo.startsWith('/') && !decodedRedirectTo.startsWith('//')) {
      throw redirect(decodedRedirectTo)
    }
  }
  
  // Calculate pagination
  const limit = 24
  const skip = (page - 1) * limit
  
  console.log('🔍 Server pagination:', { page, limit, skip, requestUrl: request.url });
  
  // Force server log to show in browser console
  if (typeof window === 'undefined') {
    console.log('[SERVER] Processing page:', page, 'with skip:', skip);
  }
  
  const listings = await ListingModel.findMany({
    search,
    brand,
    minPrice,
    maxPrice,
    minYear,
    maxYear,
    status: 'active', // Solo mostrar listings activos en la página principal
    limit,
    skip,
    sortBy: 'views' // Usar ordenamiento inteligente que prioriza hot listings
  })
  
  console.log('📊 Server query result:', { 
    requestedLimit: limit, 
    requestedSkip: skip, 
    actualReturned: listings.length,
    firstListingId: listings[0]?._id,
    lastListingId: listings[listings.length - 1]?._id
  });

  // Add hot status to each listing on the server side
  const listingsWithHotStatus = listings.map((listing: any) => ({
    ...listing,
    hotStatus: getHotStatus(listing as any)
  }))
  
  // Check user permissions on the server side
  const canCreateListings = user ? ClerkAuth.canCreateListings(user) : false
  
  //  Verificar qué listings tienen like del usuario actual
  let likedListings: string[] = []
  if (user) {
    // Obtener los IDs de listings que el usuario ha marcado como favoritos
    const userLikes = await UserModel.findById(user._id!.toString())
    if (userLikes?.likedListings) {
      likedListings = userLikes.likedListings.map(id => id.toString())
    }
  }
  
  // Get total count for pagination info - use a more efficient approach
  // For now, let's use a conservative estimate and fix properly later
  const baseStats = await ListingModel.getStats()
  // Assume about 80% of listings are active as a rough estimate
  const estimatedActiveTotal = Math.floor(baseStats.total * 0.8)
  const actualTotal = Math.max(estimatedActiveTotal, listings.length + (page - 1) * limit + 1)
  
  console.log('📊 Pagination info:', {
    page,
    limit,
    skip,
    listingsReturned: listings.length,
    actualTotal,
    totalPages: Math.ceil(actualTotal / limit),
    hasMorePages: page < Math.ceil(actualTotal / limit)
  });
  
  const calculatedTotalPages = Math.ceil(actualTotal / limit)
  
  return json({
    listings: listingsWithHotStatus,
    search,
    brand,
    minPrice,
    maxPrice,
    minYear,
    maxYear,
    user,
    canCreateListings,
    likedListings,
    toastParam,
    currentPage: page,
    totalPages: calculatedTotalPages,
    totalCount: actualTotal,
    // Debug info
    debug: {
      requestedPage: page,
      limit,
      skip,
      actualReturned: listings.length,
      hasMore: listings.length === limit, // If we got exactly 'limit' results, there might be more
      serverUrl: request.url,
      searchParams: {
        search: search || 'none',
        brand: brand || 'none',
        minPrice: minPrice || 'none',
        maxPrice: maxPrice || 'none',
        minYear: minYear || 'none',
        maxYear: maxYear || 'none'
      },
      mongoQuery: {
        status: 'active',
        limit,
        skip,
        sortBy: 'views'
      }
    }
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

//  Componente para el botón de like
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
            "Inicia sesión para guardar",
            "Regístrate para guardar tus autos favoritos"
          )
        }}
        className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
        title="Guardar"
      >
        <Heart className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
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
        className={`w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all duration-200 ${
          currentlyLiked
            ? 'bg-gray-900'
            : 'hover:bg-gray-100'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={currentlyLiked ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      >
        <Heart
          className={`w-4 h-4 transition-colors ${
            currentlyLiked
              ? 'fill-white text-white'
              : 'text-gray-400'
          }`}
        />
      </button>
    </fetcher.Form>
  )
}

export default function Index() {
  const {
    listings,
    search,
    brand,
    minPrice,
    maxPrice,
    minYear,
    maxYear,
    user,
    canCreateListings,
    likedListings,
    toastParam,
    currentPage,
    totalPages,
    totalCount,
    debug
  } = useLoaderData<typeof loader>()
  
  console.log('📊 Initial loader data:', { currentPage, totalPages, totalCount, debug });
  console.log('📄 Server debug info:', debug);
  const [searchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)
  
  // Estado para manejar la carga infinita
  const [allListings, setAllListings] = useState(listings)
  const [nextPage, setNextPage] = useState(currentPage + 1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [showPopupModal, setShowPopupModal] = useState(false)
  const [popupCar, setPopupCar] = useState(null)
  const [showCreditForm, setShowCreditForm] = useState(false)
  const [creditFormData, setCreditFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })

  // Algorithm to prioritize less viewed cars
  const sortedListings = [...allListings].sort((a, b) => {
    const viewsA = a.viewsCount || 0;
    const viewsB = b.viewsCount || 0;
    
    // First priority: Cars with very low views (0-30)
    if (viewsA <= 30 && viewsB > 30) return -1;
    if (viewsB <= 30 && viewsA > 30) return 1;
    
    // Second priority: Among low-view cars, show newer cars first
    if (viewsA <= 30 && viewsB <= 30) {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    
    // Third priority: Sort by views ascending (less viewed first)
    return viewsA - viewsB;
  });
  
  const fetcher = useFetcher()

  const hasActiveFilters = brand || minPrice || maxPrice || minYear || maxYear

  // Detectar si se debe mostrar un mensaje de sign-in
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const shouldSignIn = urlParams.get('signin') === 'true'
    const redirectTo = urlParams.get('redirectTo')
    
    if (shouldSignIn && !user) {
      // Mostrar un toast informativo para que el usuario sepa que debe iniciar sesión
      toast.error(
        'Inicia sesión para continuar',
        redirectTo ? 'Necesitas una cuenta para acceder a esta función. Usa los botones de "Entrar" o "Registrarse" en la parte superior.' : 'Usa los botones de "Entrar" o "Registrarse" en la parte superior.'
      )
    }
  }, [user])

  // Manejar toast para listing no encontrado
  useEffect(() => {
    if (toastParam === 'listing-not-found') {
      toast.error(
        'El elemento que buscas ya no existe',
        'Es posible que haya sido eliminado o movido. Te hemos redirigido al catálogo principal.'
      )
    }
  }, [toastParam])

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
    // More dynamic check - allow loading if we have exactly limit results in the last batch
    const shouldAllowMore = allListings.length % 24 === 0 && allListings.length > 0;
    
    if (isLoadingMore) {
      console.log('🚫 Load more blocked: already loading');
      return;
    }
    
    if (nextPage > totalPages && !shouldAllowMore) {
      console.log('🚫 Load more blocked:', { isLoadingMore, nextPage, totalPages, shouldAllowMore });
      return;
    }
    
    console.log('🚀 Loading page:', nextPage, 'of', totalPages);
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
    
    const url = `/?${searchParams.toString()}`;
    console.log('🔗 Fetching URL:', url);
    // Submit a GET request to ensure it hits the index route loader
    fetcher.submit(searchParams, { method: 'get' });
  };

  // Efecto para cargar más cuando se detecta la intersección
  useEffect(() => {
    if (isIntersecting && !isLoadingMore) {
      loadMoreResults()
    }
  }, [isIntersecting])

  // Manejar la respuesta del fetcher
  useEffect(() => {
    if (fetcher.data && fetcher.state === 'idle' && isLoadingMore) {
      const newData = fetcher.data as any;
      console.log('🔥 Fetcher data received:', { 
        page: nextPage, 
        newListingsCount: newData.listings?.length || 0,
        currentListingsCount: allListings.length,
        totalPages,
        totalCount,
        serverDebug: newData.debug,
        fullResponse: newData
      });
      
      // Check if we're getting the expected response structure
      if (!newData.debug) {
        console.error('⚠️ Missing debug info in fetcher response - response structure may be wrong');
        console.log('📋 Full fetcher response keys:', Object.keys(newData));
      }
      
      if (newData.listings && newData.listings.length > 0) {
        setAllListings(prev => {
          // Remove duplicates by checking IDs
          const existingIds = new Set(prev.map(item => item._id));
          const newListings = newData.listings.filter(item => !existingIds.has(item._id));
          
          console.log('🔥 New unique listings to add:', newListings.length);
          console.log('🔥 Existing listings:', prev.length);
          
          if (newListings.length === 0) {
            console.log('⚠️ All listings from this page were duplicates - stopping pagination');
            // Set a flag to prevent further loading attempts
            setNextPage(totalPages + 1); // This will prevent more loading attempts
            return prev; // No new listings to add
          }
          
          const combined = [...prev, ...newListings];
          console.log('🔥 Total after deduplication:', combined.length);
          
          // Check if we've reached the actual total count
          if (combined.length >= totalCount) {
            console.log('🏁 Reached total count limit, stopping pagination');
            setNextPage(totalPages + 1); // Prevent further loading
          }
          
          return combined;
        });
        setNextPage(prev => prev + 1);
      } else {
        console.log('⚠️ No new listings received or empty array');
        // If no more listings, we've reached the end
        console.log('🏁 Reached end of listings');
      }
      setIsLoadingMore(false);
    }
  }, [fetcher.data, fetcher.state, isLoadingMore]);

  // Reset listings cuando cambian los filtros
  useEffect(() => {
    setAllListings(listings);
    setNextPage(currentPage + 1);
  }, [listings, currentPage]);

  // Session-based popup modal (like Shein/AliExpress/Temu)
  useEffect(() => {
    const hasShownPopup = sessionStorage.getItem('creditPopupShown');
    console.log('🔔 Popup check:', { hasShownPopup, listingsCount: allListings.length });
    
    if (!hasShownPopup && allListings.length > 0) {
      let triggered = false;
      
      const showPopup = () => {
        if (triggered) return;
        triggered = true;
        
        const lowViewedCars = allListings.filter(car => (car.viewsCount || 0) <= 50);
        console.log('🚗 Low viewed cars:', lowViewedCars.length);
        
        // If no low-viewed cars, use any car
        const carsToChooseFrom = lowViewedCars.length > 0 ? lowViewedCars : allListings;
        
        if (carsToChooseFrom.length > 0) {
          const randomCar = carsToChooseFrom[Math.floor(Math.random() * carsToChooseFrom.length)];
          console.log('📢 Showing popup for:', randomCar.title);
          setPopupCar(randomCar);
          setShowPopupModal(true);
          setShowCreditForm(false); // Reset form state
          setCreditFormData({ name: '', email: '', phone: '' }); // Reset form data
          sessionStorage.setItem('creditPopupShown', 'true');
        }
      };

      // Multiple triggers for more "sudden" appearance
      const scrollTrigger = () => {
        if (window.scrollY > 200) {
          console.log('📜 Scroll trigger activated');
          showPopup();
          window.removeEventListener('scroll', scrollTrigger);
        }
      };

      const mouseTrigger = (e) => {
        // Show when mouse moves to top of screen (exit intent)
        if (e.clientY <= 10) {
          console.log('🖱️ Exit intent trigger activated');
          showPopup();
          document.removeEventListener('mousemove', mouseTrigger);
        }
      };

      // Timer trigger (faster for testing)
      const timer = setTimeout(() => {
        console.log('⏰ Timer trigger activated');
        showPopup();
      }, 5000); // Reduced to 5 seconds for testing

      // Add event listeners
      window.addEventListener('scroll', scrollTrigger);
      document.addEventListener('mousemove', mouseTrigger);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('scroll', scrollTrigger);
        document.removeEventListener('mousemove', mouseTrigger);
      };
    }
  }, [allListings]);

  return (
    <div>
      {/* Hero Section with Stats */}
      <HeroSection type="home" search={search} listings={allListings} />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                {allListings.length} resultado{allListings.length !== 1 ? 's' : ''}
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
                      <SelectItem key="Nissan">Nissan</SelectItem>
                      <SelectItem key="Honda">Honda</SelectItem>
                      <SelectItem key="Toyota">Toyota</SelectItem>
                      <SelectItem key="Volkswagen">Volkswagen</SelectItem>
                      <SelectItem key="Ford">Ford</SelectItem>
                      <SelectItem key="Chevrolet">Chevrolet</SelectItem>
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
                      to="/"
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

        {/* Results Grid */}
        {allListings.length > 0 ? (
          <div className={`${
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4 max-w-4xl mx-auto'
          }`}>
            {sortedListings.map((listing) => {
              //  Verificar si este listing tiene like del usuario
              const isLiked = likedListings.includes(listing._id)
              
              // 🔥 Algoritmo Hot View - Usar hotStatus pre-calculado del servidor
              const hotStatus = listing.hotStatus
              const isHot = hotStatus === 'hot'
              const isSuperHot = hotStatus === 'super-hot'
              
              return (
                <article
                  key={listing._id}
                  className={`group ${
                    viewMode === 'list' ? 'flex gap-6 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors' : ''
                  }`}
                >
                  <Link
                    to={`/listings/${listing._id}`}
                    className={`relative overflow-hidden bg-gray-100 block ${
                      viewMode === 'list' ? 'w-64 h-48 flex-shrink-0 rounded-lg' : 'aspect-[4/3] rounded-lg border border-gray-200 hover:border-gray-400 transition-colors'
                    }`}
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
                    
                    {/* Minimalist Badge */}
                    {listing.year && (
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
                        {listing.year}
                      </div>
                    )}

                    {/* Minimalist Like Button */}
                    <div className="absolute top-3 right-3">
                      <LikeButton
                        listing={listing}
                        isLiked={isLiked}
                        user={user}
                      />
                    </div>
                  </Link>

                  <div className={`${viewMode === 'list' ? 'flex-1' : 'pt-4'}`}>
                    <Link
                      to={`/listings/${listing._id}`}
                      className="block"
                    >
                      <h3 className="text-base font-medium text-gray-900 mb-1 line-clamp-1">
                        {capitalizeBrandInTitle(listing.title)}
                      </h3>
                      {listing.brand && (
                        <p className="text-sm text-gray-500 mb-3">
                          {capitalizeBrand(listing.brand)} {listing.model || ''}
                        </p>
                      )}
                    </Link>

                    {listing.description && viewMode === 'list' && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {listing.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-bold text-gray-900">
                        ${listing.price ? formatPrice(listing.price) : '0'}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {listing.viewsCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {listing.viewsCount}
                          </span>
                        )}
                        {listing.likesCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {listing.likesCount}
                          </span>
                        )}
                      </div>
                    </div>


                    {viewMode === 'list' && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {listing.owner?.name || 'Vendedor'}
                        </span>
                        <Link
                          to={`/listings/${listing._id}`}
                          className="text-sm font-medium text-gray-900 hover:text-gray-700 transition-colors flex items-center gap-1"
                        >
                          Ver detalles
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-32">
            <div className="w-16 h-16 border-2 border-gray-200 rounded-lg mx-auto mb-6 flex items-center justify-center">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search || hasActiveFilters ? 'Sin resultados' : 'Catálogo vacío'}
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              {search || hasActiveFilters
                ? 'Prueba con otros filtros'
                : 'Aún no hay autos disponibles'
              }
            </p>
            
            {user && canCreateListings && (
              <Link
                to="/listings/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar auto
              </Link>
            )}
          </div>
        )}

        {/* Minimalist Load More */}
        {nextPage <= totalPages && (
          <div ref={loadMoreRef} className="mt-12 py-8 flex items-center justify-center">
            {isLoadingMore || fetcher.state === 'loading' ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                Cargando...
              </div>
            ) : (
              <div className="h-4"></div>
            )}
          </div>
        )}

        {/* Footer info */}

      </div>

      {/* Session Popup Modal - Shein/AliExpress Style */}
      {showPopupModal && popupCar && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ 
              opacity: 0,
              y: 10
            }}
            animate={{ 
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 0.3,
              ease: "easeOut"
            }}
            className="bg-white border border-gray-200 rounded-lg max-w-sm w-full shadow-sm overflow-hidden"
          >
            {/* Minimalist header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Financiamiento disponible</h3>
                <button
                  onClick={() => setShowPopupModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Car Image - Clean */}
            <div className="relative h-40 bg-gray-50">
              {popupCar.images?.[0] && (
                <img 
                  src={popupCar.images[0]} 
                  alt={popupCar.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Content - Minimal */}
            <div className="p-4">
              {!showCreditForm ? (
                <>
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-900">{popupCar.title}</p>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">
                      ${popupCar.price ? formatPrice(popupCar.price) : '0'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Enganche desde ${popupCar.price ? formatPrice(Math.floor(popupCar.price * 0.1)) : '0'}
                    </p>
                  </div>

                  {/* Simple benefits */}
                  <div className="space-y-1 mb-4 text-xs text-gray-600">
                    <div>• Pre-aprobación en 24h</div>
                    <div>• Tasas competitivas</div>
                    <div>• Hasta 72 meses</div>
                  </div>

                  {/* CTA Buttons - Minimal */}
                  <div className="space-y-2">
                    <button 
                      onClick={() => setShowCreditForm(true)}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                    >
                      Solicitar financiamiento
                    </button>
                    
                    <button
                      onClick={() => setShowPopupModal(false)}
                      className="w-full text-gray-500 text-xs hover:text-gray-700 py-1"
                    >
                      Cerrar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Credit Application Form */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-900 mb-3">Datos para tu solicitud</p>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Nombre completo</label>
                        <input
                          type="text"
                          value={creditFormData.name}
                          onChange={(e) => setCreditFormData({...creditFormData, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                          placeholder="Juan Pérez"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Email</label>
                        <input
                          type="email"
                          value={creditFormData.email}
                          onChange={(e) => setCreditFormData({...creditFormData, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                          placeholder="juan@email.com"
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs text-gray-600">Teléfono</label>
                          <span className={`text-xs ${creditFormData.phone.length === 10 ? 'text-green-600' : 'text-gray-400'}`}>
                            {creditFormData.phone.length}/10
                          </span>
                        </div>
                        <input
                          type="tel"
                          value={creditFormData.phone}
                          onChange={(e) => {
                            // Only allow numbers and limit to 10 digits
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setCreditFormData({...creditFormData, phone: value});
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                          placeholder="5512345678"
                          maxLength="10"
                          pattern="[0-9]{10}"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <p className="text-xs text-gray-600 mb-2">Documentos necesarios:</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      <li>• INE vigente</li>
                      <li>• Comprobante de domicilio</li>
                      <li>• Comprobante de ingresos</li>
                      <li>• Referencias personales</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        // Validate phone has exactly 10 digits
                        if (creditFormData.name && creditFormData.email && creditFormData.phone && creditFormData.phone.length === 10) {
                          // Create WhatsApp message
                          const whatsappMessage = {
                            solicitud: "CRÉDITO AUTOMOTRIZ",
                            auto: popupCar.title,
                            listingId: popupCar._id,
                            precio: `$${popupCar.price ? formatPrice(popupCar.price) : '0'}`,
                            enganche: `$${popupCar.price ? formatPrice(Math.floor(popupCar.price * 0.1)) : '0'}`,
                            cliente: {
                              nombre: creditFormData.name,
                              email: creditFormData.email,
                              telefono: creditFormData.phone
                            },
                            vendedor: popupCar.owner?.name || popupCar.user || 'Vendedor',
                            link: `${window.location.origin}/listings/${popupCar._id}`,
                            fecha: new Date().toLocaleString('es-MX')
                          };

                          const message = encodeURIComponent(
                            `🚗 *SOLICITUD DE CRÉDITO - CLIQUÉALO*\n\n` +
                            `*Auto:* ${whatsappMessage.auto}\n` +
                            `*ID:* ${whatsappMessage.listingId}\n` +
                            `*Precio:* ${whatsappMessage.precio}\n` +
                            `*Enganche sugerido:* ${whatsappMessage.enganche}\n\n` +
                            `👤 *DATOS DEL CLIENTE:*\n` +
                            `• Nombre: ${whatsappMessage.cliente.nombre}\n` +
                            `• Email: ${whatsappMessage.cliente.email}\n` +
                            `• Teléfono: ${whatsappMessage.cliente.telefono}\n\n` +
                            `🔗 *Link del auto:* ${whatsappMessage.link}\n` +
                            `📅 *Fecha solicitud:* ${whatsappMessage.fecha}\n\n` +
                            `📋 *Documentos requeridos:*\n` +
                            `• INE vigente\n` +
                            `• Comprobante de domicilio\n` +
                            `• Comprobante de ingresos\n` +
                            `• Referencias personales\n\n` +
                            `---\n` +
                            `_Mensaje generado desde Cliquéalo.mx_`
                          );

                          // Get seller's WhatsApp number from listing or use default
                          const salesWhatsApp = popupCar.contactInfo?.whatsapp || 
                                                popupCar.contactInfo?.phone || 
                                                '5215512345678'; // Default number if no contact info
                          
                          // Open WhatsApp
                          window.open(`https://wa.me/${salesWhatsApp}?text=${message}`, '_blank');
                          
                          // Reset and close
                          setShowPopupModal(false);
                          setShowCreditForm(false);
                          setCreditFormData({ name: '', email: '', phone: '' });
                          
                          // Optional: Show success message
                          alert('Tu solicitud ha sido enviada. Un asesor te contactará pronto.');
                        } else {
                          if (creditFormData.phone && creditFormData.phone.length !== 10) {
                            alert('El teléfono debe tener exactamente 10 dígitos');
                          } else {
                            alert('Por favor completa todos los campos');
                          }
                        }
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                    >
                      Enviar solicitud por WhatsApp
                    </button>
                    
                    <button
                      onClick={() => setShowCreditForm(false)}
                      className="w-full text-gray-500 text-xs hover:text-gray-700 py-1"
                    >
                      Regresar
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

    </div>
  )
}