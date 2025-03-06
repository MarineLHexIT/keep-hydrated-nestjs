import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWaterIntakeDto } from './dto/create-water-intake.dto';
import { endOfDay, startOfDay, parseISO } from 'date-fns';
import { WaterIntakeResponse } from '../common/types/response.types';
import { WaterIntake } from '@prisma/client';

@Injectable()
export class WaterIntakeService {
  constructor(private prisma: PrismaService) {}

  private mapToResponse(intake: WaterIntake): WaterIntakeResponse {
    const { userId, ...response } = intake;
    return response;
  }

  async create(userId: string, createWaterIntakeDto: CreateWaterIntakeDto): Promise<WaterIntakeResponse> {
    const intake = await this.prisma.waterIntake.create({
      data: {
        userId,
        amount: createWaterIntakeDto.amount || 500,
      },
    });
    return this.mapToResponse(intake);
  }

  async findAll(userId: string): Promise<WaterIntakeResponse[]> {
    const intakes = await this.prisma.waterIntake.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });
    return intakes.map(this.mapToResponse);
  }

  async findToday(userId: string): Promise<WaterIntakeResponse[]> {
    const today = new Date();
    const intakes = await this.prisma.waterIntake.findMany({
      where: {
        userId,
        timestamp: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
      orderBy: { timestamp: 'desc' },
    });
    return intakes.map(this.mapToResponse);
  }

  async findByDate(userId: string, date: string): Promise<WaterIntakeResponse[]> {
    const parsedDate = parseISO(date);
    const intakes = await this.prisma.waterIntake.findMany({
      where: {
        userId,
        timestamp: {
          gte: startOfDay(parsedDate),
          lte: endOfDay(parsedDate),
        },
      },
      orderBy: { timestamp: 'desc' },
    });
    return intakes.map(this.mapToResponse);
  }

  async quickAccess(quickAccessToken: string): Promise<WaterIntakeResponse> {
    const user = await this.prisma.user.findUnique({
      where: { quickAccessToken },
      include: { waterIntakes: {
        where: {
          timestamp: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
          },
        },
      }},
    });

    if (!user) {
      throw new UnauthorizedException('Invalid quick access token');
    }

    if (user.waterIntakes.length > 0) {
      throw new UnauthorizedException('Please wait 5 minutes between quick access intakes');
    }

    // Update last quick access time
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastQuickAccess: new Date() },
    });

    return this.create(user.id, { amount: 500 });
  }
}
