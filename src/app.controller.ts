import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import * as os from 'os';

const APP_VERSION = '0.0.1'; // We'll get this from package.json once JSON module resolution is enabled

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('ping')
  @UseGuards(ThrottlerGuard)
  async ping(): Promise<{
    status: string;
    timestamp: string;
    version: string;
    uptime: number;
    database: {
      status: string;
      latency: number;
    };
    memory: {
      total: number;
      free: number;
      used: number;
    };
  }> {
    // Check database connection
    const dbStart = Date.now();
    let dbStatus = 'ok';
    let dbLatency = 0;

    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;
    } catch (_error) {
      dbStatus = 'error';
      dbLatency = -1;
    }

    // Get memory information
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: APP_VERSION,
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        latency: dbLatency,
      },
      memory: {
        total: Math.round(totalMemory / 1024 / 1024),
        free: Math.round(freeMemory / 1024 / 1024),
        used: Math.round(usedMemory / 1024 / 1024),
      },
    };
  }
}
