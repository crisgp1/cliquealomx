import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node"
import { Form, Link, useLoaderData, useNavigation, useSearchParams, useSubmit } from "@remix-run/react"
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useEffect } from 'react'
import { requireClerkAdmin } from "~/lib/auth-clerk.server"
import { db } from "~/lib/db.server"
import { ListingModel } from "~/models/Listing.server"
import { AdminLayout } from "~/components/admin/AdminLayout"
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  MoreHorizontal,
  Car,
  TrendingUp,
  AlertTriangle,
  FileText,
  Upload,
  Download,
  ExternalLink
} from 'lucide-react'
import { useState } from 'react'
import { MediaUpload } from '~/components/ui/media-upload'
import type { MediaItem } from '~/components/ui/media-upload'
import { PDFViewerModal } from '~/components/ui/pdf-viewer-modal'

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;
  // Ensure user is admin
  await requireClerkAdmin(args)
  
  // Parse URL params for filtering and pagination
  const url = new URL(request.url)
  const search = url.searchParams.get("search") || ""
  const brand = url.searchParams.get("brand") || ""
  const status = url.searchParams.get("status") || ""
  const sortBy = url.searchParams.get("sortBy") || "recent"
  const page = parseInt(url.searchParams.get("page") || "1")
  const limit = 15
  const skip = (page - 1) * limit
  
  // Fetch listings with filters
  const listings = await ListingModel.findMany({
    search,
    brand,
    status: status ? (status as 'active' | 'sold' | 'reserved' | 'inactive') : undefined, // Si no hay status, mostrar todos
    sortBy: sortBy as any,
    limit,
    skip
  })
  
  // Get total count for pagination
  const totalCount = await ListingModel.getStats()
  
  // Get brands for filter dropdown (todas las marcas, no solo activas)
  const brands = await ListingModel.getAllBrandStats()
  
  return json({ 
    listings, 
    totalCount: totalCount.total,
    currentPage: page,
    totalPages: Math.ceil(totalCount.total / limit),
    brands: brands.map(b => b._id),
    filters: { search, brand, status, sortBy }
  })
}

export async function action(args: ActionFunctionArgs) {
  const { request } = args;
  // Ensure user is admin
  const user = await requireClerkAdmin(args)
  
  const formData = await request.formData()
  const intent = formData.get("intent") as string
  const listingId = formData.get("listingId") as string
  
  if (!listingId) {
    return json({ error: "ID del listing es requerido" }, { status: 400 })
  }
  
  try {
    switch (intent) {
      case "delete": {
        const success = await ListingModel.delete(listingId)
        if (!success) {
          return json({ error: "Error al eliminar el listing" }, { status: 500 })
        }
        return json({ success: true })
      }
      
      case "activate": {
        const success = await ListingModel.updateStatus(listingId, "active")
        if (!success) {
          return json({ error: "Error al actualizar el status" }, { status: 500 })
        }
        return json({ success: true })
      }
      
      case "deactivate": {
        const success = await ListingModel.updateStatus(listingId, "inactive")
        if (!success) {
          return json({ error: "Error al actualizar el status" }, { status: 500 })
        }
        return json({ success: true })
      }
      
      case "mark-sold": {
        const success = await ListingModel.updateStatus(listingId, "sold", new Date())
        if (!success) {
          return json({ error: "Error al actualizar el status" }, { status: 500 })
        }
        return json({ success: true })
      }
      
      case "mark-reserved": {
        const success = await ListingModel.updateStatus(listingId, "reserved")
        if (!success) {
          return json({ error: "Error al actualizar el status" }, { status: 500 })
        }
        return json({ success: true })
      }
      
      case "toggle-featured": {
        const success = await ListingModel.toggleFeatured(listingId)
        if (!success) {
          return json({ error: "Error al actualizar el listing" }, { status: 500 })
        }
        return json({ success: true })
      }
      
      default:
        return json({ error: "Acción no válida" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error en action:", error)
    return json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export default function AdminListings() {
  const { 
    listings, 
    totalCount, 
    currentPage, 
    totalPages, 
    brands,
    filters 
  } = useLoaderData<typeof loader>()
  
  const navigation = useNavigation()
  const submit = useSubmit()
  const [searchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [actionListingId, setActionListingId] = useState<string | null>(null)
  const [showDocumentsModal, setShowDocumentsModal] = useState(false)
  const [selectedListingForDocs, setSelectedListingForDocs] = useState<any>(null)
  const [showMissingDataModal, setShowMissingDataModal] = useState(false)
  const [selectedListingForMissingData, setSelectedListingForMissingData] = useState<any>(null)
  const [vehicleDocuments, setVehicleDocuments] = useState<any[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadFormData, setUploadFormData] = useState({
    name: '',
    type: 'factura',
    notes: ''
  })
  const [uploadingFile, setUploadingFile] = useState(false)
  const [tempUploadedFiles, setTempUploadedFiles] = useState<MediaItem[]>([])
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [selectedPDFUrl, setSelectedPDFUrl] = useState('')
  const [selectedPDFTitle, setSelectedPDFTitle] = useState('')
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState('')
  const [selectedImageTitle, setSelectedImageTitle] = useState('')
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  const isSubmitting = navigation.state === "submitting"
  
  const statusOptions = [
    { value: "", label: "Todos" },
    { value: "active", label: "Activos" },
    { value: "inactive", label: "Inactivos" },
    { value: "sold", label: "Vendidos" },
    { value: "reserved", label: "Reservados" }
  ]
  
  const sortOptions = [
    { value: "recent", label: "Más recientes" },
    { value: "price_low", label: "Menor precio" },
    { value: "price_high", label: "Mayor precio" },
    { value: "views", label: "Más vistas" },
    { value: "popular", label: "Más gustados" }
  ]
  
  const clearFilters = () => {
    submit({}, { method: "get" })
  }

  const openDocumentsModal = async (listing: any) => {
    setSelectedListingForDocs(listing)
    setShowDocumentsModal(true)
    await loadVehicleDocuments(listing._id)
  }

  const openMissingDataModal = (listing: any) => {
    setSelectedListingForMissingData(listing)
    setShowMissingDataModal(true)
  }

  const loadVehicleDocuments = async (listingId: string) => {
    setIsLoadingDocuments(true)
    try {
      const response = await fetch('/api/vehicle-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          intent: 'get-documents',
          listingId
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setVehicleDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedListingForDocs || !uploadFormData.name || tempUploadedFiles.length === 0) return

    setUploadingFile(true)

    try {
      // Usar la URL del archivo ya subido por MediaUpload
      const uploadedFile = tempUploadedFiles[0]
      
      // Guardar la información del documento con la URL obtenida
      const response = await fetch('/api/vehicle-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          intent: 'add-document',
          listingId: selectedListingForDocs._id,
          name: uploadFormData.name,
          type: uploadFormData.type,
          url: uploadedFile.url,
          notes: uploadFormData.notes
        })
      })

      if (response.ok) {
        await loadVehicleDocuments(selectedListingForDocs._id)
        setShowUploadForm(false)
        setUploadFormData({ name: '', type: 'factura', notes: '' })
        setTempUploadedFiles([])
      } else {
        alert('Error al guardar el documento')
      }
    } catch (error) {
      console.error('Error saving document:', error)
      alert('Error al guardar el documento')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleMediaChange = (items: MediaItem[]) => {
    setTempUploadedFiles(items)
  }

  const openPDFModal = (url: string, title: string) => {
    setSelectedPDFUrl(url)
    setSelectedPDFTitle(title)
    setShowPDFModal(true)
  }

  const openImageModal = (url: string, title: string) => {
    setSelectedImageUrl(url)
    setSelectedImageTitle(title)
    setShowImageModal(true)
  }

  const isPDF = (url: string) => {
    return url.toLowerCase().endsWith('.pdf')
  }

  const isImage = (url: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    return imageExtensions.some(ext => url.toLowerCase().endsWith(ext))
  }

  const handleRemoveDocument = async (documentId: string) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return

    try {
      const response = await fetch('/api/vehicle-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          intent: 'remove-document',
          listingId: selectedListingForDocs._id,
          documentId
        })
      })

      if (response.ok) {
        await loadVehicleDocuments(selectedListingForDocs._id)
      } else {
        alert('Error al eliminar el documento')
      }
    } catch (error) {
      console.error('Error removing document:', error)
      alert('Error al eliminar el documento')
    }
  }

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!uploadFormData.name || tempUploadedFiles.length === 0) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    setUploadingFile(true)

    try {
      const response = await fetch('/api/vehicle-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          intent: 'add-document',
          listingId: selectedListingForDocs._id,
          name: uploadFormData.name,
          type: uploadFormData.type,
          notes: uploadFormData.notes,
          url: tempUploadedFiles[0].url
        })
      })

      if (response.ok) {
        await loadVehicleDocuments(selectedListingForDocs._id)
        setShowUploadForm(false)
        setUploadFormData({ name: '', type: 'factura', notes: '' })
        setTempUploadedFiles([])
      } else {
        alert('Error al subir el documento')
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      alert('Error al subir el documento')
    } finally {
      setUploadingFile(false)
    }
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Activo
          </span>
        )
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            <XCircle className="w-3 h-3" />
            Inactivo
          </span>
        )
      case 'sold':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Vendido
          </span>
        )
      case 'reserved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            <Clock className="w-3 h-3" />
            Reservado
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            <AlertCircle className="w-3 h-3" />
            Desconocido
          </span>
        )
    }
  }

  // Función para detectar datos faltantes en un listing
  const hasMissingData = (listing: any) => {
    const requiredFields = [
      'serialNumber', // NIV/VIN
      'motorNumber',  // Número de motor
      'color',        // Color
    ]
    
    // Verificar campos específicos que pueden estar faltantes
    const missingFields = requiredFields.filter(field => {
      const value = listing[field]
      return !value || (typeof value === 'string' && value.trim() === '')
    })
    
    return missingFields.length > 0
  }

  // Función para obtener lista detallada de datos faltantes
  const getMissingDataDetails = (listing: any) => {
    const fieldLabels: { [key: string]: string } = {
      'serialNumber': 'NIV (Número de Identificación Vehicular)',
      'motorNumber': 'Número de Motor',
      'color': 'Color del Vehículo'
    }
    
    const requiredFields = ['serialNumber', 'motorNumber', 'color']
    
    return requiredFields.filter(field => {
      const value = listing[field]
      return !value || (typeof value === 'string' && value.trim() === '')
    }).map(field => ({
      field,
      label: fieldLabels[field],
      required: true
    }))
  }

  // Función para generar el indicador de datos faltantes
  const getMissingDataIndicator = (listing: any) => {
    if (!hasMissingData(listing)) return null
    
    return (
      <button 
        onClick={() => openMissingDataModal(listing)}
        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-600 rounded border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
        title="Click para ver datos faltantes"
      >
        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
        Datos faltantes
      </button>
    )
  }
  
  return (
    <>
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestión de Listings
            </h1>
            <p className="text-gray-600">
              {totalCount} listings registrados en la plataforma
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0">
            <Link
              to="/listings/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Listing</span>
            </Link>
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Form method="get" className="flex-1 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="search"
                    name="search"
                    defaultValue={filters.search}
                    placeholder="Buscar por título, marca, modelo..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg border transition-colors ${
                    showFilters ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>
              
              {showFilters && (
                <div className="flex flex-wrap gap-3">
                  <select
                    name="brand"
                    defaultValue={filters.brand}
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  >
                    <option value="">Todas las marcas</option>
                    {brands.map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                  
                  <select
                    name="status"
                    defaultValue={filters.status}
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  
                  <select
                    name="sortBy"
                    defaultValue={filters.sortBy}
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  
                  {(filters.search || filters.brand || filters.status !== "" || filters.sortBy !== "recent") && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Limpiar</span>
                    </button>
                  )}
                </div>
              )}
              
              <button
                type="submit"
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Buscar
              </button>
            </Form>
          </div>
        </div>
        
        {/* Listings Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {listings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Listing
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estadísticas
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {listings.map((listing: any) => (
                    <tr key={listing._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 mr-3">
                            {listing.images && listing.images[0] ? (
                              <img
                                className="h-10 w-10 rounded-md object-cover"
                                src={listing.images[0]}
                                alt={listing.title}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                                <Car className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 line-clamp-1 max-w-xs">
                              {listing.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {listing.brand} {listing.model} • {listing.year}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${listing.price?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap items-center gap-1">
                          {getStatusBadge(listing.status)}
                          {listing.isFeatured && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              Destacado
                            </span>
                          )}
                          {getMissingDataIndicator(listing)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {listing.viewsCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            ❤️
                            {listing.likesCount || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(listing.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/listings/${listing._id}`}
                            className="p-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                            title="Ver"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          
                          <button
                            onClick={() => openDocumentsModal(listing)}
                            className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                            title="Ver documentos del vehículo"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          
                          <Link
                            to={`/listings/${listing._id}/edit`}
                            className="p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          
                          <div className="relative">
                            <button
                              onClick={() => setActionListingId(actionListingId === listing._id ? null : listing._id)}
                              className="p-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                              title="Más acciones"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            
                            {actionListingId === listing._id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                <div className="py-1">
                                  {listing.status !== "active" && (
                                    <Form method="post" className="block">
                                      <input type="hidden" name="listingId" value={listing._id} />
                                      <input type="hidden" name="intent" value="activate" />
                                      <button
                                        type="submit"
                                        className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                      >
                                        Activar
                                      </button>
                                    </Form>
                                  )}
                                  
                                  {listing.status !== "inactive" && (
                                    <Form method="post" className="block">
                                      <input type="hidden" name="listingId" value={listing._id} />
                                      <input type="hidden" name="intent" value="deactivate" />
                                      <button
                                        type="submit"
                                        className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                      >
                                        Desactivar
                                      </button>
                                    </Form>
                                  )}
                                  
                                  {listing.status !== "sold" && (
                                    <Form method="post" className="block">
                                      <input type="hidden" name="listingId" value={listing._id} />
                                      <input type="hidden" name="intent" value="mark-sold" />
                                      <button
                                        type="submit"
                                        className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                      >
                                        Marcar como vendido
                                      </button>
                                    </Form>
                                  )}
                                  
                                  {listing.status !== "reserved" && (
                                    <Form method="post" className="block">
                                      <input type="hidden" name="listingId" value={listing._id} />
                                      <input type="hidden" name="intent" value="mark-reserved" />
                                      <button
                                        type="submit"
                                        className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                      >
                                        Marcar como reservado
                                      </button>
                                    </Form>
                                  )}
                                  
                                  <Form method="post" className="block">
                                    <input type="hidden" name="listingId" value={listing._id} />
                                    <input type="hidden" name="intent" value="toggle-featured" />
                                    <button
                                      type="submit"
                                      className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                    >
                                      {listing.isFeatured ? "Quitar destacado" : "Destacar"}
                                    </button>
                                  </Form>
                                  
                                  <div className="border-t border-gray-100 my-1"></div>
                                  
                                  <Form method="post" className="block" onSubmit={(e) => {
                                    if (!confirm("¿Estás seguro de eliminar este listing? Esta acción no se puede deshacer.")) {
                                      e.preventDefault()
                                    }
                                  }}>
                                    <input type="hidden" name="listingId" value={listing._id} />
                                    <input type="hidden" name="intent" value="delete" />
                                    <button
                                      type="submit"
                                      className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50"
                                    >
                                      Eliminar
                                    </button>
                                  </Form>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center">
              <ListFilter className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay listings</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron listings con los filtros aplicados.
              </p>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{(currentPage - 1) * 15 + 1}</span> a <span className="font-medium">
                      {Math.min(currentPage * 15, totalCount)}
                    </span> de <span className="font-medium">{totalCount}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <Link
                      to={`?${new URLSearchParams({
                        ...Object.fromEntries(searchParams.entries()),
                        page: (currentPage - 1).toString()
                      })}`}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                      aria-disabled={currentPage === 1}
                      tabIndex={currentPage === 1 ? -1 : 0}
                    >
                      <span className="sr-only">Anterior</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </Link>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Link
                        key={page}
                        to={`?${new URLSearchParams({
                          ...Object.fromEntries(searchParams.entries()),
                          page: page.toString()
                        })}`}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </Link>
                    ))}
                    
                    <Link
                      to={`?${new URLSearchParams({
                        ...Object.fromEntries(searchParams.entries()),
                        page: (currentPage + 1).toString()
                      })}`}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                      aria-disabled={currentPage === totalPages}
                      tabIndex={currentPage === totalPages ? -1 : 0}
                    >
                      <span className="sr-only">Siguiente</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </Link>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl flex items-center space-x-4">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <p className="text-lg text-gray-700">Procesando...</p>
            </div>
          </div>
        )}

        {/* Missing Data Modal */}
        {showMissingDataModal && selectedListingForMissingData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Datos Faltantes</h3>
                      <p className="text-sm text-gray-500">{selectedListingForMissingData.title}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMissingDataModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <p className="text-gray-600">Este vehículo no cuenta con todos los datos requeridos para generar contratos:</p>
                
                <div className="space-y-3">
                  {getMissingDataDetails(selectedListingForMissingData).map((missingField) => (
                    <div key={missingField.field} className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium text-red-800">{missingField.label}</p>
                        <p className="text-sm text-red-600">Campo requerido para contratos</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800 font-medium">¿Cómo completar estos datos?</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Edita este listing para agregar la información faltante. El NIV se encuentra en el parabrisas del vehículo y el número de motor en el motor del carro.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-between">
                <button
                  onClick={() => setShowMissingDataModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
                <Link
                  to={`/listings/${selectedListingForMissingData._id}/edit`}
                  className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Listing
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* PDF Viewer Modal */}
        <PDFViewerModal
          isOpen={showPDFModal}
          onClose={() => setShowPDFModal(false)}
          pdfUrl={selectedPDFUrl}
          title={selectedPDFTitle}
        />

        {/* Vehicle Documents Modal - Using Portal */}
        {isMounted && showDocumentsModal && selectedListingForDocs && createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999] p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 }}>
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Documentos del Vehículo</h3>
                      <p className="text-sm text-gray-500">{selectedListingForDocs.title}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDocumentsModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Vehicle Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Información del Vehículo</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Marca:</span>
                      <p className="font-medium">{selectedListingForDocs.make}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Modelo:</span>
                      <p className="font-medium">{selectedListingForDocs.model}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Año:</span>
                      <p className="font-medium">{selectedListingForDocs.year}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Color:</span>
                      <p className="font-medium">{selectedListingForDocs.color || 'No especificado'}</p>
                    </div>
                  </div>
                </div>

                {/* Critical Vehicle Data */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Datos Críticos del Vehículo</h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className={`p-4 rounded-lg border-2 ${selectedListingForDocs.serialNumber ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            {selectedListingForDocs.serialNumber ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                            <span className="font-medium text-gray-900">NIV (Número de Identificación Vehicular)</span>
                          </div>
                          <p className={`text-sm mt-1 ${selectedListingForDocs.serialNumber ? 'text-green-700' : 'text-red-700'}`}>
                            {selectedListingForDocs.serialNumber || 'No registrado - Requerido para contratos'}
                          </p>
                        </div>
                        {selectedListingForDocs.serialNumber && (
                          <button
                            onClick={() => navigator.clipboard.writeText(selectedListingForDocs.serialNumber)}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            Copiar
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg border-2 ${selectedListingForDocs.motorNumber ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            {selectedListingForDocs.motorNumber ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                            <span className="font-medium text-gray-900">Número de Motor</span>
                          </div>
                          <p className={`text-sm mt-1 ${selectedListingForDocs.motorNumber ? 'text-green-700' : 'text-red-700'}`}>
                            {selectedListingForDocs.motorNumber || 'No registrado - Requerido para contratos'}
                          </p>
                        </div>
                        {selectedListingForDocs.motorNumber && (
                          <button
                            onClick={() => navigator.clipboard.writeText(selectedListingForDocs.motorNumber)}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            Copiar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Uploads Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Documentos del Vehículo</h4>
                    <button
                      onClick={() => setShowUploadForm(true)}
                      className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Subir Documento</span>
                    </button>
                  </div>

                  {/* Upload Form */}
                  {showUploadForm && (
                    <form onSubmit={handleDocumentUpload} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del documento</label>
                          <input
                            type="text"
                            value={uploadFormData.name}
                            onChange={(e) => setUploadFormData({...uploadFormData, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: Factura original del vehículo"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de documento</label>
                          <select
                            value={uploadFormData.type}
                            onChange={(e) => setUploadFormData({...uploadFormData, type: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="factura">Factura</option>
                            <option value="tarjeta_circulacion">Tarjeta de Circulación</option>
                            <option value="verificacion">Verificación</option>
                            <option value="tenencia">Tenencia</option>
                            <option value="seguro">Seguro</option>
                            <option value="otro">Otro</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Archivo del documento</label>
                          <MediaUpload
                            maxFiles={1}
                            onMediaChange={handleMediaChange}
                            initialMedia={tempUploadedFiles}
                            accept={{
                              "image/jpeg": [".jpeg", ".jpg"],
                              "image/png": [".png"],
                              "image/webp": [".webp"],
                              "application/pdf": [".pdf"]
                            }}
                            maxSize={10 * 1024 * 1024} // 10MB
                            uploadMode="inline"
                            allowVideos={false}
                            uploadEndpoint="/api/upload-document"
                            showProgress={true}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Formatos permitidos: PDF, JPG, PNG, WebP (máximo 10MB)
                          </p>
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <span className="text-blue-600 text-lg">🖨️</span>
                              <div>
                                <p className="text-sm font-medium text-blue-800">💡 Recomendación profesional del equipo</p>
                                <p className="text-xs text-blue-700 mt-1">
                                  Para documentos de máxima calidad institucional, utilice el <strong>HP ScanJet Enterprise Flow N9120fn2</strong> - 
                                  scanner empresarial de alto rendimiento que garantiza escaneos de calidad profesional. 📄✨
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                          <textarea
                            value={uploadFormData.notes}
                            onChange={(e) => setUploadFormData({...uploadFormData, notes: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                            placeholder="Notas adicionales sobre el documento..."
                          />
                        </div>
                        
                        <div className="flex justify-end space-x-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowUploadForm(false)
                              setUploadFormData({ name: '', type: 'factura', notes: '' })
                              setTempUploadedFiles([])
                            }}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={uploadingFile}
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={uploadingFile || tempUploadedFiles.length === 0 || !uploadFormData.name}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {uploadingFile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {uploadingFile ? 'Guardando...' : 'Guardar Documento'}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* Documents List */}
                  {isLoadingDocuments ? (
                    <div className="text-center py-8">
                      <Loader2 className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
                      <p className="text-sm text-gray-500 mt-2">Cargando documentos...</p>
                    </div>
                  ) : vehicleDocuments.length > 0 ? (
                    <div className="space-y-3">
                      {vehicleDocuments.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{doc.name}</p>
                              <p className="text-sm text-gray-500">
                                {doc.type.replace('_', ' ').charAt(0).toUpperCase() + doc.type.replace('_', ' ').slice(1)}
                                {doc.notes && ` • ${doc.notes}`}
                              </p>
                              <p className="text-xs text-gray-400">
                                Subido: {new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                if (isPDF(doc.url)) {
                                  openPDFModal(doc.url, doc.name)
                                } else if (isImage(doc.url)) {
                                  openImageModal(doc.url, doc.name)
                                } else {
                                  window.open(doc.url, '_blank')
                                }
                              }}
                              className="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-100 transition-colors"
                              title={isPDF(doc.url) ? "Ver PDF en modal" : isImage(doc.url) ? "Ver imagen en modal" : "Ver documento"}
                            >
                              {isPDF(doc.url) || isImage(doc.url) ? <Eye className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleRemoveDocument(doc.id)}
                              className="p-1.5 text-red-600 hover:text-red-800 rounded hover:bg-red-100 transition-colors"
                              title="Eliminar documento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        No hay documentos subidos
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Usa el botón "Subir Documento" para agregar archivos
                      </p>
                    </div>
                  )}
                </div>

                {/* Action needed */}
                {(!selectedListingForDocs.serialNumber || !selectedListingForDocs.motorNumber) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-yellow-800">Acción Requerida</h5>
                        <p className="text-sm text-yellow-700 mt-1">
                          Este vehículo no puede ser usado en contratos hasta completar los datos faltantes.
                        </p>
                        <Link
                          to={`/listings/${selectedListingForDocs._id}/edit`}
                          className="inline-flex items-center mt-2 px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar Listing
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowDocumentsModal(false)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </AdminLayout>

    {/* Image Preview Modal - Outside AdminLayout */}
    <AnimatePresence>
      {showImageModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[99999999] p-4"
          onClick={() => setShowImageModal(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">IMG</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedImageTitle}</h3>
                  <p className="text-sm text-gray-500">Visualizador de imágenes</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <a
                  href={selectedImageUrl}
                  download
                  className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Descargar imagen"
                >
                  <Download className="w-5 h-5" />
                </a>
                
                <a
                  href={selectedImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Abrir en nueva pestaña"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
                
                <button
                  onClick={() => setShowImageModal(false)}
                  className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image Viewer */}
            <div className="flex-1 relative bg-gray-100 flex items-center justify-center">
              <img 
                src={selectedImageUrl} 
                alt={selectedImageTitle}
                className="max-w-full max-h-full object-contain"
                style={{ maxHeight: 'calc(85vh - 120px)' }}
              />
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Click y arrastra para mover • Scroll para zoom
                </p>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}