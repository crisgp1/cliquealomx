import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = UserModel & Document;

@Schema({
  collection: 'users',
  timestamps: true,
})
export class UserModel {
  @Prop({ required: true, unique: true, index: true })
  clerkId: string;

  @Prop({ required: true, unique: true, lowercase: true, index: true })
  email: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: false })
  imageUrl?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserModel);

// Índices adicionales
UserSchema.index({ email: 1 });
UserSchema.index({ clerkId: 1 });
UserSchema.index({ createdAt: -1 });

// Middleware para actualizar updatedAt
UserSchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

UserSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  this.set({ updatedAt: new Date() });
  next();
});
