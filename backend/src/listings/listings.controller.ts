import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Delete,
  Body,
  Param, 
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { Listing } from './schemas/listing.schema';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createListingDto: CreateListingDto): Promise<Listing> {
    console.log('🔥 Creating listing with data:', createListingDto);
    const result = await this.listingsService.create(createListingDto);
    console.log('✅ Listing created with ID:', (result as any).id || (result as any)._id);
    return result;
  }

  @Get()
  async findAll(@Query() query: any): Promise<Listing[]> {
    console.log('📋 Fetching all listings with filters:', query);
    return this.listingsService.findAll(query);
  }

  @Get('my-listings')
  async getMyListings(@Query() query: any): Promise<Listing[]> {
    console.log('👤 Fetching my listings with filters:', query);
    // For now, we'll use a temporary user ID until auth is implemented
    return this.listingsService.findMyListings('temp-user', query);
  }

  @Get('stats')
  async getStats(): Promise<any> {
    console.log('📊 Fetching listings stats');
    // For now, get stats for temp user until auth is implemented
    return this.listingsService.getStats('temp-user');
  }

  @Get('analytics')
  async getAnalytics(): Promise<any> {
    console.log('📈 Fetching analytics data');
    // For now, get analytics for temp user until auth is implemented
    return this.listingsService.getAnalytics('temp-user');
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Listing | null> {
    console.log('🔍 Fetching listing by ID:', id);
    return this.listingsService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateListingDto>,
  ): Promise<Listing | null> {
    console.log('✏️ Updating listing:', id, 'with data:', updateData);
    return this.listingsService.update(id, updateData);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ): Promise<{ success: boolean }> {
    console.log('🔄 Updating listing status:', id, 'to:', status);
    await this.listingsService.updateStatus(id, status);
    return { success: true };
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    console.log('🗑️ Deleting listing:', id);
    await this.listingsService.remove(id);
    return { success: true };
  }

  @Post(':id/like')
  async toggleLike(@Param('id') id: string): Promise<{ liked: boolean; likesCount: number }> {
    console.log('❤️ Toggling like for listing:', id);
    return this.listingsService.toggleLike(id, 'temp-user');
  }

  @Post(':id/view')
  async incrementView(@Param('id') id: string): Promise<{ viewsCount: number }> {
    console.log('👁️ Incrementing view count for listing:', id);
    return this.listingsService.incrementView(id);
  }
}