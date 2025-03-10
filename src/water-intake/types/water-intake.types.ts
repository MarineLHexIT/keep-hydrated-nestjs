export interface WaterIntake extends Record<string, unknown> {
  id: string;
  userId: string;
  amount: number;
  createdAt: Date;
}

export interface WaterIntakeResponse extends Record<string, unknown> {
  id: string;
  amount: number;
  createdAt: Date;
}
