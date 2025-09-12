import { Injectable } from '@nestjs/common';
import { Prospect, Budget } from '@domain/entities/prospect.entity';
import { ProspectRepository } from '@domain/repositories/prospect.repository';

export interface CreateProspectDto {
  name: string;
  phone: string;
  email?: string;
  source: 'mercadolibre' | 'facebook' | 'instagram' | 'whatsapp' | 'website' | 'referral' | 'other';
  sourceDetails?: string;
  interestedListingId?: string;
  interestedListingTitle?: string;
  manualListingDescription?: string;
  budget?: Budget;
  message?: string;
  tags?: string[];
  notes?: string;
  createdBy?: string; // Clerk ID
}

@Injectable()
export class CreateProspectUseCase {
  constructor(
    private readonly prospectRepository: ProspectRepository
  ) {}

  async execute(dto: CreateProspectDto): Promise<Prospect> {
    const prospect = new Prospect(
      '', // ID will be set by repository
      dto.name,
      dto.phone,
      dto.source,
      'new', // Initial status
      new Date(),
      new Date(),
      dto.email,
      dto.sourceDetails,
      dto.interestedListingId,
      dto.interestedListingTitle,
      dto.manualListingDescription,
      dto.budget,
      dto.message,
      undefined, // appointmentDate
      undefined, // appointmentNotes
      dto.tags || [],
      dto.notes,
      dto.createdBy,
      dto.createdBy, // Initially assigned to creator
      [] // reassignmentHistory
    );

    // Validate the prospect before creating
    const validation = prospect.validate();
    if (!validation.isValid) {
      throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
    }

    return await this.prospectRepository.create(prospect);
  }
}