// Types
export interface MediaFile {
  id: string;
  url: string;
  type: 'image' | 'video';
  name?: string;
  size?: number;
  uploadedAt: Date;
}

export interface VehicleDocument {
  id: string;
  name: string;
  type: 'factura' | 'tarjeta_circulacion' | 'verificacion' | 'tenencia' | 'seguro' | 'repuve' | 'otro';
  url: string;
  uploadedAt: Date;
  notes?: string;
}

export interface Location {
  city: string;
  state: string;
}

export interface ContactInfo {
  phone?: string;
  whatsapp?: string;
  email?: string;
}

export interface Listing {
  id: string;
  userId: string; // Clerk ID
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  status: 'active' | 'sold' | 'reserved' | 'inactive';
  createdAt: Date | string;
  updatedAt: Date | string;
  description?: string;
  images?: string[];
  videos?: string[];
  media?: MediaFile[];
  likesCount: number;
  viewsCount: number;
  features?: string[];
  mileage?: number;
  fuelType?: 'gasolina' | 'diesel' | 'hibrido' | 'electrico';
  transmission?: 'manual' | 'automatico';
  bodyType?: 'sedan' | 'suv' | 'hatchback' | 'pickup' | 'coupe' | 'convertible';
  color?: string;
  location?: Location;
  contactInfo?: ContactInfo;
  serialNumber?: string;
  motorNumber?: string;
  vehicleDocuments?: VehicleDocument[];
  soldAt?: Date | string;
  isFeatured?: boolean;
}

export interface CreateListingData {
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  description?: string;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  color?: string;
  serialNumber?: string;
  motorNumber?: string;
  features?: string[];
  city: string;
  state: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  isFeatured?: boolean;
}

export interface ListingsFilters {
  status?: string;
  search?: string;
  sortBy?: 'recent' | 'price_low' | 'price_high' | 'year' | 'mileage';
}

export interface ListingsStats {
  total: number;
  active: number;
  sold: number;
  inactive: number;
  views: number;
  likes: number;
}

// API Client
export class ListingsAPI {
  protected baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Get user's listings
  async getMyListings(filters?: ListingsFilters): Promise<Listing[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);

    const queryString = params.toString();
    const endpoint = `/listings/my-listings${queryString ? `?${queryString}` : ''}`;
    
    return this.request<Listing[]>(endpoint);
  }

  // Get single listing
  async getListing(id: string): Promise<Listing> {
    return this.request<Listing>(`/listings/${id}`);
  }

  // Create new listing
  async createListing(data: CreateListingData): Promise<Listing> {
    return this.request<Listing>('/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update listing status
  async updateStatus(id: string, status: string): Promise<Listing> {
    return this.request<Listing>(`/listings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Update listing
  async updateListing(id: string, data: Partial<CreateListingData>): Promise<Listing> {
    return this.request<Listing>(`/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete listing
  async deleteListing(id: string): Promise<void> {
    return this.request<void>(`/listings/${id}`, {
      method: 'DELETE',
    });
  }

  // Get stats
  async getStats(): Promise<ListingsStats> {
    return this.request<ListingsStats>('/listings/stats');
  }
}