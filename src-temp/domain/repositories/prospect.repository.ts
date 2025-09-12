import { Prospect } from '@domain/entities/prospect.entity';

export interface ProspectFilters {
  status?: Prospect['status'];
  source?: Prospect['source'];
  assignedTo?: string;
  createdBy?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  isHot?: boolean;
  isStale?: boolean;
  hasAppointment?: boolean;
  limit?: number;
  skip?: number;
  sortBy?: 'recent' | 'oldest' | 'priority' | 'name';
}

export interface ProspectStats {
  total: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  recent: number;
  hot: number;
  stale: number;
  withAppointments: number;
}

export abstract class ProspectRepository {
  abstract create(prospect: Prospect): Promise<Prospect>;
  abstract findById(id: string): Promise<Prospect | null>;
  abstract findMany(filters: ProspectFilters): Promise<Prospect[]>;
  abstract findByAssignee(assignedTo: string, limit?: number, skip?: number): Promise<Prospect[]>;
  abstract findByCreator(createdBy: string, limit?: number, skip?: number): Promise<Prospect[]>;
  abstract findHot(limit?: number): Promise<Prospect[]>;
  abstract findStale(limit?: number): Promise<Prospect[]>;
  abstract update(id: string, updateData: Partial<Prospect>): Promise<boolean>;
  abstract delete(id: string): Promise<boolean>;
  abstract getStats(): Promise<ProspectStats>;
  abstract isAssignedTo(prospectId: string, userId: string): Promise<boolean>;
}