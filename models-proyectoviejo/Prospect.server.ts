import { ObjectId } from "mongodb";
import { db } from "~/lib/db.server";

export interface Prospect {
  _id?: ObjectId;
  name: string;
  email?: string;
  phone: string;
  source: 'mercadolibre' | 'facebook' | 'instagram' | 'whatsapp' | 'website' | 'referral' | 'other';
  sourceDetails?: string;
  interestedListingId?: ObjectId;
  interestedListingTitle?: string;
  manualListingDescription?: string;
  budget?: {
    min: number;
    max: number;
  };
  message?: string;
  status: 'new' | 'contacted' | 'appointment_scheduled' | 'qualified' | 'converted' | 'not_interested';
  appointmentDate?: Date;
  appointmentNotes?: string;
  tags?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: ObjectId;
  createdBy?: string; // Clerk user ID of who originally created this prospect (never changes)
  currentlyAssignedTo?: string; // Clerk user ID of who is currently handling this prospect
  reassignmentHistory?: Array<{
    fromUserId: string;
    toUserId: string;
    reassignedBy: string; // Super admin who made the change
    reason: string;
    timestamp: Date;
  }>;
}

export class ProspectModel {
  private static collection = "prospects";

  static async create(prospectData: Omit<Prospect, '_id' | 'createdAt' | 'updatedAt'>): Promise<Prospect> {
    
    const prospect: Prospect = {
      ...prospectData,
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection(this.collection).insertOne(prospect);
    return { ...prospect, _id: result.insertedId };
  }

  static async findById(id: string): Promise<Prospect | null> {
    return await db.collection(this.collection).findOne({ _id: new ObjectId(id) });
  }

  static async findAll(filters?: {
    status?: string;
    source?: string;
    assignedTo?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<Prospect[]> {
    
    const query: any = {};
    
    if (filters?.status) query.status = filters.status;
    if (filters?.source) query.source = filters.source;
    if (filters?.assignedTo) query.assignedTo = new ObjectId(filters.assignedTo);
    if (filters?.dateFrom || filters?.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = filters.dateFrom;
      if (filters.dateTo) query.createdAt.$lte = filters.dateTo;
    }

    return await db.collection(this.collection)
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
  }

  static async update(id: string, updates: Partial<Prospect>): Promise<Prospect | null> {
    
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    await db.collection(this.collection).updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    return this.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db.collection(this.collection).deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }

  // This method is no longer needed as we're using real Clerk data in the super admin panel

  static async reassignProspect(
    prospectId: string, 
    newVendedorId: string, 
    reassignedBy: string, 
    reason: string
  ): Promise<Prospect | null> {
    const prospect = await this.findById(prospectId);
    if (!prospect) return null;

    const reassignmentEntry = {
      fromUserId: prospect.currentlyAssignedTo || prospect.createdBy || 'unknown',
      toUserId: newVendedorId,
      reassignedBy,
      reason,
      timestamp: new Date()
    };

    const updateData = {
      // Keep original creator unchanged
      currentlyAssignedTo: newVendedorId, // Only change current assignment
      reassignmentHistory: [
        ...(prospect.reassignmentHistory || []),
        reassignmentEntry
      ],
      updatedAt: new Date()
    };

    await db.collection(this.collection).updateOne(
      { _id: new ObjectId(prospectId) },
      { $set: updateData }
    );

    return this.findById(prospectId);
  }

  static async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    recent: number;
  }> {
    
    const [total, byStatus, bySource, recent] = await Promise.all([
      db.collection(this.collection).countDocuments(),
      db.collection(this.collection).aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]).toArray(),
      db.collection(this.collection).aggregate([
        { $group: { _id: "$source", count: { $sum: 1 } } }
      ]).toArray(),
      db.collection(this.collection).countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ]);

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map(item => [item._id, item.count])),
      bySource: Object.fromEntries(bySource.map(item => [item._id, item.count])),
      recent
    };
  }
}