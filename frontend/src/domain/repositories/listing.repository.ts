import { Listing } from '../entities/listing.entity';

export interface UpdateListingRequest {
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

export interface ListingRepository {
  findById(id: string): Promise<Listing>;
  update(id: string, data: UpdateListingRequest): Promise<Listing>;
  findByUserId(userId: string): Promise<Listing[]>;
  create(listing: Partial<Listing>): Promise<Listing>;
  delete(id: string): Promise<void>;
}