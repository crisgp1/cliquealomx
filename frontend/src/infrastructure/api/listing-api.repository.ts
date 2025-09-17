import { ListingRepository, UpdateListingRequest } from '@/domain/repositories/listing.repository';
import { Listing } from '@/domain/entities/listing.entity';
import { ListingsAPI } from '@/lib/api/listings';

export class ListingApiRepository implements ListingRepository {
  constructor(private api: ListingsAPI) {}

  async findById(id: string): Promise<Listing> {
    const data = await this.api.getListing(id);
    return Listing.fromPrimitives(data);
  }

  async update(id: string, updateData: UpdateListingRequest): Promise<Listing> {
    const data = await this.api.updateListing(id, updateData);
    return Listing.fromPrimitives(data);
  }

  async findByUserId(): Promise<Listing[]> {
    const data = await this.api.getMyListings();
    return data.map(item => Listing.fromPrimitives(item));
  }

  async create(): Promise<Listing> {
    // Implementation would depend on your create API
    throw new Error('Create method not implemented');
  }

  async delete(): Promise<void> {
    // Implementation would depend on your delete API
    throw new Error('Delete method not implemented');
  }
}