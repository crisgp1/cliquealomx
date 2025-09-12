import { Injectable } from '@nestjs/common';
import { Prospect } from '@domain/entities/prospect.entity';
import { ProspectRepository, ProspectFilters, ProspectStats } from '@domain/repositories/prospect.repository';

@Injectable()
export class GetProspectsUseCase {
  constructor(
    private readonly prospectRepository: ProspectRepository
  ) {}

  async execute(filters: ProspectFilters = {}): Promise<Prospect[]> {
    return await this.prospectRepository.findMany(filters);
  }

  async getById(id: string): Promise<Prospect | null> {
    return await this.prospectRepository.findById(id);
  }

  async getByAssignee(assignedTo: string, limit = 20, skip = 0): Promise<Prospect[]> {
    return await this.prospectRepository.findByAssignee(assignedTo, limit, skip);
  }

  async getByCreator(createdBy: string, limit = 20, skip = 0): Promise<Prospect[]> {
    return await this.prospectRepository.findByCreator(createdBy, limit, skip);
  }

  async getHotProspects(limit = 10): Promise<Prospect[]> {
    return await this.prospectRepository.findHot(limit);
  }

  async getStaleProspects(limit = 10): Promise<Prospect[]> {
    return await this.prospectRepository.findStale(limit);
  }

  async getNewProspects(limit = 20): Promise<Prospect[]> {
    return await this.prospectRepository.findMany({
      status: 'new',
      limit,
      sortBy: 'recent'
    });
  }

  async getAppointments(assignedTo?: string): Promise<Prospect[]> {
    return await this.prospectRepository.findMany({
      status: 'appointment_scheduled',
      assignedTo,
      hasAppointment: true,
      sortBy: 'recent'
    });
  }

  async getByStatus(status: Prospect['status'], assignedTo?: string): Promise<Prospect[]> {
    return await this.prospectRepository.findMany({
      status,
      assignedTo,
      sortBy: 'recent'
    });
  }

  async getBySource(source: Prospect['source'], assignedTo?: string): Promise<Prospect[]> {
    return await this.prospectRepository.findMany({
      source,
      assignedTo,
      sortBy: 'recent'
    });
  }

  async getStats(): Promise<ProspectStats> {
    return await this.prospectRepository.getStats();
  }

  async getSummaries(filters: ProspectFilters = {}): Promise<ReturnType<Prospect['toSummary']>[]> {
    const prospects = await this.execute(filters);
    return prospects.map(prospect => prospect.toSummary());
  }

  async getDashboardData(assignedTo?: string): Promise<{
    stats: ProspectStats;
    hotProspects: Prospect[];
    staleProspects: Prospect[];
    recentAppointments: Prospect[];
    newProspects: Prospect[];
  }> {
    const [stats, hotProspects, staleProspects, appointments, newProspects] = await Promise.all([
      this.getStats(),
      this.getHotProspects(5),
      this.getStaleProspects(5),
      this.getAppointments(assignedTo),
      this.getNewProspects(10)
    ]);

    return {
      stats,
      hotProspects,
      staleProspects,
      recentAppointments: appointments.slice(0, 5),
      newProspects
    };
  }
}