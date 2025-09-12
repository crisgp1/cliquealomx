import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BankPartnerIncident, ContactInfo, IncidentStats } from '@domain/entities/bank-partner.entity';

export type BankPartnerDocument = BankPartnerSchema & Document;

@Schema({
  timestamps: true,
  collection: 'bank_partners'
})
export class BankPartnerSchema {
  @Prop({ required: true })
  name: string;

  @Prop()
  logo?: string;

  @Prop({ required: true })
  creditRate: number; // Tasa de interés anual

  @Prop({ required: true })
  minTerm: number; // Plazo mínimo en meses

  @Prop({ required: true })
  maxTerm: number; // Plazo máximo en meses

  @Prop()
  minVehicleYear?: number; // Año mínimo del vehículo

  @Prop({ type: [String], required: true })
  requirements: string[]; // Requisitos específicos del banco

  @Prop({ required: true })
  processingTime: number; // Tiempo de procesamiento en días

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: {
      phone: String,
      email: String,
      website: String
    }
  })
  contactInfo?: ContactInfo;

  @Prop({
    type: [{
      id: String,
      type: { 
        type: String, 
        enum: ['tardanza', 'no_respuesta', 'mala_atencion', 'documentos_faltantes', 'proceso_lento', 'otro']
      },
      description: String,
      severity: { 
        type: String, 
        enum: ['baja', 'media', 'alta', 'critica']
      },
      reportedBy: String, // Clerk ID
      reportedAt: Date,
      resolved: { type: Boolean, default: false },
      resolvedAt: Date,
      resolvedBy: String, // Clerk ID
      notes: String
    }],
    default: []
  })
  incidents: BankPartnerIncident[];

  @Prop({
    type: {
      total: { type: Number, default: 0 },
      unresolved: { type: Number, default: 0 },
      lastIncident: Date
    }
  })
  incidentStats?: IncidentStats;

  @Prop({ required: true })
  createdBy: string; // Clerk ID

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;
}

export const BankPartnerSchemaFactory = SchemaFactory.createForClass(BankPartnerSchema);