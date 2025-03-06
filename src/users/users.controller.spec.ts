import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Request } from 'express';
import { RequestWithUser } from '../common/types/request.types';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    dailyGoal: 2000,
    quickAccessToken: null,
    lastQuickAccess: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRequest = {
    user: {
      userId: 'user-123',
      email: 'test@example.com',
    },
  } as RequestWithUser;

  const mockUsersService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockUsersService.getProfile.mockResolvedValue(mockUser);

      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual(mockUser);
      expect(service.getProfile).toHaveBeenCalledWith(mockRequest.user.userId);
    });
  });

  describe('updateProfile', () => {
    const updateDto: UpdateProfileDto = {
      name: 'Updated Name',
      email: 'new@example.com',
      password: 'NewPassword123',
      dailyGoal: 2500,
    };

    it('should update and return user profile', async () => {
      const updatedUser = { ...mockUser, ...updateDto, password: undefined };
      mockUsersService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(mockRequest, updateDto);

      expect(result).toEqual(updatedUser);
      expect(service.updateProfile).toHaveBeenCalledWith(
        mockRequest.user.userId,
        updateDto,
      );
    });

    it('should handle partial updates', async () => {
      const partialUpdate: UpdateProfileDto = { name: 'New Name' };
      const updatedUser = { ...mockUser, ...partialUpdate };
      mockUsersService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(mockRequest, partialUpdate);

      expect(result).toEqual(updatedUser);
      expect(service.updateProfile).toHaveBeenCalledWith(
        mockRequest.user.userId,
        partialUpdate,
      );
    });
  });
}); 