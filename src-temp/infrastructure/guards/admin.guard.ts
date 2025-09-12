import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  auth: {
    userId: string;
    sessionId: string;
  };
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request: AuthenticatedRequest = context.switchToHttp().getRequest();
    
    if (!request.auth || !request.auth.userId) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Get admin user IDs from environment variables
    const adminUserIds = this.configService.get<string>('ADMIN_USER_IDS')?.split(',') || [];
    
    if (!adminUserIds.includes(request.auth.userId)) {
      throw new ForbiddenException('Acceso administrativo requerido');
    }

    return true;
  }
}