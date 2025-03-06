import { Module } from '@nestjs/common';
import { WaterIntakeService } from './water-intake.service';
import { WaterIntakeController } from './water-intake.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [WaterIntakeController],
  providers: [WaterIntakeService, PrismaService],
})
export class WaterIntakeModule {}
