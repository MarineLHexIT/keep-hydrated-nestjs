import { IsOptional, IsString, MinLength, MaxLength, Matches, IsInt, Min, Max, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Name cannot exceed 50 characters' })
  @Matches(
    /^[a-zA-Z\s-']+$/,
    { message: 'Name can only contain letters, spaces, hyphens, and apostrophes' }
  )
  name?: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value.toLowerCase())
  @MaxLength(255)
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(72, { message: 'Password cannot exceed 72 characters' }) // bcrypt max length
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W_]{8,}$/,
    { message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' }
  )
  password?: string;

  @IsInt()
  @IsOptional()
  @Min(500, { message: 'Daily goal must be at least 500ml' })
  @Max(5000, { message: 'Daily goal cannot exceed 5000ml' })
  dailyGoal?: number;
} 