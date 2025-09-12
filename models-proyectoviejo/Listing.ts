// Type definitions for Listing model
// This file exports types that can be imported on the client side

export interface Listing {
  _id?: string
  user: string
  title: string
  description?: string
  brand: string
  model: string
  year: number
  price: number
  images: string[]
  videos?: string[]
  likesCount: number
  viewsCount: number
  status: 'active' | 'sold' | 'reserved' | 'inactive'
  features?: string[]
  mileage?: number
  fuelType?: 'gasolina' | 'diesel' | 'hibrido' | 'electrico'
  transmission?: 'manual' | 'automatico'
  bodyType?: 'sedan' | 'suv' | 'hatchback' | 'pickup' | 'coupe' | 'convertible'
  color?: string
  location?: {
    city: string
    state: string
  }
  contactInfo?: {
    phone?: string
    whatsapp?: string
    email?: string
  }
  createdAt: Date | string
  updatedAt: Date | string
  soldAt?: Date | string
  isFeatured?: boolean
  owner?: {
    _id: string
    name: string
    email: string
    role: string
  }
}

export type ListingStatus = Listing['status']
export type FuelType = NonNullable<Listing['fuelType']>
export type Transmission = NonNullable<Listing['transmission']>
export type BodyType = NonNullable<Listing['bodyType']>

// 🔥 Algoritmo Hot View - Determinar si un listing es "hot"
export function getHotStatus(listing: Listing) {
  const views = listing.viewsCount || 0
  const createdAt = typeof listing.createdAt === 'string' ? new Date(listing.createdAt) : listing.createdAt
  const daysOld = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  
  // Algoritmo dinámico basado en vistas y antigüedad
  // Listings más nuevos necesitan menos vistas para ser "hot"
  let threshold = 50 // Base threshold
  
  if (daysOld <= 1) threshold = 20      // Muy nuevo: 20 vistas
  else if (daysOld <= 7) threshold = 35  // Nueva semana: 35 vistas
  else if (daysOld <= 30) threshold = 50 // Nuevo mes: 50 vistas
  else threshold = 100                   // Más viejo: 100 vistas
  
  if (views >= threshold * 2) return 'super-hot' // 🔥🔥 Super Hot
  if (views >= threshold) return 'hot'           // 🔥 Hot
  return 'normal'                               // Normal
}