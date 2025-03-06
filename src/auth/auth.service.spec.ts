import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    dailyGoal: null,
    quickAccessToken: null,
    lastQuickAccess: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashedPassword'));

      const result = await service.register(registerDto);

      expect(result).toEqual({
        access_token: 'test-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          dailyGoal: mockUser.dailyGoal,
          quickAccessToken: mockUser.quickAccessToken,
          lastQuickAccess: mockUser.lastQuickAccess,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
      });
    });

    it('should throw if email exists', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Password123',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should return token on successful login', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Password123',
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        dailyGoal: mockUser.dailyGoal,
        quickAccessToken: mockUser.quickAccessToken,
        lastQuickAccess: mockUser.lastQuickAccess,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: 'test-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          dailyGoal: mockUser.dailyGoal,
          quickAccessToken: mockUser.quickAccessToken,
          lastQuickAccess: mockUser.lastQuickAccess,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
      });
    });

    it('should throw on invalid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
}); 