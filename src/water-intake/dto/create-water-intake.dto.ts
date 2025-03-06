import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWaterIntakeDto {
  @IsInt({ message: 'Amount must be an integer' })
  @Min(0, { message: 'Amount cannot be negative' })
  @Max(5000, { message: 'Amount cannot exceed 5000ml' })
  @IsOptional()
  @Type(() => Number)
  amount?: number = 500; // Default to 500ml if not specified
} 