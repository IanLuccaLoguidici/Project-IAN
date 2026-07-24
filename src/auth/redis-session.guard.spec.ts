import { Test, TestingModule } from '@nestjs/testing';
import { RedisSessionGuard } from './redis-session.guard';
import { SessionService } from './session.service';
import { UsersService } from '../users/users.service';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('RedisSessionGuard', () => {
  let guard: RedisSessionGuard;
  let sessionService: jest.Mocked<SessionService>;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const mockSessionService = {
      get: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    };
    const mockUsersService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisSessionGuard,
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    guard = module.get<RedisSessionGuard>(RedisSessionGuard);
    sessionService = module.get(SessionService);
    usersService = module.get(UsersService);
  });

  const createMockContext = (cookieHeaderValue?: string, cookiesObj?: Record<string, string>): ExecutionContext => {
    const req = {
      headers: {
        cookie: cookieHeaderValue,
      },
      cookies: cookiesObj,
      user: undefined,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({}),
      }),
    } as unknown as ExecutionContext;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw UnauthorizedException if no cookie header or cookies object is present', async () => {
    const context = createMockContext();
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if sessionId cookie is missing', async () => {
    const context = createMockContext('otherCookie=value');
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if session is invalid or expired', async () => {
    const context = createMockContext('sessionId=invalid-session-id; other=val');
    sessionService.get.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(sessionService.get).toHaveBeenCalledWith('invalid-session-id');
  });

  it('should throw UnauthorizedException if user in session is not found', async () => {
    const context = createMockContext('sessionId=valid-session-id');
    sessionService.get.mockResolvedValue({ userId: 'user-123' });
    usersService.findById.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(usersService.findById).toHaveBeenCalledWith('user-123');
  });

  it('should attach req.user and return true if session is valid from raw cookie header', async () => {
    const context = createMockContext('sessionId=valid-session-id');
    const mockUser = {
      _id: { toString: () => 'user-123' },
      email: 'test@example.com',
      name: 'John Doe',
    } as any;

    sessionService.get.mockResolvedValue({ userId: 'user-123' });
    usersService.findById.mockResolvedValue(mockUser);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.user).toEqual({
      userId: 'user-123',
      email: 'test@example.com',
      name: 'John Doe',
    });
  });

  it('should attach req.user and return true if session is valid from req.cookies object', async () => {
    const context = createMockContext(undefined, { sessionId: 'valid-session-id' });
    const mockUser = {
      _id: { toString: () => 'user-123' },
      email: 'test@example.com',
      name: 'John Doe',
    } as any;

    sessionService.get.mockResolvedValue({ userId: 'user-123' });
    usersService.findById.mockResolvedValue(mockUser);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.user).toEqual({
      userId: 'user-123',
      email: 'test@example.com',
      name: 'John Doe',
    });
  });
});
