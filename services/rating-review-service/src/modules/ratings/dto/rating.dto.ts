import { IsInt, IsString, IsOptional, IsEnum, IsUUID, Min, Max, Length, IsArray, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RatingType, RatingStatus } from '../entities/rating.entity';

export class CreateRatingDto {
  @ApiProperty({ description: 'ID de la cita', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  appointmentId: string;

  @ApiProperty({ description: 'ID del barbero', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  barberId: string;

  @ApiProperty({ description: 'ID del cliente', example: '123e4567-e89b-12d3-a456-426614174002' })
  @IsUUID()
  clientId: string;

  @ApiProperty({ description: 'ID del servicio', example: '123e4567-e89b-12d3-a456-426614174003' })
  @IsUUID()
  serviceId: string;

  @ApiProperty({ description: 'Tipo de calificación', enum: RatingType, default: RatingType.APPOINTMENT })
  @IsEnum(RatingType)
  @IsOptional()
  type?: RatingType;

  @ApiProperty({ description: 'Calificación (1-5)', example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Comentario de la reseña', example: 'Excelente servicio, muy profesional', minLength: 10, maxLength: 1000 })
  @IsString()
  @Length(10, 1000)
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({ description: 'Calificación por aspectos' })
  @IsOptional()
  aspects?: {
    punctuality?: number;
    quality?: number;
    cleanliness?: number;
    communication?: number;
    value?: number;
  };

  @ApiPropertyOptional({ description: 'Fotos de la experiencia', type: [String] })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  photos?: string[];

  @ApiPropertyOptional({ description: 'Fecha de la cita', example: '2024-01-15T10:00:00Z' })
  @IsOptional()
  appointmentDate?: Date;
}

export class UpdateRatingDto {
  @ApiPropertyOptional({ description: 'Calificación (1-5)', example: 4, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({ description: 'Comentario de la reseña', example: 'Muy buen servicio', minLength: 10, maxLength: 1000 })
  @IsString()
  @Length(10, 1000)
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({ description: 'Calificación por aspectos' })
  @IsOptional()
  aspects?: {
    punctuality?: number;
    quality?: number;
    cleanliness?: number;
    communication?: number;
    value?: number;
  };

  @ApiPropertyOptional({ description: 'Fotos de la experiencia', type: [String] })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  photos?: string[];
}

export class ModerateRatingDto {
  @ApiProperty({ description: 'Estado de moderación', enum: RatingStatus })
  @IsEnum(RatingStatus)
  status: RatingStatus;

  @ApiPropertyOptional({ description: 'Razón de rechazo', example: 'Contenido inapropiado' })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class RatingResponseDto {
  @ApiProperty({ description: 'ID de la calificación' })
  id: string;

  @ApiProperty({ description: 'ID de la cita' })
  appointmentId: string;

  @ApiProperty({ description: 'ID del barbero' })
  barberId: string;

  @ApiProperty({ description: 'ID del cliente' })
  clientId: string;

  @ApiProperty({ description: 'ID del servicio' })
  serviceId: string;

  @ApiProperty({ description: 'Tipo de calificación', enum: RatingType })
  type: RatingType;

  @ApiProperty({ description: 'Calificación (1-5)' })
  rating: number;

  @ApiPropertyOptional({ description: 'Comentario de la reseña' })
  comment?: string;

  @ApiPropertyOptional({ description: 'Calificación por aspectos' })
  aspects?: {
    punctuality?: number;
    quality?: number;
    cleanliness?: number;
    communication?: number;
    value?: number;
  };

  @ApiPropertyOptional({ description: 'Fotos de la experiencia', type: [String] })
  photos?: string[];

  @ApiProperty({ description: '¿Está verificada?' })
  isVerified: boolean;

  @ApiProperty({ description: '¿Está destacada?' })
  isFeatured: boolean;

  @ApiProperty({ description: 'Cantidad de votos útiles' })
  helpfulCount: number;

  @ApiProperty({ description: 'Cantidad de reportes' })
  reportCount: number;

  @ApiProperty({ description: 'Estado de moderación', enum: RatingStatus })
  status: RatingStatus;

  @ApiPropertyOptional({ description: 'Razón de rechazo' })
  rejectionReason?: string;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Fecha de la cita' })
  appointmentDate?: Date;
}

export class BarberRatingStatsDto {
  @ApiProperty({ description: 'ID del barbero' })
  barberId: string;

  @ApiProperty({ description: 'Calificación promedio' })
  averageRating: number;

  @ApiProperty({ description: 'Total de calificaciones' })
  totalRatings: number;

  @ApiProperty({ description: 'Distribución de calificaciones' })
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };

  @ApiProperty({ description: 'Calificación promedio por aspectos' })
  averageAspects: {
    punctuality?: number;
    quality?: number;
    cleanliness?: number;
    communication?: number;
    value?: number;
  };
}

export class ClientRatingHistoryDto {
  @ApiProperty({ description: 'ID del cliente' })
  clientId: string;

  @ApiProperty({ description: 'Total de calificaciones dadas' })
  totalGiven: number;

  @ApiProperty({ description: 'Calificación promedio dada' })
  averageGiven: number;

  @ApiProperty({ description: 'Últimas calificaciones', type: [RatingResponseDto] })
  recentRatings: RatingResponseDto[];
}