import { Body, Controller, Get, Param, Post, UseGuards, Request } from '@nestjs/common';
import { WaterIntakeService } from './water-intake.service';
import { CreateWaterIntakeDto } from './dto/create-water-intake.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../common/types/request.types';
import { WaterIntakeResponse, DailyIntakeStats } from '../common/types/response.types';

@Controller('water-intake')
export class WaterIntakeController {
  constructor(private readonly waterIntakeService: WaterIntakeService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Request() req: RequestWithUser,
    @Body() createWaterIntakeDto: CreateWaterIntakeDto,
  ): Promise<WaterIntakeResponse> {
    return this.waterIntakeService.create(req.user.userId, createWaterIntakeDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Request() req: RequestWithUser): Promise<WaterIntakeResponse[]> {
    return this.waterIntakeService.findAll(req.user.userId);
  }

  @Get('today')
  @UseGuards(JwtAuthGuard)
  async findToday(@Request() req: RequestWithUser): Promise<DailyIntakeStats> {
    const intakes = await this.waterIntakeService.findToday(req.user.userId);
    return this.calculateDailyStats(intakes);
  }

  @Get(':date')
  @UseGuards(JwtAuthGuard)
  async findByDate(
    @Request() req: RequestWithUser,
    @Param('date') date: string,
  ): Promise<DailyIntakeStats> {
    const intakes = await this.waterIntakeService.findByDate(req.user.userId, date);
    return this.calculateDailyStats(intakes);
  }

  @Get('quick/:token')
  async quickAccess(@Param('token') token: string): Promise<WaterIntakeResponse> {
    return this.waterIntakeService.quickAccess(token);
  }

  private calculateDailyStats(intakes: WaterIntakeResponse[]): DailyIntakeStats {
    const total = intakes.reduce((sum, intake) => sum + intake.amount, 0);
    return {
      total,
      count: intakes.length,
      average: intakes.length > 0 ? total / intakes.length : 0,
      intakes,
    };
  }
}
