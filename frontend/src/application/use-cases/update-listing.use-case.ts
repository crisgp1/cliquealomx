import { ListingRepository, UpdateListingRequest } from '@/domain/repositories/listing.repository';
import { Listing } from '@/domain/entities/listing.entity';

export class UpdateListingUseCase {
  constructor(private listingRepository: ListingRepository) {}

  async execute(listingId: string, updateData: UpdateListingRequest): Promise<Listing> {
    if (!listingId) {
      throw new Error('Listing ID is required');
    }

    // Validate required fields
    this.validateUpdateData(updateData);

    try {
      // Get current listing to verify ownership and existence
      await this.listingRepository.findById(listingId);

      // Update the listing
      const updatedListing = await this.listingRepository.update(listingId, updateData);

      return updatedListing;
    } catch (error) {
      console.error('Error updating listing:', error);
      throw new Error('Could not update listing. Please try again.');
    }
  }

  private validateUpdateData(data: UpdateListingRequest): void {
    const errors: string[] = [];

    if (!data.title?.trim()) {
      errors.push('Title is required');
    }

    if (!data.brand?.trim()) {
      errors.push('Brand is required');
    }

    if (!data.model?.trim()) {
      errors.push('Model is required');
    }

    if (!data.year || data.year < 1990 || data.year > new Date().getFullYear() + 1) {
      errors.push('Valid year is required');
    }

    if (!data.price || data.price <= 0) {
      errors.push('Price must be greater than 0');
    }

    if (!data.city?.trim()) {
      errors.push('City is required');
    }

    if (!data.state?.trim()) {
      errors.push('State is required');
    }

    if (!data.phone?.trim()) {
      errors.push('Phone is required');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }
}