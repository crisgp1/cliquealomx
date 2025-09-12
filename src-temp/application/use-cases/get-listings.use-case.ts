import { Injectable } from '@nestjs/common';
import { Listing } from '@domain/entities/listing.entity';
import { ListingRepository, ListingFilters } from '@domain/repositories/listing.repository';

@Injectable()
export class GetListingsUseCase {
  constructor(private readonly listingRepository: ListingRepository) {}

  async execute(filters: ListingFilters = {}): Promise<Listing[]> {
    return await this.listingRepository.findMany(filters);
  }

  async getFeatured(limit = 6): Promise<Listing[]> {
    return await this.listingRepository.findFeatured(limit);
  }

  async getByUser(userId: string, limit = 20, skip = 0): Promise<Listing[]> {
    return await this.listingRepository.findByUserId(userId, limit, skip);
  }

  async getSimilar(listingId: string, limit = 6): Promise<Listing[]> {
    return await this.listingRepository.findSimilar(listingId, limit);
  }
}