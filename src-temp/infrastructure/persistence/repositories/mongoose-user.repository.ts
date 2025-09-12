import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../../domain/entities/user.entity';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { UserEmail } from '../../../domain/value-objects/user-email.vo';
import { UserModel, UserDocument } from '../schemas/user.schema';

@Injectable()
export class MongooseUserRepository implements UserRepository {
  constructor(
    @InjectModel(UserModel.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async save(user: User): Promise<void> {
    const userData = user.toPrimitives();
    const userDocument = new this.userModel(userData);
    await userDocument.save();
  }

  async findById(id: UserId): Promise<User | null> {
    const userDocument = await this.userModel.findOne({ clerkId: id.value }).exec();
    return userDocument ? this.toDomainEntity(userDocument) : null;
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    const userDocument = await this.userModel.findOne({ clerkId }).exec();
    return userDocument ? this.toDomainEntity(userDocument) : null;
  }

  async findByEmail(email: UserEmail): Promise<User | null> {
    const userDocument = await this.userModel.findOne({ email: email.value }).exec();
    return userDocument ? this.toDomainEntity(userDocument) : null;
  }

  async update(user: User): Promise<void> {
    const userData = user.toPrimitives();
    await this.userModel.updateOne(
      { clerkId: userData.clerkId },
      { $set: userData },
    ).exec();
  }

  async delete(id: UserId): Promise<void> {
    await this.userModel.deleteOne({ clerkId: id.value }).exec();
  }

  async findAll(): Promise<User[]> {
    const userDocuments = await this.userModel.find().exec();
    return userDocuments.map(doc => this.toDomainEntity(doc));
  }

  private toDomainEntity(userDocument: UserDocument): User {
    return User.fromPrimitives({
      clerkId: userDocument.clerkId,
      email: userDocument.email,
      firstName: userDocument.firstName,
      lastName: userDocument.lastName,
      imageUrl: userDocument.imageUrl,
      createdAt: userDocument.createdAt,
      updatedAt: userDocument.updatedAt,
    });
  }
}
