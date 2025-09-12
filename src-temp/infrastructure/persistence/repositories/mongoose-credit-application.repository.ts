import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreditApplication } from '@domain/entities/credit-application.entity';
import { 
  CreditApplicationRepository, 
  CreditApplicationFilters 
} from '@domain/repositories/credit-application.repository';
import { 
  CreditApplicationSchema, 
  CreditApplicationDocument 
} from '@infrastructure/persistence/schemas/credit-application.schema';

@Injectable()
export class MongooseCreditApplicationRepository implements CreditApplicationRepository {
  constructor(
    @InjectModel(CreditApplicationSchema.name) 
    private creditApplicationModel: Model<CreditApplicationDocument>
  ) {}

  async create(application: CreditApplication): Promise<CreditApplication> {
    const createdApplication = new this.creditApplicationModel(application);
    const saved = await createdApplication.save();
    return this.mapToEntity(saved);
  }

  async findById(id: string): Promise<CreditApplication | null> {
    const application = await this.creditApplicationModel.findById(id).exec();
    return application ? this.mapToEntity(application) : null;
  }

  async findByUserId(userId: string, limit = 20, skip = 0): Promise<CreditApplication[]> {
    const applications = await this.creditApplicationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return applications.map(app => this.mapToEntity(app));
  }

  async findAll(filters: CreditApplicationFilters = {}): Promise<CreditApplication[]> {
    const {
      status,
      search,
      dateFrom,
      dateTo,
      limit = 50,
      skip = 0
    } = filters;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { 'personalInfo.fullName': { $regex: search, $options: 'i' } },
        { 'personalInfo.email': { $regex: search, $options: 'i' } },
        { 'personalInfo.phone': { $regex: search, $options: 'i' } },
        { 'personalInfo.curp': { $regex: search, $options: 'i' } }
      ];
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = dateFrom;
      if (dateTo) query.createdAt.$lte = dateTo;
    }

    const applications = await this.creditApplicationModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return applications.map(app => this.mapToEntity(app));
  }

  async update(id: string, updateData: Partial<CreditApplication>): Promise<boolean> {
    const result = await this.creditApplicationModel
      .updateOne(
        { _id: id }, 
        { $set: { ...updateData, updatedAt: new Date() } }
      )
      .exec();

    return result.modifiedCount > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.creditApplicationModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async isOwner(applicationId: string, userId: string): Promise<boolean> {
    const application = await this.creditApplicationModel
      .findOne({ _id: applicationId, userId })
      .select('_id')
      .exec();

    return !!application;
  }

  async getStats(): Promise<any> {
    const statusStats = await this.creditApplicationModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgRequestedAmount: { $avg: '$financialInfo.requestedAmount' },
          totalRequestedAmount: { $sum: '$financialInfo.requestedAmount' }
        }
      }
    ]).exec();

    const total = await this.creditApplicationModel.countDocuments().exec();
    const recentCount = await this.creditApplicationModel.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).exec();

    return {
      total,
      recentCount,
      byStatus: statusStats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          avgRequestedAmount: stat.avgRequestedAmount,
          totalRequestedAmount: stat.totalRequestedAmount
        };
        return acc;
      }, {})
    };
  }

  private mapToEntity(document: CreditApplicationDocument): CreditApplication {
    return new CreditApplication(
      document._id.toString(),
      document.userId,
      document.personalInfo,
      document.employmentInfo,
      document.financialInfo,
      document.emergencyContact,
      document.documents,
      document.status,
      document.createdAt,
      document.updatedAt,
      document.listingId,
      document.reviewInfo,
      document.submittedAt
    );
  }
}