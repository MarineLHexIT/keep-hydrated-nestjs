export interface WaterIntake {
  id: string;
  userId: string;
  amount: number;
  createdAt: Date;
}

export interface WaterIntakeResponse {
  id: string;
  amount: number;
  createdAt: Date;
}
