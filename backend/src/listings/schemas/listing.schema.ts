import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ListingDocument = Listing & Document;

@Schema({ 
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
})
export class Listing {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  brand: string;

  @Prop({ required: true })
  model: string;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  mileage: number;

  @Prop({ required: true })
  fuelType: string;

  @Prop({ required: true })
  transmission: string;

  @Prop({ required: true })
  bodyType: string;

  @Prop({ required: true })
  color: string;

  @Prop()
  serialNumber?: string;

  @Prop()
  motorNumber?: string;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ 
    type: {
      city: { type: String, required: true },
      state: { type: String, required: true }
    },
    required: true 
  })
  location: {
    city: string;
    state: string;
  };

  @Prop({ 
    type: {
      phone: { type: String, required: true },
      whatsapp: String,
      email: String
    },
    required: true 
  })
  contactInfo: {
    phone: string;
    whatsapp?: string;
    email?: string;
  };

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ 
    type: String, 
    enum: ['active', 'sold', 'reserved', 'inactive'], 
    default: 'active' 
  })
  status: string;

  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  viewsCount: number;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ required: true })
  userId: string;

  createdAt: Date;
  updatedAt: Date;
}

export const ListingSchema = SchemaFactory.createForClass(Listing);