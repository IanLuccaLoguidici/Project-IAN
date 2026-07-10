import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is missing from headers');
    }

    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const user = await this.usersService.findByApiKey(keyHash);

    if (!user) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Adapt user properties to be compatible with other Guards depending on User ID
    request.user = { userId: (user as any)._id.toString(), email: user.email };
    
    return true;
  }
}
