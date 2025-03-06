import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '@prisma/client';
import { RequestWithUser } from '../common/types/request.types';
import { Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    dailyGoal: null,
    quickAccessToken: 'test-quick-access-token',
    lastQuickAccess: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRequest = {
    user: {
      userId: '1',
      email: 'test@example.com',
    },
  } as unknown as RequestWithUser;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getUserById: jest.fn(),
    generateQuickAccess: jest.fn(),
    revokeQuickAccess: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should call authService.login with credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Password123',
      };
      await controller.login(loginDto);
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('register', () => {
    it('should call authService.register with user data', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      };
      await controller.register(registerDto);
      expect(service.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('checkAuth', () => {
    it('should return user data for authenticated user', async () => {
      const { password, ...safeUser } = mockUser;
      mockAuthService.getUserById.mockResolvedValue(safeUser);

      const result = await controller.checkAuth(mockRequest);

      expect(result).toEqual(safeUser);
      expect(service.getUserById).toHaveBeenCalledWith(mockRequest.user.userId);
    });
  });

  describe('generateQuickAccess', () => {
    it('should generate quick access token for user', async () => {
      const { password, ...safeUser } = mockUser;
      mockAuthService.generateQuickAccess.mockResolvedValue(safeUser);

      const result = await controller.generateQuickAccess(mockRequest);

      expect(result).toEqual(safeUser);
      expect(service.generateQuickAccess).toHaveBeenCalledWith(mockRequest.user.userId);
    });
  });

  describe('revokeQuickAccess', () => {
    it('should revoke quick access token for user', async () => {
      const { password, ...safeUser } = { ...mockUser, quickAccessToken: null };
      mockAuthService.revokeQuickAccess.mockResolvedValue(safeUser);

      const result = await controller.revokeQuickAccess(mockRequest);

      expect(result).toEqual(safeUser);
      expect(service.revokeQuickAccess).toHaveBeenCalledWith(mockRequest.user.userId);
    });
  });
}); 