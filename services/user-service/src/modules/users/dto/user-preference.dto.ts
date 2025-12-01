import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { PreferenceType } from '../entities/user-preference.entity';

export class CreateUserPreferenceDto {
  @IsUUID()
  userId: string;

  @IsEnum(PreferenceType)
  preferenceType: PreferenceType;

  @IsString()
  preferenceValue: string;
}

export class UpdateUserPreferenceDto {
  @IsOptional()
  @IsString()
  preferenceValue?: string;
}

export class UserPreferenceResponseDto {
  id: string;
  userId: string;
  preferenceType: PreferenceType;
  preferenceValue: string;
  createdAt: Date;
  updatedAt: Date;
}