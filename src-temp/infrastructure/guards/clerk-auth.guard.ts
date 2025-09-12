import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { verifyToken } from '@clerk/backend';

interface AuthenticatedRequest extends Request {
  auth: {
    userId: string;
    sessionId: string;
  };
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: AuthenticatedRequest = context.switchToHttp().getRequest();
    
    try {
      const token = this.extractTokenFromHeader(request);
      if (!token) {
        throw new UnauthorizedException('Token no encontrado');
      }

      const secretKey = this.configService.get<string>('CLERK_SECRET_KEY');
      if (!secretKey) {
        throw new UnauthorizedException('Configuración de autenticación inválida');
      }

      const payload = await verifyToken(token, {
        secretKey: secretKey,
      });

      // Attach user info to request
      request.auth = {
        userId: payload.sub,
        sessionId: payload.sid || ''
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    // Try Authorization header first
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) {
      return token;
    }

    // Try cookie as fallback
    const sessionToken = request.cookies?.__session;
    if (sessionToken) {
      return sessionToken;
    }

    return undefined;
  }
}