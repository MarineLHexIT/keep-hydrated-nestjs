export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  dailyGoal: number | null;
  quickAccessToken: string | null;
  lastQuickAccess: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SafeUser = Omit<User, 'password'>;

export interface UserWithoutDates {
  id: string;
  email: string;
  password: string;
  name: string;
  dailyGoal: number | null;
  quickAccessToken: string | null;
  lastQuickAccess: Date | null;
}
