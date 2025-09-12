import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Prospect } from '@domain/entities/prospect.entity';
import { ProspectRepository, ProspectFilters, ProspectStats } from '@domain/repositories/prospect.repository';
import { ProspectModel, ProspectDocument } from '../schemas/prospect.schema';

@Injectable()
export class MongooseProspectRepository implements ProspectRepository {
  constructor(
    @InjectModel(ProspectModel.name)
    private readonly prospectModel: Model<ProspectDocument>
  ) {}

  async create(prospect: Prospect): Promise<Prospect> {
    const prospectData = new this.prospectModel({
      name: prospect.name,
      phone: prospect.phone,
      email: prospect.email,
      source: prospect.source,
      sourceDetails: prospect.sourceDetails,
      status: prospect.status,
      interestedListingId: prospect.interestedListingId,
      interestedListingTitle: prospect.interestedListingTitle,
      manualListingDescription: prospect.manualListingDescription,
      budget: prospect.budget,
      message: prospect.message,
      appointmentDate: prospect.appointmentDate,
      appointmentNotes: prospect.appointmentNotes,
      tags: prospect.tags,
      notes: prospect.notes,
      createdBy: prospect.createdBy,
      currentlyAssignedTo: prospect.currentlyAssignedTo,
      reassignmentHistory: prospect.reassignmentHistory,
      createdAt: prospect.createdAt,
      updatedAt: prospect.updatedAt
    });

    const saved = await prospectData.save();
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Prospect | null> {
    const prospect = await this.prospectModel.findById(id).exec();
    return prospect ? this.toDomain(prospect) : null;
  }

  async findMany(filters: ProspectFilters = {}): Promise<Prospect[]> {
    const query = this.buildQuery(filters);
    let mongoQuery = this.prospectModel.find(query);

    // Apply sorting
    switch (filters.sortBy) {
      case 'recent':
        mongoQuery = mongoQuery.sort({ createdAt: -1 });
        break;
      case 'oldest':
        mongoQuery = mongoQuery.sort({ createdAt: 1 });
        break;
      case 'priority':
        mongoQuery = mongoQuery.sort({ status: 1, updatedAt: -1 });
        break;
      case 'name':
        mongoQuery = mongoQuery.sort({ name: 1 });
        break;
      default:
        mongoQuery = mongoQuery.sort({ createdAt: -1 });
    }

    // Apply pagination
    if (filters.skip) {
      mongoQuery = mongoQuery.skip(filters.skip);
    }
    if (filters.limit) {
      mongoQuery = mongoQuery.limit(filters.limit);
    }

    const prospects = await mongoQuery.exec();
    return prospects.map(prospect => this.toDomain(prospect));
  }

  async findByAssignee(assignedTo: string, limit = 20, skip = 0): Promise<Prospect[]> {
    const prospects = await this.prospectModel
      .find({
        $or: [
          { currentlyAssignedTo: assignedTo },
          { currentlyAssignedTo: { $exists: false }, createdBy: assignedTo }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return prospects.map(prospect => this.toDomain(prospect));
  }

  async findByCreator(createdBy: string, limit = 20, skip = 0): Promise<Prospect[]> {
    const prospects = await this.prospectModel
      .find({ createdBy })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return prospects.map(prospect => this.toDomain(prospect));
  }

  async findHot(limit = 10): Promise<Prospect[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 3);

    const prospects = await this.prospectModel
      .find({
        $or: [
          { status: 'appointment_scheduled' },
          { 
            status: 'contacted', 
            createdAt: { $gte: sevenDaysAgo }
          }
        ]
      })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .exec();

    return prospects.map(prospect => this.toDomain(prospect));
  }

  async findStale(limit = 10): Promise<Prospect[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const prospects = await this.prospectModel
      .find({
        status: 'new',
        updatedAt: { $lt: sevenDaysAgo }
      })
      .sort({ updatedAt: 1 })
      .limit(limit)
      .exec();

    return prospects.map(prospect => this.toDomain(prospect));
  }

  async update(id: string, updateData: Partial<Prospect>): Promise<boolean> {
    const result = await this.prospectModel
      .updateOne(
        { _id: id },
        { 
          ...updateData,
          updatedAt: new Date()
        }
      )
      .exec();

    return result.modifiedCount > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.prospectModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async getStats(): Promise<ProspectStats> {
    const [statusStats, sourceStats, totalCount, hotCount, staleCount, appointmentCount] = await Promise.all([
      this.prospectModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      this.prospectModel.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } }
      ]),
      this.prospectModel.countDocuments(),
      this.getHotCount(),
      this.getStaleCount(),
      this.prospectModel.countDocuments({ status: 'appointment_scheduled' })
    ]);

    const byStatus = statusStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const bySource = sourceStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCount = await this.prospectModel.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    return {
      total: totalCount,
      byStatus,
      bySource,
      recent: recentCount,
      hot: hotCount,
      stale: staleCount,
      withAppointments: appointmentCount
    };
  }

  async isAssignedTo(prospectId: string, userId: string): Promise<boolean> {
    const prospect = await this.prospectModel.findById(prospectId).exec();
    if (!prospect) return false;

    return prospect.currentlyAssignedTo === userId || 
           (!prospect.currentlyAssignedTo && prospect.createdBy === userId);
  }

  private async getHotCount(): Promise<number> {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    return await this.prospectModel.countDocuments({
      $or: [
        { status: 'appointment_scheduled' },
        { 
          status: 'contacted', 
          createdAt: { $gte: threeDaysAgo }
        }
      ]
    });
  }

  private async getStaleCount(): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return await this.prospectModel.countDocuments({
      status: 'new',
      updatedAt: { $lt: sevenDaysAgo }
    });
  }

  private buildQuery(filters: ProspectFilters): any {
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.source) {
      query.source = filters.source;
    }

    if (filters.assignedTo) {
      query.$or = [
        { currentlyAssignedTo: filters.assignedTo },
        { currentlyAssignedTo: { $exists: false }, createdBy: filters.assignedTo }
      ];
    }

    if (filters.createdBy) {
      query.createdBy = filters.createdBy;
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) {
        query.createdAt.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        query.createdAt.$lte = filters.dateTo;
      }
    }

    if (filters.isHot) {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      query.$or = [
        { status: 'appointment_scheduled' },
        { 
          status: 'contacted', 
          createdAt: { $gte: threeDaysAgo }
        }
      ];
    }

    if (filters.isStale) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      query.status = 'new';
      query.updatedAt = { $lt: sevenDaysAgo };
    }

    if (filters.hasAppointment) {
      query.appointmentDate = { $exists: true };
    }

    return query;
  }

  private toDomain(prospectDoc: ProspectDocument): Prospect {
    return new Prospect(
      prospectDoc._id.toString(),
      prospectDoc.name,
      prospectDoc.phone,
      prospectDoc.source as any,
      prospectDoc.status as any,
      prospectDoc.createdAt,
      prospectDoc.updatedAt,
      prospectDoc.email,
      prospectDoc.sourceDetails,
      prospectDoc.interestedListingId,
      prospectDoc.interestedListingTitle,
      prospectDoc.manualListingDescription,
      prospectDoc.budget,
      prospectDoc.message,
      prospectDoc.appointmentDate,
      prospectDoc.appointmentNotes,
      prospectDoc.tags,
      prospectDoc.notes,
      prospectDoc.createdBy,
      prospectDoc.currentlyAssignedTo,
      prospectDoc.reassignmentHistory
    );
  }
}