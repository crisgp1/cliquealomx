import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CarRecord } from '@domain/entities/car-record.entity';
import { 
  CarRecordRepository, 
  CarRecordFilters,
  CarRecordStats 
} from '@domain/repositories/car-record.repository';
import { 
  CarRecordSchema, 
  CarRecordDocument 
} from '@infrastructure/persistence/schemas/car-record.schema';

@Injectable()
export class MongooseCarRecordRepository implements CarRecordRepository {
  constructor(
    @InjectModel(CarRecordSchema.name) 
    private carRecordModel: Model<CarRecordDocument>
  ) {}

  async create(carRecord: CarRecord): Promise<CarRecord> {
    const createdRecord = new this.carRecordModel(carRecord);
    const saved = await createdRecord.save();
    return this.mapToEntity(saved);
  }

  async findById(id: string): Promise<CarRecord | null> {
    const record = await this.carRecordModel.findById(id).exec();
    return record ? this.mapToEntity(record) : null;
  }

  async findByExpedientNumber(expedientNumber: string): Promise<CarRecord | null> {
    const record = await this.carRecordModel.findOne({ expedientNumber }).exec();
    return record ? this.mapToEntity(record) : null;
  }

  async findMany(filters: CarRecordFilters = {}): Promise<CarRecord[]> {
    const {
      search,
      isSale,
      createdBy,
      dateFrom,
      dateTo,
      limit = 20,
      skip = 0
    } = filters;

    const query: any = {};

    if (typeof isSale === 'boolean') {
      query.isSale = isSale;
    }

    if (createdBy) {
      query.createdBy = createdBy;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { expedientNumber: { $regex: search, $options: 'i' } },
        { 'saleData.customer.name': { $regex: search, $options: 'i' } },
        { 'saleData.vehicle.brand': { $regex: search, $options: 'i' } },
        { 'saleData.vehicle.model': { $regex: search, $options: 'i' } }
      ];
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = dateFrom;
      if (dateTo) query.createdAt.$lte = dateTo;
    }

    const records = await this.carRecordModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return records.map(record => this.mapToEntity(record));
  }

  async findByCreator(createdBy: string, limit = 20, skip = 0): Promise<CarRecord[]> {
    const records = await this.carRecordModel
      .find({ createdBy })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return records.map(record => this.mapToEntity(record));
  }

  async update(id: string, updateData: Partial<CarRecord>): Promise<boolean> {
    const result = await this.carRecordModel
      .updateOne(
        { _id: id }, 
        { $set: { ...updateData, updatedAt: new Date() } }
      )
      .exec();

    return result.modifiedCount > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.carRecordModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async getStats(): Promise<CarRecordStats> {
    const [
      total,
      sales,
      documentsAggregation,
      recentCount
    ] = await Promise.all([
      this.carRecordModel.countDocuments().exec(),
      this.carRecordModel.countDocuments({ isSale: true }).exec(),
      this.carRecordModel.aggregate([
        {
          $group: {
            _id: null,
            totalDocuments: { $sum: { $size: '$documents' } }
          }
        }
      ]).exec(),
      this.carRecordModel.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }).exec()
    ]);

    const totalDocuments = documentsAggregation[0]?.totalDocuments || 0;

    return {
      total,
      sales,
      other: total - sales,
      totalDocuments,
      recentCount
    };
  }

  async getNextExpedientNumber(): Promise<string> {
    // Use atomic counter or timestamp-based approach
    const year = new Date().getFullYear();
    const count = await this.carRecordModel.countDocuments().exec() + 1;
    
    // Format: EXP-YYYY-NNNNNN (e.g., EXP-2024-000001)
    return `EXP-${year}-${count.toString().padStart(6, '0')}`;
  }

  async isOwner(recordId: string, userId: string): Promise<boolean> {
    const record = await this.carRecordModel
      .findOne({ _id: recordId, createdBy: userId })
      .select('_id')
      .exec();

    return !!record;
  }

  private mapToEntity(document: CarRecordDocument): CarRecord {
    return new CarRecord(
      document._id.toString(),
      document.expedientNumber,
      document.title,
      document.isSale,
      document.documents,
      document.createdBy,
      document.createdAt,
      document.updatedAt,
      document.notes,
      document.saleData
    );
  }
}