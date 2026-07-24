import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SessionService } from './session.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class RedisSessionGuard implements CanActivate {
  constructor(
    private readonly sessionService: SessionService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Attempt to extract sessionId from cookie-parser or raw cookie header
    let sessionId: string | undefined = request.cookies?.['sessionId'];

    if (!sessionId && request.headers.cookie) {
      const cookies = this.parseCookies(request.headers.cookie);
      sessionId = cookies['sessionId'];
    }

    if (!sessionId) {
      throw new UnauthorizedException('Session ID is missing from cookies');
    }

    const session = await this.sessionService.get(sessionId);
    if (!session || !session.userId) {
      throw new UnauthorizedException('Session is invalid or expired');
    }

    const user = await this.usersService.findById(session.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    request.user = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    };

    return true;
  }

  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    const pairs = cookieHeader.split(';');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        cookies[key.trim()] = value.trim();
      }
    }
    return cookies;
  }
}
