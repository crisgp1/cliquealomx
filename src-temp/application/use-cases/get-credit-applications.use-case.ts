import { Injectable } from '@nestjs/common';
import { CreditApplication } from '@domain/entities/credit-application.entity';
import { 
  CreditApplicationRepository, 
  CreditApplicationFilters 
} from '@domain/repositories/credit-application.repository';

@Injectable()
export class GetCreditApplicationsUseCase {
  constructor(
    private readonly creditApplicationRepository: CreditApplicationRepository
  ) {}

  async execute(filters: CreditApplicationFilters = {}): Promise<CreditApplication[]> {
    return await this.creditApplicationRepository.findAll(filters);
  }

  async getById(id: string): Promise<CreditApplication | null> {
    return await this.creditApplicationRepository.findById(id);
  }

  async getByUser(userId: string, limit = 20, skip = 0): Promise<CreditApplication[]> {
    return await this.creditApplicationRepository.findByUserId(userId, limit, skip);
  }

  async getStats(): Promise<any> {
    return await this.creditApplicationRepository.getStats();
  }
}