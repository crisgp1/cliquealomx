import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Listing, ListingDocument } from './schemas/listing.schema';
import { CreateListingDto } from './dto/create-listing.dto';

@Injectable()
export class ListingsService {
  constructor(
    @InjectModel(Listing.name) private listingModel: Model<ListingDocument>,
  ) {}

  async create(createListingDto: CreateListingDto, userId: string = 'temp-user'): Promise<Listing> {
    const listingData = {
      ...createListingDto,
      location: {
        city: createListingDto.city,
        state: createListingDto.state,
      },
      contactInfo: {
        phone: createListingDto.phone,
        whatsapp: createListingDto.whatsapp,
        email: createListingDto.email,
      },
      userId,
      images: [], // Will be populated when images are uploaded
      status: 'active',
      likesCount: 0,
      viewsCount: 0,
    };

    // Remove the flat fields now that they're in nested objects
    const { city, state, phone, whatsapp, email, ...cleanData } = listingData;

    const createdListing = new this.listingModel(cleanData);
    return createdListing.save();
  }

  async findAll(filters: any = {}): Promise<Listing[]> {
    const query: any = {};
    
    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.brand) {
      query.brand = new RegExp(filters.brand, 'i');
    }
    if (filters.minPrice || filters.maxPrice) {
      query.price = {};
      if (filters.minPrice) query.price.$gte = Number(filters.minPrice);
      if (filters.maxPrice) query.price.$lte = Number(filters.maxPrice);
    }
    if (filters.minYear || filters.maxYear) {
      query.year = {};
      if (filters.minYear) query.year.$gte = Number(filters.minYear);
      if (filters.maxYear) query.year.$lte = Number(filters.maxYear);
    }
    if (filters.city) {
      query['location.city'] = new RegExp(filters.city, 'i');
    }
    if (filters.state) {
      query['location.state'] = new RegExp(filters.state, 'i');
    }
    if (filters.search) {
      query.$or = [
        { title: new RegExp(filters.search, 'i') },
        { brand: new RegExp(filters.search, 'i') },
        { model: new RegExp(filters.search, 'i') },
        { description: new RegExp(filters.search, 'i') },
      ];
    }

    let queryBuilder = this.listingModel.find(query);
    
    // Apply sorting
    switch (filters.sortBy) {
      case 'oldest':
        queryBuilder = queryBuilder.sort({ createdAt: 1 });
        break;
      case 'price_low':
        queryBuilder = queryBuilder.sort({ price: 1 });
        break;
      case 'price_high':
        queryBuilder = queryBuilder.sort({ price: -1 });
        break;
      case 'hot':
        queryBuilder = queryBuilder.sort({ viewsCount: -1, likesCount: -1 });
        break;
      default: // 'recent'
        queryBuilder = queryBuilder.sort({ createdAt: -1 });
    }

    // Apply pagination
    if (filters.skip) {
      queryBuilder = queryBuilder.skip(Number(filters.skip));
    }
    if (filters.limit) {
      queryBuilder = queryBuilder.limit(Number(filters.limit));
    }

    return queryBuilder.exec();
  }

  async findMyListings(userId: string, filters: any = {}): Promise<Listing[]> {
    return this.findAll({ ...filters, userId });
  }

  async findOne(id: string): Promise<Listing | null> {
    return this.listingModel.findById(id).exec();
  }

  async update(id: string, updateData: Partial<CreateListingDto>): Promise<Listing | null> {
    return this.listingModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async updateStatus(id: string, status: string): Promise<Listing | null> {
    return this.listingModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
  }

  async remove(id: string): Promise<void> {
    await this.listingModel.findByIdAndDelete(id).exec();
  }

  async getStats(userId?: string): Promise<{
    total: number;
    active: number;
    sold: number;
    views: number;
    likes: number;
  }> {
    const matchQuery = userId ? { userId } : {};
    
    const stats = await this.listingModel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { 
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } 
          },
          sold: { 
            $sum: { $cond: [{ $eq: ['$status', 'sold'] }, 1, 0] } 
          },
          views: { $sum: '$viewsCount' },
          likes: { $sum: '$likesCount' }
        }
      }
    ]);

    return stats[0] || {
      total: 0,
      active: 0,
      sold: 0,
      views: 0,
      likes: 0
    };
  }

  async getAnalytics(userId?: string): Promise<{
    totalViews: number;
    activeListings: number;
    inquiries: number;
    conversionRate: number;
    popularListings: Array<{
      id: string;
      title: string;
      views: number;
    }>;
    recentActivity: Array<{
      type: string;
      description: string;
      timestamp: Date;
      listingId?: string;
    }>;
  }> {
    const matchQuery = userId ? { userId } : {};
    
    // Get basic stats
    const basicStats = await this.getStats(userId);
    
    // Get popular listings (top 3 by views)
    const popularListings = await this.listingModel
      .find(matchQuery)
      .sort({ viewsCount: -1 })
      .limit(3)
      .select('title viewsCount')
      .exec();

    // Get recent listings for activity feed
    const recentListings = await this.listingModel
      .find(matchQuery)
      .sort({ createdAt: -1 })
      .limit(3)
      .select('title createdAt')
      .exec();

    // Calculate conversion rate (simplified: likes / views)
    const conversionRate = basicStats.views > 0 
      ? (basicStats.likes / basicStats.views) * 100 
      : 0;

    // Real recent activity based on actual listings
    const recentActivity = recentListings.map(listing => ({
      type: 'listing',
      description: 'Nuevo anuncio publicado',
      timestamp: listing.createdAt,
      listingId: (listing as any)._id.toString(),
    }));

    return {
      totalViews: basicStats.views,
      activeListings: basicStats.active,
      inquiries: Math.floor(basicStats.views * 0.15), // Mock: 15% of views become inquiries
      conversionRate: Number(conversionRate.toFixed(1)),
      popularListings: popularListings.map(listing => ({
        id: (listing as any)._id.toString(),
        title: listing.title,
        views: listing.viewsCount,
      })),
      recentActivity,
    };
  }

  async incrementView(id: string): Promise<{ viewsCount: number }> {
    const updated = await this.listingModel.findByIdAndUpdate(
      id,
      { $inc: { viewsCount: 1 } },
      { new: true }
    ).exec();
    
    return { viewsCount: updated?.viewsCount || 0 };
  }

  async toggleLike(id: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    // For now, just increment likes count
    // In a real implementation, you'd track which users liked which listings
    const listing = await this.listingModel.findById(id);
    const newCount = (listing?.likesCount || 0) + 1;
    
    await this.listingModel.findByIdAndUpdate(id, { likesCount: newCount });
    
    return { liked: true, likesCount: newCount };
  }

  async updateImages(id: string, imageUrls: string[]): Promise<Listing | null> {
    console.log('🖼️ Updating listing images:', id, 'with', imageUrls.length, 'images');
    return this.listingModel.findByIdAndUpdate(
      id,
      { images: imageUrls },
      { new: true }
    ).exec();
  }
}