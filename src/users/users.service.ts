import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SafeUser } from '../common/types/response.types';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private mapToSafeUser(user: User): SafeUser {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async getProfile(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapToSafeUser(user);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<SafeUser> {
    const { email, password, ...otherUpdates } = updateProfileDto;

    // If email is being updated, check for uniqueness
    if (email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email already exists');
      }
    }

    // Prepare the update data
    const updateData: any = { ...otherUpdates };
    
    // Add email to update if provided
    if (email) {
      updateData.email = email;
    }

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update the user
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return this.mapToSafeUser(user);
  }
}
