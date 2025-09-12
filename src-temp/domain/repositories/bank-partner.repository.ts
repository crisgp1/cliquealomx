import { BankPartner } from '@domain/entities/bank-partner.entity';

export interface BankPartnerFilters {
  isActive?: boolean;
  search?: string;
  limit?: number;
  skip?: number;
}

export interface BestMatchFilters {
  amount: number;
  term: number;
  vehicleYear?: number;
}

export abstract class BankPartnerRepository {
  abstract create(bankPartner: BankPartner): Promise<BankPartner>;
  abstract findById(id: string): Promise<BankPartner | null>;
  abstract findAll(filters: BankPartnerFilters): Promise<BankPartner[]>;
  abstract findActiveForSimulator(): Promise<BankPartner[]>;
  abstract findActiveForVehicleYear(vehicleYear: number): Promise<BankPartner[]>;
  abstract findBestMatch(filters: BestMatchFilters): Promise<BankPartner[]>;
  abstract update(id: string, updateData: Partial<BankPartner>): Promise<boolean>;
  abstract delete(id: string): Promise<boolean>;
  abstract getStats(): Promise<any>;
  abstract getIncidentStats(): Promise<any[]>;
}