import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseD1Service } from '../d1/base.service';
import { D1Service } from '../d1/d1.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from '../common/types/user.types';

@Injectable()
export class UsersService extends BaseD1Service {
  protected tableName = 'users';
  protected primaryKey = 'id';

  constructor(d1Service: D1Service) {
    super(d1Service);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne<User>({ email });
  }

  async findById(id: string): Promise<User | null> {
    return this.findOne<User>({ id });
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.update<User>(userId, updateProfileDto);
    return { ...user, ...updateProfileDto };
  }
}
