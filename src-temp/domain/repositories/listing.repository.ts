import { Listing } from '@domain/entities/listing.entity';

export interface ListingFilters {
  search?: string;
  brand?: string;
  model?: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  color?: string;
  city?: string;
  status?: Listing['status'];
  isFeatured?: boolean;
  limit?: number;
  skip?: number;
  sortBy?: 'recent' | 'price_low' | 'price_high' | 'popular' | 'views';
  userId?: string;
}

export abstract class ListingRepository {
  abstract create(listing: Listing): Promise<Listing>;
  abstract findById(id: string): Promise<Listing | null>;
  abstract findMany(filters: ListingFilters): Promise<Listing[]>;
  abstract findByUserId(userId: string, limit?: number, skip?: number): Promise<Listing[]>;
  abstract findFeatured(limit?: number): Promise<Listing[]>;
  abstract findSimilar(listingId: string, limit?: number): Promise<Listing[]>;
  abstract update(id: string, updateData: Partial<Listing>): Promise<boolean>;
  abstract delete(id: string): Promise<boolean>;
  abstract incrementViews(id: string): Promise<void>;
  abstract isOwner(listingId: string, userId: string): Promise<boolean>;
  abstract getBrandStats(): Promise<any[]>;
  abstract getStats(): Promise<any>;
}