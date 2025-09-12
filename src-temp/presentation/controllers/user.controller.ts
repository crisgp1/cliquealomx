import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { CreateUserDto } from '../../application/dto/create-user.dto';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserId } from '../../domain/value-objects/user-id.vo';

@Controller('api/users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly userRepository: UserRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.createUserUseCase.execute(createUserDto);
    return {
      success: true,
      data: user.toPrimitives(),
      message: 'User created successfully',
    };
  }

  @Get(':clerkId')
  @UseGuards(ClerkAuthGuard)
  async getUserByClerkId(@Param('clerkId') clerkId: string) {
    const user = await this.userRepository.findByClerkId(clerkId);
    
    if (!user) {
      return {
        success: false,
        data: null,
        message: 'User not found',
      };
    }

    return {
      success: true,
      data: user.toPrimitives(),
      message: 'User retrieved successfully',
    };
  }

  @Get()
  @UseGuards(ClerkAuthGuard)
  async getAllUsers() {
    const users = await this.userRepository.findAll();
    
    return {
      success: true,
      data: users.map(user => user.toPrimitives()),
      message: 'Users retrieved successfully',
    };
  }
}
