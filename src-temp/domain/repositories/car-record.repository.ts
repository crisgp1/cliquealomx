import { CarRecord } from '@domain/entities/car-record.entity';

export interface CarRecordFilters {
  search?: string;
  isSale?: boolean;
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  skip?: number;
}

export interface CarRecordStats {
  total: number;
  sales: number;
  other: number;
  totalDocuments: number;
  recentCount: number;
}

export abstract class CarRecordRepository {
  abstract create(carRecord: CarRecord): Promise<CarRecord>;
  abstract findById(id: string): Promise<CarRecord | null>;
  abstract findByExpedientNumber(expedientNumber: string): Promise<CarRecord | null>;
  abstract findMany(filters: CarRecordFilters): Promise<CarRecord[]>;
  abstract findByCreator(createdBy: string, limit?: number, skip?: number): Promise<CarRecord[]>;
  abstract update(id: string, updateData: Partial<CarRecord>): Promise<boolean>;
  abstract delete(id: string): Promise<boolean>;
  abstract getStats(): Promise<CarRecordStats>;
  abstract getNextExpedientNumber(): Promise<string>;
  abstract isOwner(recordId: string, userId: string): Promise<boolean>;
}