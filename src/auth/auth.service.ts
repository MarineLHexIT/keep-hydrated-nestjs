import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { D1Service } from '../d1/d1.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse, SafeUser } from '../common/types/response.types';
import { User } from '../common/types/user.types';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  private readonly QUICK_ACCESS_TOKEN_LENGTH = 64; // 32 bytes = 64 hex characters

  constructor(
    private readonly d1Service: D1Service,
    private readonly jwtService: JwtService,
  ) {}

  private mapToSafeUser(user: User): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;
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
    const user = await this.d1Service.queryOne<User>(
      'SELECT * FROM users WHERE email = ?',
      [email],
    );

    if (user && (await bcrypt.compare(password, user.password))) {
      return this.mapToSafeUser(user);
    }
    return null;
  }

  async getUserById(userId: string): Promise<SafeUser> {
    const user = await this.d1Service.queryOne<User>(
      'SELECT * FROM users WHERE id = ?',
      [userId],
    );

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
    if (!registerDto.name) {
      throw new BadRequestException('Name is required');
    }

    const existingUser = await this.d1Service.queryOne<User>(
      'SELECT * FROM users WHERE email = ?',
      [registerDto.email],
    );

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const newUser: User = {
      id: randomBytes(16).toString('hex'),
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
      dailyGoal: null,
      quickAccessToken: this.generateQuickAccessToken(),
      lastQuickAccess: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.d1Service.execute(
      `INSERT INTO users (
        id, email, password, name, daily_goal, quick_access_token,
        last_quick_access, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newUser.id,
        newUser.email,
        newUser.password,
        newUser.name,
        newUser.dailyGoal,
        newUser.quickAccessToken,
        newUser.lastQuickAccess,
        newUser.createdAt.toISOString(),
        newUser.updatedAt.toISOString(),
      ],
    );

    const safeUser = this.mapToSafeUser(newUser);
    return {
      access_token: this.generateToken(newUser),
      user: safeUser,
    };
  }

  async generateQuickAccess(userId: string): Promise<SafeUser> {
    const user = await this.d1Service.queryOne<User>(
      'SELECT * FROM users WHERE id = ?',
      [userId],
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const quickAccessToken = this.generateQuickAccessToken();
    await this.d1Service.execute(
      'UPDATE users SET quick_access_token = ?, last_quick_access = NULL WHERE id = ?',
      [quickAccessToken, userId],
    );

    return this.mapToSafeUser({ ...user, quickAccessToken });
  }

  async revokeQuickAccess(userId: string): Promise<SafeUser> {
    const user = await this.d1Service.queryOne<User>(
      'SELECT * FROM users WHERE id = ?',
      [userId],
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.d1Service.execute(
      'UPDATE users SET quick_access_token = NULL, last_quick_access = NULL WHERE id = ?',
      [userId],
    );

    return this.mapToSafeUser({ ...user, quickAccessToken: null });
  }

  logout(): Promise<{ message: string }> {
    // In a JWT-based authentication, we don't need to do anything server-side
    // The client should remove the token from their storage
    return Promise.resolve({ message: 'Logged out successfully' });
  }
}
