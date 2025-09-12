import { User } from '../entities/user.entity';
import { UserId } from '../value-objects/user-id.vo';
import { UserEmail } from '../value-objects/user-email.vo';

export interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  findByClerkId(clerkId: string): Promise<User | null>;
  findByEmail(email: UserEmail): Promise<User | null>;
  update(user: User): Promise<void>;
  delete(id: UserId): Promise<void>;
  findAll(): Promise<User[]>;
}
