import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModel, UserSchema } from './infrastructure/persistence/schemas/user.schema';
import { MongooseUserRepository } from './infrastructure/persistence/repositories/mongoose-user.repository';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { UserController } from './presentation/controllers/user.controller';
import { UserRepository } from './domain/repositories/user.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserModel.name, schema: UserSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [
    CreateUserUseCase,
    {
      provide: UserRepository,
      useClass: MongooseUserRepository,
    },
  ],
  exports: [UserRepository],
})
export class UserModule {}
