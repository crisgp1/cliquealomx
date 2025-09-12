import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CarRecord, DocumentFile, SaleData } from '@domain/entities/car-record.entity';
import { CarRecordRepository } from '@domain/repositories/car-record.repository';

@Injectable()
export class ManageCarRecordUseCase {
  constructor(
    private readonly carRecordRepository: CarRecordRepository
  ) {}

  async update(
    id: string, 
    updateData: {
      title?: string;
      notes?: string;
      saleData?: SaleData;
    },
    userId: string
  ): Promise<boolean> {
    const carRecord = await this.carRecordRepository.findById(id);
    
    if (!carRecord) {
      throw new NotFoundException('Registro no encontrado');
    }

    if (!carRecord.isOwnedBy(userId)) {
      throw new ForbiddenException('No tienes permisos para modificar este registro');
    }

    if (updateData.title) {
      carRecord.updateTitle(updateData.title);
    }

    if (updateData.notes !== undefined) {
      carRecord.updateNotes(updateData.notes);
    }

    if (updateData.saleData && carRecord.isSale) {
      carRecord.updateSaleData(updateData.saleData);
    }

    // Validate after updates
    const validation = carRecord.validate();
    if (!validation.isValid) {
      throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
    }

    return await this.carRecordRepository.update(id, carRecord);
  }

  async addDocument(
    recordId: string, 
    document: DocumentFile, 
    userId: string
  ): Promise<boolean> {
    const carRecord = await this.carRecordRepository.findById(recordId);
    
    if (!carRecord) {
      throw new NotFoundException('Registro no encontrado');
    }

    if (!carRecord.isOwnedBy(userId)) {
      throw new ForbiddenException('No tienes permisos para modificar este registro');
    }

    carRecord.addDocument(document);
    return await this.carRecordRepository.update(recordId, carRecord);
  }

  async removeDocument(
    recordId: string, 
    documentName: string, 
    userId: string
  ): Promise<boolean> {
    const carRecord = await this.carRecordRepository.findById(recordId);
    
    if (!carRecord) {
      throw new NotFoundException('Registro no encontrado');
    }

    if (!carRecord.isOwnedBy(userId)) {
      throw new ForbiddenException('No tienes permisos para modificar este registro');
    }

    const removed = carRecord.removeDocument(documentName);
    if (!removed) {
      throw new NotFoundException('Documento no encontrado');
    }

    return await this.carRecordRepository.update(recordId, carRecord);
  }

  async delete(recordId: string, userId: string): Promise<boolean> {
    const carRecord = await this.carRecordRepository.findById(recordId);
    
    if (!carRecord) {
      throw new NotFoundException('Registro no encontrado');
    }

    if (!carRecord.isOwnedBy(userId)) {
      throw new ForbiddenException('No tienes permisos para eliminar este registro');
    }

    return await this.carRecordRepository.delete(recordId);
  }

  async getDocumentsByType(
    recordId: string, 
    type: 'image' | 'pdf', 
    userId: string
  ): Promise<DocumentFile[]> {
    const carRecord = await this.carRecordRepository.findById(recordId);
    
    if (!carRecord) {
      throw new NotFoundException('Registro no encontrado');
    }

    if (!carRecord.isOwnedBy(userId)) {
      throw new ForbiddenException('No tienes permisos para ver este registro');
    }

    return carRecord.getDocumentsByType(type);
  }

  async validateOwnership(recordId: string, userId: string): Promise<boolean> {
    return await this.carRecordRepository.isOwner(recordId, userId);
  }

  async duplicate(recordId: string, userId: string): Promise<CarRecord> {
    const originalRecord = await this.carRecordRepository.findById(recordId);
    
    if (!originalRecord) {
      throw new NotFoundException('Registro no encontrado');
    }

    if (!originalRecord.isOwnedBy(userId)) {
      throw new ForbiddenException('No tienes permisos para duplicar este registro');
    }

    const expedientNumber = await this.carRecordRepository.getNextExpedientNumber();
    
    const duplicatedRecord = new CarRecord(
      '', // New ID will be assigned by repository
      expedientNumber,
      `${originalRecord.title} (Copia)`,
      originalRecord.isSale,
      [...originalRecord.documents], // Copy documents array
      userId,
      new Date(),
      new Date(),
      originalRecord.notes,
      originalRecord.saleData ? { ...originalRecord.saleData } : undefined // Deep copy sale data
    );

    return await this.carRecordRepository.create(duplicatedRecord);
  }

  async generateReport(filters: {
    dateFrom?: Date;
    dateTo?: Date;
    isSale?: boolean;
    createdBy?: string;
  }): Promise<{
    records: ReturnType<CarRecord['toSummary']>[];
    stats: {
      total: number;
      sales: number;
      other: number;
      totalDocuments: number;
      averageDocumentsPerRecord: number;
      totalSize: number;
    };
  }> {
    const records = await this.carRecordRepository.findMany({
      ...filters,
      limit: 1000 // Large limit for reports
    });

    const summaries = records.map(record => record.toSummary());
    
    const stats = {
      total: records.length,
      sales: records.filter(r => r.isSale).length,
      other: records.filter(r => !r.isSale).length,
      totalDocuments: records.reduce((sum, r) => sum + r.documents.length, 0),
      averageDocumentsPerRecord: records.length > 0 
        ? Math.round((records.reduce((sum, r) => sum + r.documents.length, 0) / records.length) * 100) / 100
        : 0,
      totalSize: records.reduce((sum, r) => sum + r.getTotalDocumentsSize(), 0)
    };

    return {
      records: summaries,
      stats
    };
  }
}