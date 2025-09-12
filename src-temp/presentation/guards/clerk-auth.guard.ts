import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    try {
      // Verificar el token de Clerk
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('No token provided');
      }

      const token = authHeader.split(' ')[1];
      
      // Aquí deberías verificar el token con Clerk
      // Por ahora, simulamos la verificación
      // En producción, usar: clerkClient.verifyToken(token)
      
      if (!token) {
        throw new UnauthorizedException('Invalid token');
      }

      // Agregar información del usuario al request
      (request as any).auth = {
        userId: 'user_example', // En producción, extraer del token verificado
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
