import { IsEmail, IsString, IsOptional, IsEnum, IsDateString, IsNumber, Min, Max, IsArray, IsBoolean, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BarberStatus, ExperienceLevel } from '../entities/barber.entity';

export class CreateBarberDto {
  @IsUUID()
  userId: string;

  @IsString()
  licenseNumber: string;

  @IsDateString()
  licenseExpiryDate: string;

  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  yearsOfExperience?: number;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  professionalSummary?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  portfolioPhotos?: string[];

  @IsOptional()
  @IsBoolean()
  acceptsWalkIns?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(60)
  bufferTimeMinutes?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  holidays?: string[];
}

export class UpdateBarberDto {
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsDateString()
  licenseExpiryDate?: string;

  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  yearsOfExperience?: number;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  professionalSummary?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  portfolioPhotos?: string[];

  @IsOptional()
  @IsEnum(BarberStatus)
  status?: BarberStatus;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptsWalkIns?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(60)
  bufferTimeMinutes?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  holidays?: string[];
}

export class BarberResponseDto {
  id: string;
  userId: string;
  licenseNumber: string;
  licenseExpiryDate: Date;
  experienceLevel: ExperienceLevel;
  yearsOfExperience: number;
  bio: string;
  professionalSummary: string;
  skills: string[];
  certifications: string[];
  portfolioPhotos: string[];
  averageRating: number;
  totalReviews: number;
  totalBookings: number;
  completedBookings: number;
  totalEarnings: number;
  status: BarberStatus;
  isVerified: boolean;
  isAvailable: boolean;
  acceptsWalkIns: boolean;
  bufferTimeMinutes: number;
  workingHours: Record<string, any>;
  holidays: string[];
  createdAt: Date;
  updatedAt: Date;
  specialties?: any[];
  services?: any[];
  location?: any;
}

export class BarberSummaryDto {
  id: string;
  userId: string;
  experienceLevel: ExperienceLevel;
  yearsOfExperience: number;
  averageRating: number;
  totalReviews: number;
  status: BarberStatus;
  isAvailable: boolean;
  acceptsWalkIns: boolean;
  location: {
    establishmentName: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
  };
  specialties: {
    id: string;
    name: string;
    category: string;
  }[];
  services: {
    id: string;
    name: string;
    basePrice: number;
    duration: number;
  }[];
}

export class BarberSearchDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @IsBoolean()
  acceptsWalkIns?: boolean;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  radius?: number; // Radio de búsqueda en km

  @IsOptional()
  @IsString()
  sortBy?: 'rating' | 'experience' | 'distance' | 'price';

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