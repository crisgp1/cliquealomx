import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Budget, ReassignmentEntry } from '@domain/entities/prospect.entity';

export type ProspectDocument = ProspectModel & Document;

@Schema()
class BudgetSchema {
  @Prop({ required: true, min: 0 })
  min: number;

  @Prop({ required: true, min: 0 })
  max: number;
}

@Schema()
class ReassignmentEntrySchema {
  @Prop({ required: true })
  fromUserId: string;

  @Prop({ required: true })
  toUserId: string;

  @Prop({ required: true })
  reassignedBy: string;

  @Prop({ required: true })
  reason: string;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;
}

@Schema({
  collection: 'prospects',
  timestamps: true
})
export class ProspectModel {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ trim: true })
  email?: string;

  @Prop({
    required: true,
    enum: ['mercadolibre', 'facebook', 'instagram', 'whatsapp', 'website', 'referral', 'other']
  })
  source: string;

  @Prop({ trim: true })
  sourceDetails?: string;

  @Prop({
    required: true,
    enum: ['new', 'contacted', 'appointment_scheduled', 'qualified', 'converted', 'not_interested'],
    default: 'new'
  })
  status: string;

  @Prop({ trim: true })
  interestedListingId?: string;

  @Prop({ trim: true })
  interestedListingTitle?: string;

  @Prop({ trim: true })
  manualListingDescription?: string;

  @Prop({ type: BudgetSchema })
  budget?: Budget;

  @Prop({ trim: true })
  message?: string;

  @Prop()
  appointmentDate?: Date;

  @Prop({ trim: true })
  appointmentNotes?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ trim: true })
  notes?: string;

  @Prop({ required: true })
  createdBy: string;

  @Prop()
  currentlyAssignedTo?: string;

  @Prop({ type: [ReassignmentEntrySchema], default: [] })
  reassignmentHistory: ReassignmentEntry[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ProspectSchema = SchemaFactory.createForClass(ProspectModel);

// Indexes for performance
ProspectSchema.index({ createdBy: 1 });
ProspectSchema.index({ currentlyAssignedTo: 1 });
ProspectSchema.index({ status: 1 });
ProspectSchema.index({ source: 1 });
ProspectSchema.index({ createdAt: -1 });
ProspectSchema.index({ updatedAt: -1 });
ProspectSchema.index({ tags: 1 });
ProspectSchema.index({ phone: 1 }, { unique: true });

// Compound indexes
ProspectSchema.index({ status: 1, currentlyAssignedTo: 1 });
ProspectSchema.index({ createdAt: -1, status: 1 });