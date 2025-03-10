import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse, SafeUser } from '../common/types/response.types';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  private readonly QUICK_ACCESS_TOKEN_LENGTH = 64; // 32 bytes = 64 hex characters

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private mapToSafeUser(user: User): SafeUser {
    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  private generateToken(user: User): string {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload);
  }

  private generateQuickAccessToken(): string {
    const token = randomBytes(32).toString('hex');
    if (!this.isValidQuickAccessToken(token)) {
      throw new Error('Failed to generate valid quick access token');
    }
    return token;
  }

  private isValidQuickAccessToken(token: string | null): boolean {
    if (!token) return false;
    return (
      token.length === this.QUICK_ACCESS_TOKEN_LENGTH &&
      /^[a-f0-9]+$/.test(token)
    );
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<SafeUser | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
      return this.mapToSafeUser(user);
    }
    return null;
  }

  async getUserById(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapToSafeUser(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      access_token: this.generateToken(user as User),
      user,
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        name: registerDto.name,
        quickAccessToken: this.generateQuickAccessToken(),
      },
    });

    return {
      access_token: this.generateToken(user),
      user: this.mapToSafeUser(user),
    };
  }

  async generateQuickAccess(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        quickAccessToken: this.generateQuickAccessToken(),
        lastQuickAccess: null,
      },
    });
    return this.mapToSafeUser(user);
  }

  async revokeQuickAccess(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        quickAccessToken: null,
        lastQuickAccess: null,
      },
    });
    return this.mapToSafeUser(user);
  }

  logout(): Promise<{ message: string }> {
    // In a JWT-based authentication, we don't need to do anything server-side
    // The client should remove the token from their storage
    return Promise.resolve({ message: 'Logged out successfully' });
  }
}
