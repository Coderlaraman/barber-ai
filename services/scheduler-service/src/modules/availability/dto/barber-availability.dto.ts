import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsDateString, IsOptional, Min, Max, IsUUID } from 'class-validator';

export class CreateBarberAvailabilityDto {
  @ApiProperty({ description: 'ID del barbero', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID('4', { message: 'El ID del barbero debe ser un UUID válido' })
  barberId!: string;

  @ApiProperty({ description: 'Día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)', example: 1, minimum: 0, maximum: 6 })
  @IsInt({ message: 'El día de la semana debe ser un número entero' })
  @Min(0, { message: 'El día de la semana debe ser entre 0 y 6' })
  @Max(6, { message: 'El día de la semana debe ser entre 0 y 6' })
  dayOfWeek!: number;

  @ApiProperty({ description: 'Hora de inicio', example: '09:00:00' })
  @IsString({ message: 'La hora de inicio debe ser una cadena de texto' })
  startTime!: string;

  @ApiProperty({ description: 'Hora de fin', example: '18:00:00' })
  @IsString({ message: 'La hora de fin debe ser una cadena de texto' })
  endTime!: string;

  @ApiPropertyOptional({ description: 'Fecha de inicio de validez', example: '2024-01-01' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe estar en formato ISO 8601' })
  validFrom?: Date;

  @ApiPropertyOptional({ description: 'Fecha de fin de validez', example: '2024-12-31' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe estar en formato ISO 8601' })
  validUntil?: Date;
}

export class UpdateBarberAvailabilityDto {
  @ApiPropertyOptional({ description: 'ID del barbero', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del barbero debe ser un UUID válido' })
  barberId?: string;

  @ApiPropertyOptional({ description: 'Día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)', example: 1, minimum: 0, maximum: 6 })
  @IsOptional()
  @IsInt({ message: 'El día de la semana debe ser un número entero' })
  @Min(0, { message: 'El día de la semana debe ser entre 0 y 6' })
  @Max(6, { message: 'El día de la semana debe ser entre 0 y 6' })
  dayOfWeek?: number;

  @ApiPropertyOptional({ description: 'Hora de inicio', example: '09:00:00' })
  @IsOptional()
  @IsString({ message: 'La hora de inicio debe ser una cadena de texto' })
  startTime?: string;

  @ApiPropertyOptional({ description: 'Hora de fin', example: '18:00:00' })
  @IsOptional()
  @IsString({ message: 'La hora de fin debe ser una cadena de texto' })
  endTime?: string;

  @ApiPropertyOptional({ description: 'Fecha de inicio de validez', example: '2024-01-01' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe estar en formato ISO 8601' })
  validFrom?: Date;

  @ApiPropertyOptional({ description: 'Fecha de fin de validez', example: '2024-12-31' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe estar en formato ISO 8601' })
  validUntil?: Date;
}