import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WaterIntakeModule } from './water-intake/water-intake.module';
import { D1Module } from './d1';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    D1Module,
    AuthModule,
    UsersModule,
    WaterIntakeModule,
  ],
})
export class AppModule {}
