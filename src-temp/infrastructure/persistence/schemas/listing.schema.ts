import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { MediaFile, VehicleDocument, Location, ContactInfo } from '@domain/entities/listing.entity';

export type ListingDocument = ListingSchema & Document;

@Schema({ 
  timestamps: true,
  collection: 'listings'
})
export class ListingSchema {
  @Prop({ required: true })
  userId: string; // Clerk ID

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  brand: string;

  @Prop({ required: true })
  model: string;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  price: number;

  @Prop({ type: [String], default: [] })
  images?: string[];

  @Prop({ type: [String], default: [] })
  videos?: string[];

  @Prop({ 
    type: [{
      id: String,
      url: String,
      type: { type: String, enum: ['image', 'video'] },
      name: String,
      size: Number,
      uploadedAt: Date
    }],
    default: []
  })
  media?: MediaFile[];

  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  viewsCount: number;

  @Prop({ 
    type: String, 
    enum: ['active', 'sold', 'reserved', 'inactive'], 
    default: 'active' 
  })
  status: 'active' | 'sold' | 'reserved' | 'inactive';

  @Prop({ type: [String], default: [] })
  features?: string[];

  @Prop()
  mileage?: number;

  @Prop({ 
    type: String, 
    enum: ['gasolina', 'diesel', 'hibrido', 'electrico'] 
  })
  fuelType?: 'gasolina' | 'diesel' | 'hibrido' | 'electrico';

  @Prop({ 
    type: String, 
    enum: ['manual', 'automatico'] 
  })
  transmission?: 'manual' | 'automatico';

  @Prop({ 
    type: String, 
    enum: ['sedan', 'suv', 'hatchback', 'pickup', 'coupe', 'convertible'] 
  })
  bodyType?: 'sedan' | 'suv' | 'hatchback' | 'pickup' | 'coupe' | 'convertible';

  @Prop()
  color?: string;

  @Prop({
    type: {
      city: String,
      state: String
    }
  })
  location?: Location;

  @Prop({
    type: {
      phone: String,
      whatsapp: String,
      email: String
    }
  })
  contactInfo?: ContactInfo;

  @Prop()
  serialNumber?: string;

  @Prop()
  motorNumber?: string;

  @Prop({
    type: [{
      id: String,
      name: String,
      type: { 
        type: String, 
        enum: ['factura', 'tarjeta_circulacion', 'verificacion', 'tenencia', 'seguro', 'repuve', 'otro'] 
      },
      url: String,
      uploadedAt: Date,
      notes: String
    }],
    default: []
  })
  vehicleDocuments?: VehicleDocument[];

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  @Prop()
  soldAt?: Date;

  @Prop({ default: false })
  isFeatured?: boolean;
}

export const ListingSchemaFactory = SchemaFactory.createForClass(ListingSchema);