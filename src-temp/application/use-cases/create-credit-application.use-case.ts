import { Injectable } from '@nestjs/common';
import { 
  CreditApplication, 
  PersonalInfo, 
  EmploymentInfo, 
  FinancialInfo, 
  EmergencyContact 
} from '@domain/entities/credit-application.entity';
import { CreditApplicationRepository } from '@domain/repositories/credit-application.repository';

export interface CreateCreditApplicationDto {
  userId: string; // Clerk ID
  listingId?: string;
  personalInfo: PersonalInfo;
  employmentInfo: EmploymentInfo;
  financialInfo: FinancialInfo;
  emergencyContact: EmergencyContact;
}

@Injectable()
export class CreateCreditApplicationUseCase {
  constructor(
    private readonly creditApplicationRepository: CreditApplicationRepository
  ) {}

  async execute(dto: CreateCreditApplicationDto): Promise<CreditApplication> {
    const application = new CreditApplication(
      '', // ID will be set by repository
      dto.userId,
      dto.personalInfo,
      dto.employmentInfo,
      dto.financialInfo,
      dto.emergencyContact,
      [], // documents - empty initially
      'pending',
      new Date(),
      new Date(),
      dto.listingId
    );

    return await this.creditApplicationRepository.create(application);
  }
}