import { Injectable } from '@nestjs/common';
import { Listing } from '@domain/entities/listing.entity';
import { ListingRepository } from '@domain/repositories/listing.repository';

export interface CreateListingDto {
  userId: string; // Clerk ID
  title: string;
  description?: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  images?: string[];
  videos?: string[];
  features?: string[];
  mileage?: number;
  fuelType?: 'gasolina' | 'diesel' | 'hibrido' | 'electrico';
  transmission?: 'manual' | 'automatico';
  bodyType?: 'sedan' | 'suv' | 'hatchback' | 'pickup' | 'coupe' | 'convertible';
  color?: string;
  location?: {
    city: string;
    state: string;
  };
  contactInfo?: {
    phone?: string;
    whatsapp?: string;
    email?: string;
  };
  serialNumber?: string;
  motorNumber?: string;
}

@Injectable()
export class CreateListingUseCase {
  constructor(private readonly listingRepository: ListingRepository) {}

  async execute(createListingDto: CreateListingDto): Promise<Listing> {
    const listing = new Listing(
      '', // ID will be set by repository
      createListingDto.userId,
      createListingDto.title,
      createListingDto.brand,
      createListingDto.model,
      createListingDto.year,
      createListingDto.price,
      'active',
      new Date(),
      new Date(),
      createListingDto.description,
      createListingDto.images,
      createListingDto.videos,
      [], // media will be processed from images/videos
      0, // likesCount
      0, // viewsCount
      createListingDto.features,
      createListingDto.mileage,
      createListingDto.fuelType,
      createListingDto.transmission,
      createListingDto.bodyType,
      createListingDto.color,
      createListingDto.location,
      createListingDto.contactInfo,
      createListingDto.serialNumber,
      createListingDto.motorNumber,
      [], // vehicleDocuments
      undefined, // soldAt
      false // isFeatured
    );

    return await this.listingRepository.create(listing);
  }
}