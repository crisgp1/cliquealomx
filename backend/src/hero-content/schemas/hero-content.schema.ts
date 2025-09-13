import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HeroContentDocument = HeroContent & Document;

export interface MediaFile {
  url: string;
  type: 'image' | 'video';
  filename: string;
  size: number;
}

@Schema({ timestamps: true })
export class HeroContent {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  order: number;

  @Prop({ type: [Object], default: [] })
  mediaFiles: MediaFile[];

  @Prop({ default: true })
  loopMedia: boolean;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const HeroContentSchema = SchemaFactory.createForClass(HeroContent);