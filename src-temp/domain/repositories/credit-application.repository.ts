import { CreditApplication } from '@domain/entities/credit-application.entity';

export interface CreditApplicationFilters {
  status?: CreditApplication['status'];
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  skip?: number;
}

export abstract class CreditApplicationRepository {
  abstract create(application: CreditApplication): Promise<CreditApplication>;
  abstract findById(id: string): Promise<CreditApplication | null>;
  abstract findByUserId(userId: string, limit?: number, skip?: number): Promise<CreditApplication[]>;
  abstract findAll(filters: CreditApplicationFilters): Promise<CreditApplication[]>;
  abstract update(id: string, updateData: Partial<CreditApplication>): Promise<boolean>;
  abstract delete(id: string): Promise<boolean>;
  abstract isOwner(applicationId: string, userId: string): Promise<boolean>;
  abstract getStats(): Promise<any>;
}