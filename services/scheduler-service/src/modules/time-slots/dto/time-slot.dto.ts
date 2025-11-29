import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  MinDate,
  IsInt,
  MaxLength,
  IsBoolean,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TimeSlotStatus, BlockReason } from '../entities/time-slot.entity';

export class CreateTimeSlotDto {
  @ApiProperty({ description: 'ID del barbero', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID('4', { message: 'El ID del barbero debe ser un UUID válido' })
  barberId!: string;

  @ApiProperty({ description: 'ID de la disponibilidad', example: '123e4567-e89b-12d3-a456-426614174004' })
  @IsUUID('4', { message: 'El ID de la disponibilidad debe ser un UUID válido' })
  availabilityId!: string;

  @ApiProperty({ description: 'Fecha del slot', example: '2024-12-01' })
  @IsDateString({}, { message: 'La fecha debe estar en formato ISO 8601' })
  @MinDate(new Date(), { message: 'La fecha del slot no puede ser anterior a la fecha actual' })
  date!: Date;

  @ApiProperty({ description: 'Hora de inicio', example: '10:00:00' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'La hora de inicio debe estar en formato HH:MM:SS de 24 horas'
  })
  startTime!: string;

  @ApiProperty({ description: 'Hora de fin', example: '10:30:00' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'La hora de fin debe estar en formato HH:MM:SS de 24 horas'
  })
  endTime!: string;

  @ApiProperty({ description: 'Duración en minutos', example: 30, minimum: 1, maximum: 480 })
  @IsInt({ message: 'La duración debe ser un número entero' })
  @Min(1, { message: 'La duración mínima es 1 minuto' })
  @Max(480, { message: 'La duración máxima es 480 minutos (8 horas)' })
  durationMinutes!: number;

  @ApiPropertyOptional({ description: 'ID del servicio', example: '123e4567-e89b-12d3-a456-426614174003' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del servicio debe ser un UUID válido' })
  serviceId?: string;

  @ApiPropertyOptional({ description: 'Nombre del servicio', example: 'Corte de cabello', required: false })
  @IsOptional()
  @IsString({ message: 'El nombre del servicio debe ser texto' })
  @MaxLength(100, { message: 'El nombre del servicio no puede exceder 100 caracteres' })
  serviceName?: string;

  @ApiPropertyOptional({ description: 'Precio del servicio', example: 25.00, minimum: 0, maximum: 1000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio debe ser un número válido con máximo 2 decimales' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  @Max(1000, { message: 'El precio máximo es 1000' })
  servicePrice?: number;

  @ApiPropertyOptional({ description: 'Duración del servicio en minutos', example: 30, minimum: 1, maximum: 480 })
  @IsOptional()
  @IsInt({ message: 'La duración del servicio debe ser un número entero' })
  @Min(1, { message: 'La duración mínima es 1 minuto' })
  @Max(480, { message: 'La duración máxima es 480 minutos' })
  serviceDuration?: number;

  @ApiPropertyOptional({ description: 'Indica si es un slot de descanso', example: false })
  @IsOptional()
  @IsBoolean({ message: 'El valor de descanso debe ser booleano' })
  isBreak?: boolean = false;

  @ApiPropertyOptional({ description: 'Prioridad del slot', example: 0, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt({ message: 'La prioridad debe ser un número entero' })
  @Min(0, { message: 'La prioridad mínima es 0' })
  @Max(100, { message: 'La prioridad máxima es 100' })
  priority?: number = 0;
}

export class UpdateTimeSlotDto {
  @ApiPropertyOptional({ description: 'Hora de inicio', example: '10:00:00' })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'La hora de inicio debe estar en formato HH:MM:SS de 24 horas'
  })
  startTime?: string;

  @ApiPropertyOptional({ description: 'Hora de fin', example: '10:30:00' })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'La hora de fin debe estar en formato HH:MM:SS de 24 horas'
  })
  endTime?: string;

  @ApiPropertyOptional({ description: 'Duración en minutos', example: 30, minimum: 1, maximum: 480 })
  @IsOptional()
  @IsInt({ message: 'La duración debe ser un número entero' })
  @Min(1, { message: 'La duración mínima es 1 minuto' })
  @Max(480, { message: 'La duración máxima es 480 minutos' })
  durationMinutes?: number;

  @ApiPropertyOptional({ description: 'ID del servicio', example: '123e4567-e89b-12d3-a456-426614174003' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del servicio debe ser un UUID válido' })
  serviceId?: string;

  @ApiPropertyOptional({ description: 'Nombre del servicio', example: 'Corte de cabello', required: false })
  @IsOptional()
  @IsString({ message: 'El nombre del servicio debe ser texto' })
  @MaxLength(100, { message: 'El nombre del servicio no puede exceder 100 caracteres' })
  serviceName?: string;

  @ApiPropertyOptional({ description: 'Precio del servicio', example: 25.00, minimum: 0, maximum: 1000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio debe ser un número válido con máximo 2 decimales' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  @Max(1000, { message: 'El precio máximo es 1000' })
  servicePrice?: number;

  @ApiPropertyOptional({ description: 'Duración del servicio en minutos', example: 30, minimum: 1, maximum: 480 })
  @IsOptional()
  @IsInt({ message: 'La duración del servicio debe ser un número entero' })
  @Min(1, { message: 'La duración mínima es 1 minuto' })
  @Max(480, { message: 'La duración máxima es 480 minutos' })
  serviceDuration?: number;

  @ApiPropertyOptional({ description: 'Indica si es un slot de descanso', example: false })
  @IsOptional()
  @IsBoolean({ message: 'El valor de descanso debe ser booleano' })
  isBreak?: boolean;

  @ApiPropertyOptional({ description: 'Prioridad del slot', example: 0, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt({ message: 'La prioridad debe ser un número entero' })
  @Min(0, { message: 'La prioridad mínima es 0' })
  @Max(100, { message: 'La prioridad máxima es 100' })
  priority?: number;
}

export class BlockTimeSlotDto {
  @ApiProperty({ description: 'Razón del bloqueo', enum: BlockReason })
  @IsEnum(BlockReason, { message: 'La razón del bloqueo debe ser uno de los valores permitidos' })
  reason!: BlockReason;

  @ApiPropertyOptional({ description: 'Descripción del bloqueo', example: 'Barbero enfermo', required: false })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  description?: string;

  @ApiPropertyOptional({ description: 'Indica si el bloqueo puede ser sobrescrito por administradores', example: false })
  @IsOptional()
  @IsBoolean({ message: 'El valor de sobrescritura debe ser booleano' })
  canOverride?: boolean = false;
}

export class TimeSlotQueryDto {
  @ApiPropertyOptional({ description: 'ID del barbero', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del barbero debe ser un UUID válido' })
  barberId?: string;

  @ApiPropertyOptional({ description: 'ID de la disponibilidad', example: '123e4567-e89b-12d3-a456-426614174004' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID de la disponibilidad debe ser un UUID válido' })
  availabilityId?: string;

  @ApiPropertyOptional({ description: 'Fecha específica', example: '2024-12-01' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe estar en formato ISO 8601' })
  date?: Date;

  @ApiPropertyOptional({ description: 'Fecha de inicio para filtrar', example: '2024-12-01' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe estar en formato ISO 8601' })
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Fecha de fin para filtrar', example: '2024-12-31' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe estar en formato ISO 8601' })
  endDate?: Date;

  @ApiPropertyOptional({ 
    description: 'Estado del slot',
    enum: TimeSlotStatus,
    example: TimeSlotStatus.AVAILABLE
  })
  @IsOptional()
  @IsEnum(TimeSlotStatus, { message: 'El estado debe ser uno de los valores permitidos' })
  status?: TimeSlotStatus;

  @ApiPropertyOptional({ description: 'ID de la cita', example: '123e4567-e89b-12d3-a456-426614174005' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID de la cita debe ser un UUID válido' })
  appointmentId?: string;

  @ApiPropertyOptional({ description: 'ID del cliente', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del cliente debe ser un UUID válido' })
  clientId?: string;

  @ApiPropertyOptional({ description: 'Incluir slots eliminados', example: false })
  @IsOptional()
  @Type(() => Boolean)
  includeDeleted?: boolean = false;

  @ApiPropertyOptional({ description: 'Incluir solo slots disponibles', example: true })
  @IsOptional()
  @Type(() => Boolean)
  availableOnly?: boolean = false;

  @ApiPropertyOptional({ description: 'Incluir solo slots de descanso', example: false })
  @IsOptional()
  @Type(() => Boolean)
  breaksOnly?: boolean = false;

  @ApiPropertyOptional({ description: 'Incluir solo slots bloqueados', example: false })
  @IsOptional()
  @Type(() => Boolean)
  blockedOnly?: boolean = false;

  @ApiPropertyOptional({ description: 'Incluir solo slots reservados', example: false })
  @IsOptional()
  @Type(() => Boolean)
  bookedOnly?: boolean = false;

  @ApiPropertyOptional({ description: 'Incluir slots futuros', example: true })
  @IsOptional()
  @Type(() => Boolean)
  futureOnly?: boolean = true;

  @ApiPropertyOptional({ description: 'Incluir slots pasados', example: false })
  @IsOptional()
  @Type(() => Boolean)
  pastOnly?: boolean = false;

  @ApiPropertyOptional({ description: 'Número de página', example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El número de página debe ser un número entero' })
  @Min(1, { message: 'El número de página debe ser mayor o igual a 1' })
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Elementos por página', example: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(100, { message: 'El límite máximo es 100' })
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Campo de ordenamiento', example: 'startTime' })
  @IsOptional()
  @IsString({ message: 'El campo de ordenamiento debe ser texto' })
  sortBy?: string = 'startTime';

  @ApiPropertyOptional({ description: 'Dirección del ordenamiento', example: 'ASC' })
  @IsOptional()
  @IsString({ message: 'La dirección del ordenamiento debe ser texto' })
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}

export class BulkCreateTimeSlotsDto {
  @ApiProperty({ description: 'ID del barbero', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID('4', { message: 'El ID del barbero debe ser un UUID válido' })
  barberId!: string;

  @ApiProperty({ description: 'ID de la disponibilidad', example: '123e4567-e89b-12d3-a456-426614174004' })
  @IsUUID('4', { message: 'El ID de la disponibilidad debe ser un UUID válido' })
  availabilityId!: string;

  @ApiProperty({ description: 'Fecha de inicio para crear slots', example: '2024-12-01' })
  @IsDateString({}, { message: 'La fecha de inicio debe estar en formato ISO 8601' })
  @MinDate(new Date(), { message: 'La fecha de inicio no puede ser anterior a la fecha actual' })
  startDate!: Date;

  @ApiProperty({ description: 'Fecha de fin para crear slots', example: '2024-12-31' })
  @IsDateString({}, { message: 'La fecha de fin debe estar en formato ISO 8601' })
  @MinDate(new Date(), { message: 'La fecha de fin no puede ser anterior a la fecha actual' })
  endDate!: Date;

  @ApiProperty({ description: 'Duración de cada slot en minutos', example: 30, minimum: 15, maximum: 240 })
  @IsInt({ message: 'La duración debe ser un número entero' })
  @Min(15, { message: 'La duración mínima es 15 minutos' })
  @Max(240, { message: 'La duración máxima es 240 minutos' })
  slotDuration!: number;

  @ApiPropertyOptional({ description: 'Tiempo de buffer entre slots en minutos', example: 5, minimum: 0, maximum: 60 })
  @IsOptional()
  @IsInt({ message: 'El tiempo de buffer debe ser un número entero' })
  @Min(0, { message: 'El tiempo de buffer mínimo es 0 minutos' })
  @Max(60, { message: 'El tiempo de buffer máximo es 60 minutos' })
  bufferTime?: number = 0;

  @ApiPropertyOptional({ description: 'Excluir fines de semana', example: false })
  @IsOptional()
  @IsBoolean({ message: 'El valor de exclusión de fines de semana debe ser booleano' })
  excludeWeekends?: boolean = false;

  @ApiPropertyOptional({ description: 'Excluir días festivos', example: true })
  @IsOptional()
  @IsBoolean({ message: 'El valor de exclusión de festivos debe ser booleano' })
  excludeHolidays?: boolean = true;
}

export class TimeSlotResponseDto {
  @ApiProperty({ description: 'ID del time slot' })
  id!: string;

  @ApiProperty({ description: 'ID del barbero' })
  barberId!: string;

  @ApiProperty({ description: 'ID de la disponibilidad' })
  availabilityId!: string;

  @ApiProperty({ description: 'Fecha del slot' })
  date!: Date;

  @ApiProperty({ description: 'Hora de inicio' })
  startTime!: string;

  @ApiProperty({ description: 'Hora de fin' })
  endTime!: string;

  @ApiProperty({ description: 'Duración en minutos' })
  durationMinutes!: number;

  @ApiProperty({ description: 'Estado del slot' })
  status!: TimeSlotStatus;

  @ApiProperty({ description: 'ID de la cita (si aplica)' })
  appointmentId?: string;

  @ApiProperty({ description: 'ID del cliente (si aplica)' })
  clientId?: string;

  @ApiProperty({ description: 'Razón del bloqueo (si aplica)' })
  blockReason?: BlockReason;

  @ApiProperty({ description: 'Descripción del bloqueo' })
  blockDescription?: string;

  @ApiProperty({ description: 'Precio del servicio (si aplica)' })
  servicePrice?: number;

  @ApiProperty({ description: 'ID del servicio (si aplica)' })
  serviceId?: string;

  @ApiProperty({ description: 'Nombre del servicio (si aplica)' })
  serviceName?: string;

  @ApiProperty({ description: 'Duración del servicio (si aplica)' })
  serviceDuration?: number;

  @ApiProperty({ description: 'Indica si es un slot de descanso' })
  isBreak!: boolean;

  @ApiProperty({ description: 'Indica si puede ser sobrescrito' })
  canOverride!: boolean;

  @ApiProperty({ description: 'Prioridad del slot' })
  priority!: number;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt!: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt!: Date;

  @ApiProperty({ description: 'Fecha de eliminación' })
  deletedAt?: Date;
}