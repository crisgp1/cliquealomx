import { User } from '../entities/user.entity';

export interface CreateUserRequest {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
}

export interface UserRepository {
  create(userData: CreateUserRequest): Promise<User>;
  findByClerkId(clerkId: string): Promise<User | null>;
  findAll(): Promise<User[]>;
}
