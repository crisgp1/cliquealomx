import { Injectable } from '@nestjs/common';
import { BankPartner } from '@domain/entities/bank-partner.entity';
import { BankPartnerRepository } from '@domain/repositories/bank-partner.repository';

export interface CreateBankPartnerDto {
  name: string;
  logo?: string;
  creditRate: number;
  minTerm: number;
  maxTerm: number;
  minVehicleYear?: number;
  requirements: string[];
  processingTime: number;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  createdBy: string; // Clerk ID
}

@Injectable()
export class CreateBankPartnerUseCase {
  constructor(
    private readonly bankPartnerRepository: BankPartnerRepository
  ) {}

  async execute(dto: CreateBankPartnerDto): Promise<BankPartner> {
    const bankPartner = new BankPartner(
      '', // ID will be set by repository
      dto.name,
      dto.creditRate,
      dto.minTerm,
      dto.maxTerm,
      dto.requirements,
      dto.processingTime,
      true, // isActive - new partners are active by default
      dto.createdBy,
      new Date(),
      new Date(),
      dto.logo,
      dto.minVehicleYear,
      dto.contactInfo,
      [] // incidents - empty initially
    );

    return await this.bankPartnerRepository.create(bankPartner);
  }
}