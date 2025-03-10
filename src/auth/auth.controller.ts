import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RequestWithUser } from '../common/types/request.types';
import { SafeUser } from '../common/types/response.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout() {
    return this.authService.logout();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async checkAuth(@Request() req: RequestWithUser): Promise<SafeUser> {
    return this.authService.getUserById(req.user.userId);
  }

  @Post('quick-access/generate')
  @UseGuards(JwtAuthGuard)
  generateQuickAccess(@Request() req: RequestWithUser): Promise<SafeUser> {
    return this.authService.generateQuickAccess(req.user.userId);
  }

  @Post('quick-access/revoke')
  @UseGuards(JwtAuthGuard)
  async revokeQuickAccess(@Request() req: RequestWithUser): Promise<SafeUser> {
    return this.authService.revokeQuickAccess(req.user.userId);
  }
}
