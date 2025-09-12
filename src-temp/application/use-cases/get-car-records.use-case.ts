import { Injectable } from '@nestjs/common';
import { CarRecord } from '@domain/entities/car-record.entity';
import { CarRecordRepository, CarRecordFilters, CarRecordStats } from '@domain/repositories/car-record.repository';

@Injectable()
export class GetCarRecordsUseCase {
  constructor(
    private readonly carRecordRepository: CarRecordRepository
  ) {}

  async execute(filters: CarRecordFilters = {}): Promise<CarRecord[]> {
    return await this.carRecordRepository.findMany(filters);
  }

  async getById(id: string): Promise<CarRecord | null> {
    return await this.carRecordRepository.findById(id);
  }

  async getByExpedientNumber(expedientNumber: string): Promise<CarRecord | null> {
    return await this.carRecordRepository.findByExpedientNumber(expedientNumber);
  }

  async getByCreator(createdBy: string, limit = 20, skip = 0): Promise<CarRecord[]> {
    return await this.carRecordRepository.findByCreator(createdBy, limit, skip);
  }

  async getSalesOnly(filters: Omit<CarRecordFilters, 'isSale'> = {}): Promise<CarRecord[]> {
    return await this.carRecordRepository.findMany({
      ...filters,
      isSale: true
    });
  }

  async getOtherRecords(filters: Omit<CarRecordFilters, 'isSale'> = {}): Promise<CarRecord[]> {
    return await this.carRecordRepository.findMany({
      ...filters,
      isSale: false
    });
  }

  async getStats(): Promise<CarRecordStats> {
    return await this.carRecordRepository.getStats();
  }

  async getSummaries(filters: CarRecordFilters = []): Promise<ReturnType<CarRecord['toSummary']>[]> {
    const records = await this.execute(filters);
    return records.map(record => record.toSummary());
  }
}