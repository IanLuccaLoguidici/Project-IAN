import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { UsersService } from '../users/users.service';
import { RedisSessionGuard } from './redis-session.guard';
import { LoginDto } from './dto/login.dto';

describe('AuthController (Session Endpoints)', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let sessionService: jest.Mocked<SessionService>;

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      validateUserForSession: jest.fn(),
      googleLogin: jest.fn(),
      refreshTokens: jest.fn(),
      logout: jest.fn(),
      generateApiKey: jest.fn(),
      sendMagicLink: jest.fn(),
      verifyMagicLink: jest.fn(),
    };

    const mockSessionService = {
      create: jest.fn(),
      get: jest.fn(),
      destroy: jest.fn(),
    };

    const mockUsersService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: SessionService, useValue: mockSessionService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: RedisSessionGuard, useValue: { canActivate: () => true } },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    sessionService = module.get(SessionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sessionLogin', () => {
    it('should validate user, create session, set HTTP-only cookie and return success message', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };
      const mockUser = { userId: 'usr-123', email: 'test@example.com' };
      const mockSessionId = 'mock-session-id';

      authService.validateUserForSession.mockResolvedValue(mockUser);
      sessionService.create.mockResolvedValue(mockSessionId);

      const mockResponse = {
        cookie: jest.fn(),
      } as any;

      const result = await controller.sessionLogin(loginDto, mockResponse);

      expect(authService.validateUserForSession).toHaveBeenCalledWith(loginDto);
      expect(sessionService.create).toHaveBeenCalledWith('usr-123');
      expect(mockResponse.cookie).toHaveBeenCalledWith('sessionId', mockSessionId, {
        httpOnly: true,
        secure: false,
        path: '/',
        maxAge: 3600 * 1000,
      });
      expect(result).toEqual({ message: 'Inicio de sesión por Redis exitoso' });
    });
  });

  describe('sessionLogout', () => {
    it('should destroy session if cookie header is present and clear cookie', async () => {
      const mockRequest = {
        headers: {
          cookie: 'sessionId=mock-session-id; other=val',
        },
      } as any;

      const mockResponse = {
        clearCookie: jest.fn(),
      } as any;

      sessionService.destroy.mockResolvedValue();

      const result = await controller.sessionLogout(mockRequest, mockResponse);

      expect(sessionService.destroy).toHaveBeenCalledWith('mock-session-id');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('sessionId', { path: '/' });
      expect(result).toEqual({ message: 'Sesión finalizada y cookie eliminada' });
    });

    it('should handle logout gracefully even if no cookie is provided', async () => {
      const mockRequest = {
        headers: {},
      } as any;

      const mockResponse = {
        clearCookie: jest.fn(),
      } as any;

      const result = await controller.sessionLogout(mockRequest, mockResponse);

      expect(sessionService.destroy).not.toHaveBeenCalled();
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('sessionId', { path: '/' });
      expect(result).toEqual({ message: 'Sesión finalizada y cookie eliminada' });
    });
  });

  describe('getSessionProfile', () => {
    it('should return user from req.user', () => {
      const mockReq = {
        user: { userId: 'usr-123', email: 'test@example.com', name: 'Test User' },
      };

      const profile = controller.getSessionProfile(mockReq);
      expect(profile).toEqual(mockReq.user);
    });
  });
});
