import { Injectable } from '@nestjs/common';
import { CarRecord, DocumentFile, SaleData } from '@domain/entities/car-record.entity';
import { CarRecordRepository } from '@domain/repositories/car-record.repository';

export interface CreateCarRecordDto {
  title: string;
  isSale: boolean;
  notes?: string;
  documents: DocumentFile[];
  saleData?: SaleData;
  createdBy: string; // Clerk ID
}

@Injectable()
export class CreateCarRecordUseCase {
  constructor(
    private readonly carRecordRepository: CarRecordRepository
  ) {}

  async execute(dto: CreateCarRecordDto): Promise<CarRecord> {
    const expedientNumber = await this.carRecordRepository.getNextExpedientNumber();
    
    const carRecord = new CarRecord(
      '', // ID will be set by repository
      expedientNumber,
      dto.title,
      dto.isSale,
      dto.documents,
      dto.createdBy,
      new Date(),
      new Date(),
      dto.notes,
      dto.saleData
    );

    // Validate the record before creating
    const validation = carRecord.validate();
    if (!validation.isValid) {
      throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
    }

    return await this.carRecordRepository.create(carRecord);
  }
}