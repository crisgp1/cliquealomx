import { Injectable } from '@nestjs/common';
import { BankPartner } from '@domain/entities/bank-partner.entity';
import { BankPartnerRepository, BankPartnerFilters } from '@domain/repositories/bank-partner.repository';

@Injectable()
export class GetBankPartnersUseCase {
  constructor(
    private readonly bankPartnerRepository: BankPartnerRepository
  ) {}

  async execute(filters: BankPartnerFilters = {}): Promise<BankPartner[]> {
    return await this.bankPartnerRepository.findAll(filters);
  }

  async getById(id: string): Promise<BankPartner | null> {
    return await this.bankPartnerRepository.findById(id);
  }

  async getActiveOnly(): Promise<BankPartner[]> {
    return await this.bankPartnerRepository.findAll({ isActive: true });
  }

  async getStats(): Promise<any> {
    return await this.bankPartnerRepository.getStats();
  }

  async getIncidentStats(): Promise<any[]> {
    return await this.bankPartnerRepository.getIncidentStats();
  }
}