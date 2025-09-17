import { GetListingUseCase } from '../use-cases/get-listing.use-case';
import { UpdateListingUseCase } from '../use-cases/update-listing.use-case';
import { ListingRepository, UpdateListingRequest } from '@/domain/repositories/listing.repository';
import { Listing } from '@/domain/entities/listing.entity';

export class ListingService {
  private getListingUseCase: GetListingUseCase;
  private updateListingUseCase: UpdateListingUseCase;

  constructor(listingRepository: ListingRepository) {
    this.getListingUseCase = new GetListingUseCase(listingRepository);
    this.updateListingUseCase = new UpdateListingUseCase(listingRepository);
  }

  async getListing(id: string): Promise<Listing> {
    return this.getListingUseCase.execute(id);
  }

  async updateListing(id: string, data: UpdateListingRequest): Promise<Listing> {
    return this.updateListingUseCase.execute(id, data);
  }
}