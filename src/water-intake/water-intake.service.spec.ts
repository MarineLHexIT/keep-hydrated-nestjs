import { Test, TestingModule } from '@nestjs/testing';
import { WaterIntakeService } from './water-intake.service';
import { PrismaService } from '../prisma/prisma.service';
import { TestUtils } from '../common/test/test-utils';
import { UnauthorizedException } from '@nestjs/common';
import { startOfDay, endOfDay } from 'date-fns';
import { WaterIntake } from '@prisma/client';

describe('WaterIntakeService', () => {
  let service: WaterIntakeService;
  let prisma: PrismaService;
  let testUtils: TestUtils;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WaterIntakeService, PrismaService],
    }).compile();

    service = module.get<WaterIntakeService>(WaterIntakeService);
    prisma = module.get<PrismaService>(PrismaService);
    testUtils = new TestUtils(prisma);

    await testUtils.cleanDb();
  });

  describe('create', () => {
    it('should create a water intake', async () => {
      const user = await testUtils.createTestUser();
      const intake = await service.create(user.id, { amount: 500 });

      expect(intake).toBeDefined();
      expect(intake.amount).toBe(500);
      expect(intake.id).toBeDefined();
    });

    it('should use default amount if not specified', async () => {
      const user = await testUtils.createTestUser();
      const intake = await service.create(user.id, {});

      expect(intake.amount).toBe(500);
    });
  });

  describe('findAll', () => {
    it('should return all water intakes for a user', async () => {
      const user = await testUtils.createTestUser();
      await testUtils.createTestWaterIntakes(user.id, 3);

      const intakes = await service.findAll(user.id);
      expect(intakes).toHaveLength(3);
      expect(intakes[0].id).toBeDefined();
      expect(intakes[0].amount).toBeDefined();
    });

    it('should return empty array if no intakes', async () => {
      const user = await testUtils.createTestUser();
      const intakes = await service.findAll(user.id);
      expect(intakes).toHaveLength(0);
    });
  });

  describe('findToday', () => {
    it('should return only today\'s intakes', async () => {
      const user = await testUtils.createTestUser();
      const today = new Date();
      
      // Create one intake for today
      await prisma.waterIntake.create({
        data: {
          userId: user.id,
          amount: 500,
          timestamp: today,
        },
      });

      // Create one intake for yesterday
      await prisma.waterIntake.create({
        data: {
          userId: user.id,
          amount: 500,
          timestamp: new Date(today.getTime() - 24 * 60 * 60 * 1000),
        },
      });

      const intakes = await service.findToday(user.id);
      expect(intakes).toHaveLength(1);
      expect(intakes[0].timestamp.getDate()).toBe(today.getDate());
    });
  });

  describe('quickAccess', () => {
    it('should create intake with quick access token', async () => {
      const quickAccessToken = 'test-token';
      const user = await testUtils.createTestUser({ quickAccessToken });

      const intake = await service.quickAccess(quickAccessToken);
      expect(intake).toBeDefined();
      expect(intake.amount).toBe(500);
      expect(intake.id).toBeDefined();
    });

    it('should throw if invalid token', async () => {
      await expect(service.quickAccess('invalid-token'))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should throw if used within 5 minutes', async () => {
      const quickAccessToken = 'test-token';
      const user = await testUtils.createTestUser({ quickAccessToken });

      // Create a recent intake
      await prisma.waterIntake.create({
        data: {
          userId: user.id,
          amount: 500,
          timestamp: new Date(),
        },
      });

      await expect(service.quickAccess(quickAccessToken))
        .rejects
        .toThrow(UnauthorizedException);
    });
  });
}); 