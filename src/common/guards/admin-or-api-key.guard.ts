import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminOrApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // 1. Verificar API Key en los headers
    const apiKey = request.headers['x-api-key'];
    const validApiKey = this.configService.get<string>('ADMIN_API_KEY');
    
    if (apiKey && apiKey === validApiKey) {
      return true;
    }

    // 2. Verificar si el usuario es Admin (asumiendo que viene del JWT Auth Guard previo)
    const user = request.user;
    if (user && user.role === 'admin') {
      return true;
    }

    throw new UnauthorizedException('No tienes permisos para acceder a los logs.');
  }
}
