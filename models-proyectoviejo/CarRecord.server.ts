import { ObjectId } from 'mongodb';
import { db } from '~/lib/db.server';

export interface CarRecord {
  _id?: ObjectId;
  expedientNumber: string; // Auto-generated expedient number
  title: string;
  isSale: boolean;
  notes?: string; // Marginal notes
  documents: {
    name: string;
    url: string;
    type: 'image' | 'pdf';
    size?: number;
  }[];
  // Sale-specific data (only when isSale is true)
  saleData?: {
    vehicle: {
      brand: string;
      model: string;
      serialNumber?: string;
    };
    customer: {
      name: string;
      address?: string;
      email?: string;
      phone?: string;
      idNumber?: string;
    };
    seller?: {
      name: string;
      address?: string;
      email?: string;
      phone?: string;
      idNumber?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Clerk user ID
}

export interface CreateCarRecordData {
  title: string;
  isSale: boolean;
  notes?: string;
  documents: {
    name: string;
    url: string;
    type: 'image' | 'pdf';
    size?: number;
  }[];
  saleData?: {
    vehicle: {
      brand: string;
      model: string;
      serialNumber?: string;
    };
    customer: {
      name: string;
      address?: string;
      email?: string;
      phone?: string;
      idNumber?: string;
    };
    seller?: {
      name: string;
      address?: string;
      email?: string;
      phone?: string;
      idNumber?: string;
    };
  };
  createdBy: string;
}

export class CarRecordModel {
  private static collection = db.collection<CarRecord>('carRecords');

  static async generateExpedientNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.collection.countDocuments() + 1;
    
    // Format: EXP-YYYY-NNNNNN (e.g., EXP-2024-000001)
    return `EXP-${year}-${count.toString().padStart(6, '0')}`;
  }

  static async create(data: CreateCarRecordData): Promise<CarRecord> {
    const now = new Date();
    const expedientNumber = await this.generateExpedientNumber();
    
    const carRecord: CarRecord = {
      ...data,
      expedientNumber,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.collection.insertOne(carRecord);
    return { ...carRecord, _id: result.insertedId };
  }

  static async findMany(options: {
    limit?: number;
    skip?: number;
    search?: string;
    isSale?: boolean;
  } = {}): Promise<CarRecord[]> {
    const { limit = 20, skip = 0, search, isSale } = options;
    
    let filter: any = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { expedientNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (typeof isSale === 'boolean') {
      filter.isSale = isSale;
    }

    return await this.collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  static async findById(id: string | ObjectId): Promise<CarRecord | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    return await this.collection.findOne({ _id: objectId });
  }

  static async update(
    id: string | ObjectId,
    data: Partial<Omit<CarRecord, '_id' | 'createdAt' | 'createdBy'>>
  ): Promise<CarRecord | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    const result = await this.collection.findOneAndUpdate(
      { _id: objectId },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    return result || null;
  }

  static async delete(id: string | ObjectId): Promise<boolean> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await this.collection.deleteOne({ _id: objectId });
    return result.deletedCount === 1;
  }

  static async countDocuments(filter: any = {}): Promise<number> {
    return await this.collection.countDocuments(filter);
  }

  static async getStats(): Promise<{
    total: number;
    sales: number;
    other: number;
    totalDocuments: number;
  }> {
    const [total, sales, documentsAggregation] = await Promise.all([
      this.countDocuments(),
      this.countDocuments({ isSale: true }),
      this.collection.aggregate([
        {
          $group: {
            _id: null,
            totalDocuments: { $sum: { $size: '$documents' } }
          }
        }
      ]).toArray()
    ]);

    const totalDocuments = documentsAggregation[0]?.totalDocuments || 0;

    return {
      total,
      sales,
      other: total - sales,
      totalDocuments,
    };
  }
}