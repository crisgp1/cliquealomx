import { ListingRepository } from '@/domain/repositories/listing.repository';
import { Listing } from '@/domain/entities/listing.entity';

export class GetListingUseCase {
  constructor(private listingRepository: ListingRepository) {}

  async execute(listingId: string): Promise<Listing> {
    if (!listingId) {
      throw new Error('Listing ID is required');
    }

    try {
      return await this.listingRepository.findById(listingId);
    } catch (error) {
      console.error('Error fetching listing:', error);
      throw new Error('Could not fetch listing. Please verify the ID is correct.');
    }
  }
}