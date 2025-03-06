import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedPassword123',
    name: 'Test User',
    dailyGoal: 2000,
    quickAccessToken: null,
    lastQuickAccess: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      const { password, ...safeUser } = mockUser;
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-123');
      expect(result).toEqual(safeUser);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    const updateDto = {
      name: 'Updated Name',
      email: 'new@example.com',
      password: 'NewPassword123',
      dailyGoal: 2500,
    };

    it('should update user profile with all fields', async () => {
      const hashedPassword = 'hashedNewPassword123';
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => hashedPassword);

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.update.mockImplementation(async ({ data }) => ({
        ...mockUser,
        ...data,
        password: hashedPassword,
      }));

      const result = await service.updateProfile('user-123', updateDto);

      expect(result).toEqual(expect.objectContaining({
        name: updateDto.name,
        email: updateDto.email,
        dailyGoal: updateDto.dailyGoal,
      }));
      expect(result).not.toHaveProperty('password');
      expect(bcrypt.hash).toHaveBeenCalledWith(updateDto.password, 10);
    });

    it('should throw BadRequestException when email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        id: 'different-user',
      });

      await expect(
        service.updateProfile('user-123', { email: 'new@example.com' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow updating email to same value', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.updateProfile('user-123', {
        email: mockUser.email,
      });

      expect(result).toEqual(expect.objectContaining({
        email: mockUser.email,
      }));
    });

    it('should update partial fields', async () => {
      const partialUpdate = { name: 'New Name' };
      const updatedUser = { ...mockUser, ...partialUpdate };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-123', partialUpdate);
      const { password, ...expectedUser } = updatedUser;

      expect(result).toEqual(expectedUser);
    });
  });
}); 