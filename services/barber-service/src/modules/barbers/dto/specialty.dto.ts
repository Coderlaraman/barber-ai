import { IsString, IsOptional, IsEnum, IsArray, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { SpecialtyCategory, SpecialtyLevel } from '../entities/specialty.entity';

export class CreateSpecialtyDto {
  @IsString()
  name: string;

  @IsEnum(SpecialtyCategory)
  category: SpecialtyCategory;

  @IsOptional()
  @IsEnum(SpecialtyLevel)
  level?: SpecialtyLevel;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  minExperienceYears?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredCertifications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toolsRequired?: string[];

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(300)
  averageDuration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  complexity?: number;

  @IsOptional()
  @IsBoolean()
  requiresCertification?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateSpecialtyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(SpecialtyCategory)
  category?: SpecialtyCategory;

  @IsOptional()
  @IsEnum(SpecialtyLevel)
  level?: SpecialtyLevel;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  minExperienceYears?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredCertifications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toolsRequired?: string[];

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(300)
  averageDuration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  complexity?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresCertification?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class SpecialtyResponseDto {
  id: string;
  name: string;
  category: SpecialtyCategory;
  level: SpecialtyLevel;
  description: string;
  requirements: string;
  minExperienceYears: number;
  requiredCertifications: string[];
  toolsRequired: string[];
  averageDuration: number;
  basePrice: number;
  complexity: number;
  isActive: boolean;
  requiresCertification: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  barberId: string;
}

export class SpecialtySummaryDto {
  id: string;
  name: string;
  category: SpecialtyCategory;
  level: SpecialtyLevel;
  description: string;
  basePrice: number;
  averageDuration: number;
  complexity: number;
  isActive: boolean;
  tags: string[];
}