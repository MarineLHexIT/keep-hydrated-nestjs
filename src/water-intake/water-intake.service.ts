import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { D1Service } from '../d1/d1.service';
import { CreateWaterIntakeDto } from './dto/create-water-intake.dto';
import { WaterIntake } from './types/water-intake.types';
import { User } from '../common/types/user.types';
import { randomBytes } from 'crypto';
import { startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class WaterIntakeService {
  private readonly DEFAULT_AMOUNT = 250; // ml
  private readonly QUICK_ACCESS_COOLDOWN = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor(private readonly d1Service: D1Service) {}

  async create(
    userId: string,
    createWaterIntakeDto: CreateWaterIntakeDto,
  ): Promise<WaterIntake> {
    const waterIntake: WaterIntake = {
      id: randomBytes(16).toString('hex'),
      userId,
      amount: createWaterIntakeDto.amount || this.DEFAULT_AMOUNT,
      createdAt: new Date(),
    };

    await this.d1Service.execute(
      'INSERT INTO water_intakes (id, user_id, amount, created_at) VALUES (?, ?, ?, ?)',
      [
        waterIntake.id,
        waterIntake.userId,
        waterIntake.amount,
        waterIntake.createdAt.toISOString(),
      ],
    );

    return waterIntake;
  }

  async findAll(userId: string): Promise<WaterIntake[]> {
    return this.d1Service.query<WaterIntake>(
      'SELECT * FROM water_intakes WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
    );
  }

  async findToday(userId: string): Promise<WaterIntake[]> {
    const today = new Date();
    const start = startOfDay(today).toISOString();
    const end = endOfDay(today).toISOString();

    return this.d1Service.query<WaterIntake>(
      'SELECT * FROM water_intakes WHERE user_id = ? AND created_at BETWEEN ? AND ? ORDER BY created_at DESC',
      [userId, start, end],
    );
  }

  async quickAccess(token: string): Promise<WaterIntake> {
    // Find user by quick access token
    const user = await this.d1Service.queryOne<User>(
      'SELECT * FROM users WHERE quick_access_token = ?',
      [token],
    );

    if (!user) {
      throw new NotFoundException('Invalid quick access token');
    }

    // Check cooldown
    if (user.lastQuickAccess) {
      const lastAccess = new Date(user.lastQuickAccess);
      const timeSinceLastAccess = Date.now() - lastAccess.getTime();

      if (timeSinceLastAccess < this.QUICK_ACCESS_COOLDOWN) {
        throw new BadRequestException(
          'Please wait before adding another water intake',
        );
      }
    }

    // Create water intake
    const waterIntake = await this.create(user.id, {
      amount: this.DEFAULT_AMOUNT,
    });

    // Update last quick access time
    await this.d1Service.execute(
      'UPDATE users SET last_quick_access = ? WHERE id = ?',
      [new Date().toISOString(), user.id],
    );

    return waterIntake;
  }
}
