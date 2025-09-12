import { Injectable, ConflictException } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserEmail } from '../../domain/value-objects/user-email.vo';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(createUserDto: CreateUserDto): Promise<User> {
    const { clerkId, email, firstName, lastName, imageUrl } = createUserDto;

    // Verificar si el usuario ya existe
    const existingUserByClerkId = await this.userRepository.findByClerkId(clerkId);
    if (existingUserByClerkId) {
      throw new ConflictException('User already exists with this Clerk ID');
    }

    const userEmail = new UserEmail(email);
    const existingUserByEmail = await this.userRepository.findByEmail(userEmail);
    if (existingUserByEmail) {
      throw new ConflictException('User already exists with this email');
    }

    // Crear el usuario
    const user = User.create(clerkId, userEmail, firstName, lastName, imageUrl);

    // Guardar el usuario
    await this.userRepository.save(user);

    return user;
  }
}
