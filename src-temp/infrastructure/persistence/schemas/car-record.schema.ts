import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DocumentFile, Vehicle, Person, SaleData } from '@domain/entities/car-record.entity';

export type CarRecordDocument = CarRecordSchema & Document;

@Schema({
  timestamps: true,
  collection: 'car_records'
})
export class CarRecordSchema {
  @Prop({ required: true, unique: true })
  expedientNumber: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, default: false })
  isSale: boolean;

  @Prop()
  notes?: string;

  @Prop({
    type: [{
      name: { type: String, required: true },
      url: { type: String, required: true },
      type: { 
        type: String, 
        enum: ['image', 'pdf'], 
        required: true 
      },
      size: Number
    }],
    required: true
  })
  documents: DocumentFile[];

  @Prop({
    type: {
      vehicle: {
        brand: { type: String, required: true },
        model: { type: String, required: true },
        serialNumber: String
      },
      customer: {
        name: { type: String, required: true },
        address: String,
        email: String,
        phone: String,
        idNumber: String
      },
      seller: {
        name: String,
        address: String,
        email: String,
        phone: String,
        idNumber: String
      }
    }
  })
  saleData?: SaleData;

  @Prop({ required: true })
  createdBy: string; // Clerk ID

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;
}

// Add indexes for better performance
CarRecordSchema.index({ expedientNumber: 1 });
CarRecordSchema.index({ createdBy: 1 });
CarRecordSchema.index({ isSale: 1 });
CarRecordSchema.index({ createdAt: -1 });
CarRecordSchema.index({ title: 'text', 'saleData.customer.name': 'text' });

export const CarRecordSchemaFactory = SchemaFactory.createForClass(CarRecordSchema);