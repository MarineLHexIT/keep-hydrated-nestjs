import { WaterIntake, User } from '@prisma/client';

export type SafeUser = Omit<User, 'password'>;

export interface AuthResponse {
  access_token: string;
  user: SafeUser;
}

export interface WaterIntakeResponse extends Omit<WaterIntake, 'userId'> {
  id: string;
  amount: number;
  timestamp: Date;
}

export interface DailyIntakeStats {
  total: number;
  count: number;
  average: number;
  intakes: WaterIntakeResponse[];
} 