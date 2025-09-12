import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prospect, Budget } from '@domain/entities/prospect.entity';
import { ProspectRepository } from '@domain/repositories/prospect.repository';

@Injectable()
export class ManageProspectUseCase {
  constructor(
    private readonly prospectRepository: ProspectRepository
  ) {}

  async updateStatus(
    prospectId: string, 
    status: Prospect['status'], 
    userId: string
  ): Promise<boolean> {
    const prospect = await this.prospectRepository.findById(prospectId);
    
    if (!prospect) {
      throw new NotFoundException('Prospecto no encontrado');
    }

    if (!prospect.isAssignedTo(userId)) {
      throw new ForbiddenException('No tienes permisos para modificar este prospecto');
    }

    prospect.updateStatus(status);
    return await this.prospectRepository.update(prospectId, prospect);
  }

  async scheduleAppointment(
    prospectId: string, 
    appointmentDate: Date, 
    notes: string | undefined,
    userId: string
  ): Promise<boolean> {
    const prospect = await this.prospectRepository.findById(prospectId);
    
    if (!prospect) {
      throw new NotFoundException('Prospecto no encontrado');
    }

    if (!prospect.isAssignedTo(userId)) {
      throw new ForbiddenException('No tienes permisos para modificar este prospecto');
    }

    prospect.scheduleAppointment(appointmentDate, notes);
    return await this.prospectRepository.update(prospectId, prospect);
  }

  async updateContactInfo(
    prospectId: string, 
    updates: {
      name?: string;
      phone?: string;
      email?: string;
    },
    userId: string
  ): Promise<boolean> {
    const prospect = await this.prospectRepository.findById(prospectId);
    
    if (!prospect) {
      throw new NotFoundException('Prospecto no encontrado');
    }

    if (!prospect.isAssignedTo(userId)) {
      throw new ForbiddenException('No tienes permisos para modificar este prospecto');
    }

    prospect.updateContactInfo(updates);

    // Validate after update
    const validation = prospect.validate();
    if (!validation.isValid) {
      throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
    }

    return await this.prospectRepository.update(prospectId, prospect);
  }

  async updateInterest(
    prospectId: string, 
    updates: {
      interestedListingId?: string;
      interestedListingTitle?: string;
      manualListingDescription?: string;
      budget?: Budget;
    },
    userId: string
  ): Promise<boolean> {
    const prospect = await this.prospectRepository.findById(prospectId);
    
    if (!prospect) {
      throw new NotFoundException('Prospecto no encontrado');
    }

    if (!prospect.isAssignedTo(userId)) {
      throw new ForbiddenException('No tienes permisos para modificar este prospecto');
    }

    prospect.updateInterest(updates);
    return await this.prospectRepository.update(prospectId, prospect);
  }

  async updateNotes(
    prospectId: string, 
    notes: string, 
    userId: string
  ): Promise<boolean> {
    const prospect = await this.prospectRepository.findById(prospectId);
    
    if (!prospect) {
      throw new NotFoundException('Prospecto no encontrado');
    }

    if (!prospect.isAssignedTo(userId)) {
      throw new ForbiddenException('No tienes permisos para modificar este prospecto');
    }

    prospect.updateNotes(notes);
    return await this.prospectRepository.update(prospectId, prospect);
  }

  async addTag(
    prospectId: string, 
    tag: string, 
    userId: string
  ): Promise<boolean> {
    const prospect = await this.prospectRepository.findById(prospectId);
    
    if (!prospect) {
      throw new NotFoundException('Prospecto no encontrado');
    }

    if (!prospect.isAssignedTo(userId)) {
      throw new ForbiddenException('No tienes permisos para modificar este prospecto');
    }

    prospect.addTag(tag);
    return await this.prospectRepository.update(prospectId, prospect);
  }

  async removeTag(
    prospectId: string, 
    tag: string, 
    userId: string
  ): Promise<boolean> {
    const prospect = await this.prospectRepository.findById(prospectId);
    
    if (!prospect) {
      throw new NotFoundException('Prospecto no encontrado');
    }

    if (!prospect.isAssignedTo(userId)) {
      throw new ForbiddenException('No tienes permisos para modificar este prospecto');
    }

    prospect.removeTag(tag);
    return await this.prospectRepository.update(prospectId, prospect);
  }

  async reassignProspect(
    prospectId: string, 
    newAssignee: string, 
    reassignedBy: string, 
    reason: string
  ): Promise<boolean> {
    const prospect = await this.prospectRepository.findById(prospectId);
    
    if (!prospect) {
      throw new NotFoundException('Prospecto no encontrado');
    }

    if (!prospect.canBeReassigned()) {
      throw new ForbiddenException('Este prospecto no puede ser reasignado');
    }

    prospect.reassign(newAssignee, reassignedBy, reason);
    return await this.prospectRepository.update(prospectId, prospect);
  }

  async delete(prospectId: string, userId: string): Promise<boolean> {
    const prospect = await this.prospectRepository.findById(prospectId);
    
    if (!prospect) {
      throw new NotFoundException('Prospecto no encontrado');
    }

    if (!prospect.isAssignedTo(userId)) {
      throw new ForbiddenException('No tienes permisos para eliminar este prospecto');
    }

    return await this.prospectRepository.delete(prospectId);
  }

  async validateOwnership(prospectId: string, userId: string): Promise<boolean> {
    return await this.prospectRepository.isAssignedTo(prospectId, userId);
  }

  async bulkUpdate(
    prospectIds: string[], 
    updates: {
      status?: Prospect['status'];
      assignedTo?: string;
      tags?: string[];
    },
    userId: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const prospectId of prospectIds) {
      try {
        const prospect = await this.prospectRepository.findById(prospectId);
        
        if (!prospect) {
          failed++;
          errors.push(`Prospecto ${prospectId} no encontrado`);
          continue;
        }

        if (!prospect.isAssignedTo(userId)) {
          failed++;
          errors.push(`Sin permisos para modificar prospecto ${prospectId}`);
          continue;
        }

        if (updates.status) {
          prospect.updateStatus(updates.status);
        }

        if (updates.assignedTo && updates.assignedTo !== prospect.getAssignedUser()) {
          prospect.reassign(updates.assignedTo, userId, 'Actualización masiva');
        }

        if (updates.tags) {
          // Replace all tags
          prospect.tags = [...updates.tags];
          prospect.updatedAt = new Date();
        }

        const updated = await this.prospectRepository.update(prospectId, prospect);
        if (updated) {
          success++;
        } else {
          failed++;
          errors.push(`Error al actualizar prospecto ${prospectId}`);
        }
      } catch (error) {
        failed++;
        errors.push(`Error en prospecto ${prospectId}: ${error.message}`);
      }
    }

    return { success, failed, errors };
  }

  async generateReport(filters: {
    dateFrom?: Date;
    dateTo?: Date;
    status?: Prospect['status'];
    source?: Prospect['source'];
    assignedTo?: string;
  }): Promise<{
    prospects: ReturnType<Prospect['toSummary']>[];
    stats: {
      total: number;
      byStatus: Record<string, number>;
      bySource: Record<string, number>;
      hot: number;
      stale: number;
      converted: number;
      averageDaysToConvert: number;
    };
  }> {
    const prospects = await this.prospectRepository.findMany({
      ...filters,
      limit: 1000 // Large limit for reports
    });

    const summaries = prospects.map(prospect => prospect.toSummary());
    
    const byStatus = prospects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySource = prospects.reduce((acc, p) => {
      acc[p.source] = (acc[p.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const converted = prospects.filter(p => p.status === 'converted');
    const averageDaysToConvert = converted.length > 0 
      ? Math.round(converted.reduce((sum, p) => sum + p.getDaysOld(), 0) / converted.length)
      : 0;

    const stats = {
      total: prospects.length,
      byStatus,
      bySource,
      hot: prospects.filter(p => p.isHot()).length,
      stale: prospects.filter(p => p.isStale()).length,
      converted: converted.length,
      averageDaysToConvert
    };

    return {
      prospects: summaries,
      stats
    };
  }
}