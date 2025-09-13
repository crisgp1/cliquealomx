import { User, UserProps } from '../../domain/entities/user.entity';
import { UserRepository, CreateUserRequest } from '../../domain/repositories/user.repository';

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
}

export class UserApiRepository implements UserRepository {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  async create(userData: CreateUserRequest): Promise<User> {
    const response = await fetch(`${this.baseUrl}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create user: ${response.statusText}`);
    }

    const apiResponse: ApiResponse<UserProps> = await response.json();

    if (!apiResponse.success) {
      throw new Error(apiResponse.message);
    }

    return User.fromPrimitives(apiResponse.data);
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/${clerkId}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to find user: ${response.statusText}`);
      }

      const apiResponse: ApiResponse<UserProps> = await response.json();

      if (!apiResponse.success || !apiResponse.data) {
        return null;
      }

      return User.fromPrimitives(apiResponse.data);
    } catch (error) {
      console.error('Error finding user by Clerk ID:', error);
      return null;
    }
  }

  async findAll(): Promise<User[]> {
    const response = await fetch(`${this.baseUrl}/api/users`, {
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    const apiResponse: ApiResponse<UserProps[]> = await response.json();

    if (!apiResponse.success) {
      throw new Error(apiResponse.message);
    }

    return apiResponse.data.map(userData => User.fromPrimitives(userData));
  }

  private async getAuthToken(): Promise<string> {
    // En producción, obtener el token de Clerk
    // Por ahora, retornamos un token simulado
    return 'fake-token';
  }
}
