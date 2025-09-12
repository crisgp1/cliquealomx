import { Injectable, NotFoundException } from '@nestjs/common';
import { BankPartner, BankPartnerIncident } from '@domain/entities/bank-partner.entity';
import { BankPartnerRepository, BestMatchFilters } from '@domain/repositories/bank-partner.repository';

@Injectable()
export class ManageBankPartnerUseCase {
  constructor(
    private readonly bankPartnerRepository: BankPartnerRepository
  ) {}

  async updateCreditRate(id: string, creditRate: number): Promise<boolean> {
    const bankPartner = await this.bankPartnerRepository.findById(id);
    if (!bankPartner) {
      throw new NotFoundException('Aliado bancario no encontrado');
    }

    bankPartner.updateCreditRate(creditRate);
    return await this.bankPartnerRepository.update(id, bankPartner);
  }

  async updateMinVehicleYear(id: string, minVehicleYear: number | null): Promise<boolean> {
    const bankPartner = await this.bankPartnerRepository.findById(id);
    if (!bankPartner) {
      throw new NotFoundException('Aliado bancario no encontrado');
    }

    bankPartner.updateMinVehicleYear(minVehicleYear);
    return await this.bankPartnerRepository.update(id, bankPartner);
  }

  async toggleActive(id: string): Promise<boolean> {
    const bankPartner = await this.bankPartnerRepository.findById(id);
    if (!bankPartner) {
      throw new NotFoundException('Aliado bancario no encontrado');
    }

    bankPartner.toggleActive();
    return await this.bankPartnerRepository.update(id, bankPartner);
  }

  async reportIncident(
    bankPartnerId: string,
    incidentData: {
      type: BankPartnerIncident['type'];
      description: string;
      severity: BankPartnerIncident['severity'];
      reportedBy: string;
    }
  ): Promise<BankPartnerIncident> {
    const bankPartner = await this.bankPartnerRepository.findById(bankPartnerId);
    if (!bankPartner) {
      throw new NotFoundException('Aliado bancario no encontrado');
    }

    const incident = bankPartner.reportIncident(incidentData);
    await this.bankPartnerRepository.update(bankPartnerId, bankPartner);
    
    return incident;
  }

  async resolveIncident(
    bankPartnerId: string,
    incidentId: string,
    resolvedBy: string,
    notes?: string
  ): Promise<boolean> {
    const bankPartner = await this.bankPartnerRepository.findById(bankPartnerId);
    if (!bankPartner) {
      throw new NotFoundException('Aliado bancario no encontrado');
    }

    const resolved = bankPartner.resolveIncident(incidentId, resolvedBy, notes);
    if (!resolved) {
      throw new NotFoundException('Incidencia no encontrada o ya resuelta');
    }

    await this.bankPartnerRepository.update(bankPartnerId, bankPartner);
    return true;
  }

  async getIncidents(
    bankPartnerId: string,
    filters: {
      resolved?: boolean;
      type?: BankPartnerIncident['type'];
      severity?: BankPartnerIncident['severity'];
      limit?: number;
    } = {}
  ): Promise<BankPartnerIncident[]> {
    const bankPartner = await this.bankPartnerRepository.findById(bankPartnerId);
    if (!bankPartner) {
      throw new NotFoundException('Aliado bancario no encontrado');
    }

    return bankPartner.getIncidentsByFilter(filters);
  }

  async findBestOptions(filters: BestMatchFilters): Promise<BankPartner[]> {
    return await this.bankPartnerRepository.findBestMatch(filters);
  }

  async getActiveForSimulator(): Promise<BankPartner[]> {
    return await this.bankPartnerRepository.findActiveForSimulator();
  }

  async getActiveForVehicleYear(vehicleYear: number): Promise<BankPartner[]> {
    return await this.bankPartnerRepository.findActiveForVehicleYear(vehicleYear);
  }

  async calculateQuote(
    bankPartnerId: string,
    amount: number,
    term: number,
    vehicleYear?: number
  ): Promise<{
    bankPartner: BankPartner;
    monthlyPayment: number;
    totalPayment: number;
    totalInterest: number;
    eligible: boolean;
  }> {
    const bankPartner = await this.bankPartnerRepository.findById(bankPartnerId);
    if (!bankPartner) {
      throw new NotFoundException('Aliado bancario no encontrado');
    }

    const eligible = bankPartner.isEligibleForAmount(amount, term, vehicleYear);
    const monthlyPayment = eligible ? bankPartner.calculateMonthlyPayment(amount, term) : 0;
    const totalPayment = monthlyPayment * term;
    const totalInterest = totalPayment - amount;

    return {
      bankPartner,
      monthlyPayment,
      totalPayment,
      totalInterest,
      eligible
    };
  }
}