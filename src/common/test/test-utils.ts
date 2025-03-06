import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { WaterIntake, User } from '@prisma/client';

export class TestUtils {
  constructor(private prisma: PrismaService) {}

  async cleanDb() {
    await this.prisma.waterIntake.deleteMany();
    await this.prisma.user.deleteMany();
  }

  async createTestUser(override: Partial<User> = {}): Promise<User> {
    const hashedPassword = await bcrypt.hash('password123', 10);
    return this.prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        ...override,
      },
    });
  }

  async createTestWaterIntakes(userId: string, count: number = 5): Promise<WaterIntake[]> {
    const intakes: WaterIntake[] = [];
    for (let i = 0; i < count; i++) {
      const intake = await this.prisma.waterIntake.create({
        data: {
          userId,
          amount: 500,
          timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Each intake 1 day apart
        },
      });
      intakes.push(intake);
    }
    return intakes;
  }
} 