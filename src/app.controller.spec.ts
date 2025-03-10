import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('AppController', () => {
  let appController: AppController;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ '1': 1 }]),
          },
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    appController = app.get<AppController>(AppController);
    prismaService = app.get<PrismaService>(PrismaService);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('ping', () => {
    it('should return status ok and system information', async () => {
      const result = await appController.ping();

      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).not.toBeNaN();
      expect(result.version).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.database.status).toBe('ok');
      expect(result.database.latency).toBeGreaterThanOrEqual(0);
      expect(result.memory.total).toBeGreaterThan(0);
      expect(result.memory.free).toBeGreaterThanOrEqual(0);
      expect(result.memory.used).toBeGreaterThanOrEqual(0);
      expect(result.memory.total).toBeGreaterThanOrEqual(result.memory.used);
    });

    it('should handle database errors', async () => {
      jest
        .spyOn(prismaService, '$queryRaw')
        .mockRejectedValueOnce(new Error('DB Error'));

      const result = await appController.ping();

      expect(result.status).toBe('ok');
      expect(result.database.status).toBe('error');
      expect(result.database.latency).toBe(-1);
    });
  });
});
