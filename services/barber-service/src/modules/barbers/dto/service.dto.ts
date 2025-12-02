import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, IsArray, IsBoolean, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceStatus, ServiceGender, ServiceDurationUnit } from '../entities/service.entity';

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  detailedDescription?: string;

  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @IsOptional()
  @IsEnum(ServiceGender)
  gender?: ServiceGender;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  promotionalPrice?: number;

  @IsNumber()
  @Min(1)
  @Max(480)
  duration: number; // En minutos o horas según durationUnit

  @IsOptional()
  @IsEnum(ServiceDurationUnit)
  durationUnit?: ServiceDurationUnit;

  @IsOptional()
  @IsNumber()
  @Min(1)
  minDuration?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxDuration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60)
  bufferTime?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includedServices?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalServices?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contraindications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  requiresConsultation?: boolean;

  @IsOptional()
  @IsBoolean()
  isPackage?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxClients?: number;

  @IsOptional()
  @IsDateString()
  availableFrom?: string;

  @IsOptional()
  @IsDateString()
  availableUntil?: string;

  @IsOptional()
  @IsString()
  specialtyId: string;
}

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  detailedDescription?: string;

  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @IsOptional()
  @IsEnum(ServiceGender)
  gender?: ServiceGender;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  promotionalPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(480)
  duration?: number;

  @IsOptional()
  @IsEnum(ServiceDurationUnit)
  durationUnit?: ServiceDurationUnit;

  @IsOptional()
  @IsNumber()
  @Min(1)
  minDuration?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxDuration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60)
  bufferTime?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includedServices?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalServices?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contraindications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  requiresConsultation?: boolean;

  @IsOptional()
  @IsBoolean()
  isPackage?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxClients?: number;

  @IsOptional()
  @IsDateString()
  availableFrom?: string;

  @IsOptional()
  @IsDateString()
  availableUntil?: string;
}

export class ServiceResponseDto {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  detailedDescription: string;
  status: ServiceStatus;
  gender: ServiceGender;
  basePrice: number;
  promotionalPrice: number;
  duration: number;
  durationUnit: ServiceDurationUnit;
  minDuration: number;
  maxDuration: number;
  bufferTime: number;
  includedServices: string[];
  additionalServices: string[];
  requirements: string[];
  contraindications: string[];
  photos: string[];
  tags: string[];
  requiresConsultation: boolean;
  isPackage: boolean;
  maxClients: number;
  popularity: number;
  bookingCount: number;
  averageRating: number;
  reviewCount: number;
  availableFrom: Date;
  availableUntil: Date;
  createdAt: Date;
  updatedAt: Date;
  barberId: string;
  specialtyId: string;
  specialty: {
    id: string;
    name: string;
    category: string;
  };
}

export class ServiceSummaryDto {
  id: string;
  name: string;
  description: string;
  status: ServiceStatus;
  basePrice: number;
  promotionalPrice: number;
  duration: number;
  averageRating: number;
  reviewCount: number;
  photos: string[];
  tags: string[];
  specialty: {
    id: string;
    name: string;
  };
}

export class ServiceSearchDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  barberId?: string;

  @IsOptional()
  @IsString()
  specialtyId?: string;

  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @IsOptional()
  @IsEnum(ServiceGender)
  gender?: ServiceGender;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(480)
  maxDuration?: number;

  @IsOptional()
  @IsBoolean()
  isPackage?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresConsultation?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  sortBy?: 'price' | 'duration' | 'rating' | 'popularity';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}