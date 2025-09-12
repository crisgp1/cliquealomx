import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Listing } from '@domain/entities/listing.entity';
import { ListingRepository, ListingFilters } from '@domain/repositories/listing.repository';
import { ListingSchema, ListingDocument } from '@infrastructure/persistence/schemas/listing.schema';

@Injectable()
export class MongooseListingRepository implements ListingRepository {
  constructor(
    @InjectModel(ListingSchema.name) private listingModel: Model<ListingDocument>
  ) {}

  async create(listing: Listing): Promise<Listing> {
    const createdListing = new this.listingModel(listing);
    const saved = await createdListing.save();
    return this.mapToEntity(saved);
  }

  async findById(id: string): Promise<Listing | null> {
    const listing = await this.listingModel.findById(id).exec();
    return listing ? this.mapToEntity(listing) : null;
  }

  async findMany(filters: ListingFilters = {}): Promise<Listing[]> {
    const {
      search,
      brand,
      model,
      minYear,
      maxYear,
      minPrice,
      maxPrice,
      fuelType,
      transmission,
      bodyType,
      color,
      city,
      status,
      isFeatured,
      limit = 20,
      skip = 0,
      sortBy = 'recent',
      userId
    } = filters;

    const query: any = {};
    
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (typeof isFeatured === 'boolean') query.isFeatured = isFeatured;

    // Búsqueda general
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { color: { $regex: search, $options: 'i' } }
      ];
    }

    // Filtros específicos
    if (brand) query.brand = { $regex: brand, $options: 'i' };
    if (model) query.model = { $regex: model, $options: 'i' };
    if (fuelType) query.fuelType = fuelType;
    if (transmission) query.transmission = transmission;
    if (bodyType) query.bodyType = bodyType;
    if (color) query.color = { $regex: color, $options: 'i' };
    if (city) query['location.city'] = { $regex: city, $options: 'i' };

    // Filtros de rango
    if (minYear || maxYear) {
      query.year = {};
      if (minYear) query.year.$gte = minYear;
      if (maxYear) query.year.$lte = maxYear;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = minPrice;
      if (maxPrice) query.price.$lte = maxPrice;
    }

    // Ordenamiento
    let sort: any = { createdAt: -1 };
    switch (sortBy) {
      case 'price_low':
        sort = { price: 1 };
        break;
      case 'price_high':
        sort = { price: -1 };
        break;
      case 'popular':
        sort = { likesCount: -1, createdAt: -1 };
        break;
      case 'views':
        sort = { viewsCount: -1, createdAt: -1 };
        break;
    }

    const listings = await this.listingModel
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    return listings.map(listing => this.mapToEntity(listing));
  }

  async findByUserId(userId: string, limit = 20, skip = 0): Promise<Listing[]> {
    const listings = await this.listingModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return listings.map(listing => this.mapToEntity(listing));
  }

  async findFeatured(limit = 6): Promise<Listing[]> {
    const listings = await this.listingModel
      .find({ isFeatured: true, status: 'active' })
      .sort({ viewsCount: -1, createdAt: -1 })
      .limit(limit)
      .exec();

    return listings.map(listing => this.mapToEntity(listing));
  }

  async findSimilar(listingId: string, limit = 6): Promise<Listing[]> {
    const listing = await this.findById(listingId);
    if (!listing) return [];

    const priceRange = listing.price * 0.3;
    const yearRange = 3;

    const listings = await this.listingModel
      .find({
        _id: { $ne: listingId },
        status: 'active',
        $or: [
          { brand: listing.brand },
          {
            brand: listing.brand,
            year: {
              $gte: listing.year - yearRange,
              $lte: listing.year + yearRange
            }
          },
          {
            price: {
              $gte: listing.price - priceRange,
              $lte: listing.price + priceRange
            }
          }
        ]
      })
      .sort({ likesCount: -1, createdAt: -1 })
      .limit(limit)
      .exec();

    return listings.map(l => this.mapToEntity(l));
  }

  async update(id: string, updateData: Partial<Listing>): Promise<boolean> {
    const result = await this.listingModel
      .updateOne({ _id: id }, { $set: { ...updateData, updatedAt: new Date() } })
      .exec();

    return result.modifiedCount > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.listingModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async incrementViews(id: string): Promise<void> {
    await this.listingModel
      .updateOne({ _id: id }, { $inc: { viewsCount: 1 }, $set: { updatedAt: new Date() } })
      .exec();
  }

  async isOwner(listingId: string, userId: string): Promise<boolean> {
    const listing = await this.listingModel
      .findOne({ _id: listingId, userId })
      .select('_id')
      .exec();

    return !!listing;
  }

  async getBrandStats(): Promise<any[]> {
    return await this.listingModel.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$brand',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          totalLikes: { $sum: '$likesCount' },
          avgYear: { $avg: '$year' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]).exec();
  }

  async getStats(): Promise<any> {
    const statusStats = await this.listingModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          totalViews: { $sum: '$viewsCount' },
          totalLikes: { $sum: '$likesCount' }
        }
      }
    ]).exec();

    const total = await this.listingModel.countDocuments().exec();
    const recentCount = await this.listingModel.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).exec();

    return {
      total,
      recentCount,
      byStatus: statusStats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          avgPrice: stat.avgPrice,
          totalViews: stat.totalViews,
          totalLikes: stat.totalLikes
        };
        return acc;
      }, {})
    };
  }

  private mapToEntity(document: ListingDocument): Listing {
    return new Listing(
      document._id.toString(),
      document.userId,
      document.title,
      document.brand,
      document.model,
      document.year,
      document.price,
      document.status,
      document.createdAt,
      document.updatedAt,
      document.description,
      document.images,
      document.videos,
      document.media,
      document.likesCount,
      document.viewsCount,
      document.features,
      document.mileage,
      document.fuelType,
      document.transmission,
      document.bodyType,
      document.color,
      document.location,
      document.contactInfo,
      document.serialNumber,
      document.motorNumber,
      document.vehicleDocuments,
      document.soldAt,
      document.isFeatured
    );
  }
}