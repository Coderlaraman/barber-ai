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
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStatus } from '../entities/appointment.entity';
import { AppointmentStatus, AppointmentType } from '../enums/appointment.enum';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'ID del cliente', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID('4', { message: 'El ID del cliente debe ser un UUID válido' })
  clientId!: string;

  @ApiProperty({ description: 'ID del barbero', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID('4', { message: 'El ID del barbero debe ser un UUID válido' })
  barberId!: string;

  @ApiProperty({ description: 'ID de la sucursal', example: '123e4567-e89b-12d3-a456-426614174002' })
  @IsUUID('4', { message: 'El ID de la sucursal debe ser un UUID válido' })
  branchId!: string;

  @ApiProperty({ description: 'ID del servicio', example: '123e4567-e89b-12d3-a456-426614174003' })
  @IsUUID('4', { message: 'El ID del servicio debe ser un UUID válido' })
  serviceId!: string;

  @ApiPropertyOptional({ description: 'ID de la franja horaria', example: '123e4567-e89b-12d3-a456-426614174004', required: false })
  @IsOptional()
  @IsUUID('4', { message: 'El ID de la franja horaria debe ser un UUID válido' })
  timeSlotId?: string;

  @ApiProperty({ 
    description: 'Fecha de la cita', 
    example: '2024-12-01'
  })
  @IsDateString({}, { message: 'La fecha debe estar en formato ISO 8601' })
  @MinDate(new Date(), { message: 'La fecha de la cita no puede ser anterior a la fecha actual' })
  appointmentDate!: Date;

  @ApiProperty({ description: 'Hora de inicio', example: '10:00:00' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'La hora de inicio debe estar en formato HH:MM:SS de 24 horas'
  })
  startTime!: string;

  @ApiProperty({ description: 'Tipo de cita', example: AppointmentType.HAIRCUT, enum: AppointmentType })
  @IsEnum(AppointmentType, { message: 'El tipo de cita debe ser uno de los valores permitidos' })
  type!: AppointmentType;

  @ApiProperty({ description: 'Notas del cliente', example: 'Por favor, no demoren mucho', required: false })
  @IsOptional()
  @IsString({ message: 'Las notas del cliente deben ser texto' })
  @MaxLength(1000, { message: 'Las notas del cliente no pueden exceder 1000 caracteres' })
  clientNotes?: string;
}

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ description: 'Fecha de la cita', example: '2024-12-01' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe estar en formato ISO 8601' })
  @MinDate(new Date(), { message: 'La fecha de la cita no puede ser anterior a la fecha actual' })
  appointmentDate?: Date;

  @ApiPropertyOptional({ description: 'Hora de inicio', example: '10:00:00' })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'La hora de inicio debe estar en formato HH:MM:SS de 24 horas'
  })
  startTime?: string;

  @ApiPropertyOptional({ description: 'ID del barbero', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del barbero debe ser un UUID válido' })
  barberId?: string;

  @ApiPropertyOptional({ description: 'ID del servicio', example: '123e4567-e89b-12d3-a456-426614174003' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del servicio debe ser un UUID válido' })
  serviceId?: string;

  @ApiPropertyOptional({ description: 'Notas del cliente', example: 'Por favor, no demoren mucho', required: false })
  @IsOptional()
  @IsString({ message: 'Las notas del cliente deben ser texto' })
  @MaxLength(1000, { message: 'Las notas del cliente no pueden exceder 1000 caracteres' })
  clientNotes?: string;

  @ApiPropertyOptional({ description: 'Notas internas del barbero', example: 'Cliente muy exigente', required: false })
  @IsOptional()
  @IsString({ message: 'Las notas del barbero deben ser texto' })
  @MaxLength(1000, { message: 'Las notas del barbero no pueden exceder 1000 caracteres' })
  barberNotes?: string;
}

export class UpdateAppointmentStatusDto {
  @ApiProperty({ 
    description: 'Nuevo estado de la cita',
    enum: AppointmentStatus,
    example: AppointmentStatus.CONFIRMED
  })
  @IsEnum(AppointmentStatus, { message: 'El estado debe ser uno de los valores permitidos' })
  status!: AppointmentStatus;

  @ApiPropertyOptional({ description: 'Razón del cambio de estado', example: 'Cliente confirmó por teléfono' })
  @IsOptional()
  @IsString({ message: 'La razón debe ser texto' })
  @MaxLength(500, { message: 'La razón no puede exceder 500 caracteres' })
  reason?: string;
}

export class CancelAppointmentDto {
  @ApiProperty({ description: 'Razón de la cancelación', example: 'Cliente solicitó cancelación' })
  @IsString({ message: 'La razón de cancelación debe ser texto' })
  @MaxLength(500, { message: 'La razón de cancelación no puede exceder 500 caracteres' })
  reason!: string;
}

export class AddPaymentDto {
  @ApiProperty({ description: 'Monto del pago', example: 50.00, minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El monto debe ser un número válido con máximo 2 decimales' })
  @Min(0.01, { message: 'El monto del pago debe ser mayor a 0' })
  amount!: number;

  @ApiPropertyOptional({ description: 'Método de pago', example: 'credit_card', required: false })
  @IsOptional()
  @IsString({ message: 'El método de pago debe ser texto' })
  @MaxLength(50, { message: 'El método de pago no puede exceder 50 caracteres' })
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Referencia del pago', example: 'PAY-123456789', required: false })
  @IsOptional()
  @IsString({ message: 'La referencia del pago debe ser texto' })
  @MaxLength(100, { message: 'La referencia del pago no puede exceder 100 caracteres' })
  paymentReference?: string;
}

export class AddRatingDto {
  @ApiProperty({ description: 'Calificación del cliente', example: 5, minimum: 1, maximum: 5 })
  @IsInt({ message: 'La calificación debe ser un número entero' })
  @Min(1, { message: 'La calificación mínima es 1' })
  @Max(5, { message: 'La calificación máxima es 5' })
  rating!: number;

  @ApiPropertyOptional({ description: 'Comentarios del cliente', example: 'Excelente servicio', required: false })
  @IsOptional()
  @IsString({ message: 'Los comentarios deben ser texto' })
  @MaxLength(1000, { message: 'Los comentarios no pueden exceder 1000 caracteres' })
  feedback?: string;
}

export class AppointmentQueryDto {
  @ApiPropertyOptional({ description: 'ID del cliente', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del cliente debe ser un UUID válido' })
  clientId?: string;

  @ApiPropertyOptional({ description: 'ID del barbero', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del barbero debe ser un UUID válido' })
  barberId?: string;

  @ApiPropertyOptional({ description: 'ID de la sucursal', example: '123e4567-e89b-12d3-a456-426614174002' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID de la sucursal debe ser un UUID válido' })
  branchId?: string;

  @ApiPropertyOptional({ description: 'ID del servicio', example: '123e4567-e89b-12d3-a456-426614174003' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del servicio debe ser un UUID válido' })
  serviceId?: string;

  @ApiPropertyOptional({ 
    description: 'Estado de la cita',
    enum: AppointmentStatus,
    example: AppointmentStatus.CONFIRMED
  })
  @IsOptional()
  @IsEnum(AppointmentStatus, { message: 'El estado debe ser uno de los valores permitidos' })
  status?: AppointmentStatus;

  @ApiPropertyOptional({ 
    description: 'Estado del pago',
    enum: PaymentStatus,
    example: PaymentStatus.PAID
  })
  @IsOptional()
  @IsEnum(PaymentStatus, { message: 'El estado de pago debe ser uno de los valores permitidos' })
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ description: 'Fecha de inicio para filtrar', example: '2024-12-01' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe estar en formato ISO 8601' })
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Fecha de fin para filtrar', example: '2024-12-31' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe estar en formato ISO 8601' })
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Incluir citas eliminadas', example: false })
  @IsOptional()
  @Type(() => Boolean)
  includeDeleted?: boolean = false;

  @ApiPropertyOptional({ description: 'Incluir solo citas próximas', example: true })
  @IsOptional()
  @Type(() => Boolean)
  upcomingOnly?: boolean = false;

  @ApiPropertyOptional({ description: 'Incluir solo citas pasadas', example: false })
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

  @ApiPropertyOptional({ description: 'Campo de ordenamiento', example: 'appointmentDate' })
  @IsOptional()
  @IsString({ message: 'El campo de ordenamiento debe ser texto' })
  sortBy?: string = 'appointmentDate';

  @ApiPropertyOptional({ description: 'Dirección del ordenamiento', example: 'DESC' })
  @IsOptional()
  @IsString({ message: 'La dirección del ordenamiento debe ser texto' })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class AppointmentResponseDto {
  @ApiProperty({ description: 'ID de la cita' })
  id!: string;

  @ApiProperty({ description: 'ID del cliente' })
  clientId!: string;

  @ApiProperty({ description: 'ID del barbero' })
  barberId!: string;

  @ApiProperty({ description: 'ID de la sucursal' })
  branchId!: string;

  @ApiProperty({ description: 'ID del servicio' })
  serviceId!: string;

  @ApiProperty({ description: 'Fecha de la cita' })
  appointmentDate!: Date;

  @ApiProperty({ description: 'Hora de inicio' })
  startTime!: string;

  @ApiProperty({ description: 'Hora de fin' })
  endTime!: string;

  @ApiProperty({ description: 'Estado de la cita' })
  status!: AppointmentStatus;

  @ApiProperty({ description: 'Estado del pago' })
  paymentStatus!: PaymentStatus;

  @ApiProperty({ description: 'Precio total' })
  totalPrice!: number;

  @ApiProperty({ description: 'Monto pagado' })
  paidAmount!: number;

  @ApiProperty({ description: 'Notas del cliente' })
  clientNotes?: string;

  @ApiProperty({ description: 'Notas del barbero' })
  barberNotes?: string;

  @ApiProperty({ description: 'Motivo de cancelación' })
  cancellationReason?: string;

  @ApiProperty({ description: 'Quién canceló' })
  cancelledBy?: string;

  @ApiProperty({ description: 'Fecha de cancelación' })
  cancelledAt?: Date;

  @ApiProperty({ description: 'Recordatorio enviado' })
  reminderSent!: boolean;

  @ApiProperty({ description: 'Fecha del recordatorio' })
  reminderSentAt?: Date;

  @ApiProperty({ description: 'Check-in realizado' })
  checkedIn!: boolean;

  @ApiProperty({ description: 'Fecha del check-in' })
  checkedInAt?: Date;

  @ApiProperty({ description: 'Calificación del cliente' })
  clientRating?: number;

  @ApiProperty({ description: 'Comentarios del cliente' })
  clientFeedback?: string;

  @ApiProperty({ description: 'Información del servicio' })
  service?: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt!: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt!: Date;

  @ApiProperty({ description: 'Fecha de eliminación' })
  deletedAt?: Date;
}

export class AppointmentStatsDto {
  @ApiProperty({ description: 'Total de citas' })
  totalAppointments!: number;

  @ApiProperty({ description: 'Citas por estado' })
  statusCounts!: Record<AppointmentStatus, number>;

  @ApiProperty({ description: 'Citas por estado de pago' })
  paymentStatusCounts!: Record<PaymentStatus, number>;

  @ApiProperty({ description: 'Ingresos totales' })
  totalRevenue!: number;

  @ApiProperty({ description: 'Ingresos pagados' })
  paidRevenue!: number;

  @ApiProperty({ description: 'Ingresos pendientes' })
  pendingRevenue!: number;

  @ApiProperty({ description: 'Promedio de calificaciones' })
  averageRating!: number;

  @ApiProperty({ description: 'Total de cancelaciones' })
  totalCancellations!: number;

  @ApiProperty({ description: 'Tasa de cancelación (%)' })
  cancellationRate!: number;

  @ApiProperty({ description: 'Citas próximas' })
  upcomingAppointments!: number;

  @ApiProperty({ description: 'Citas completadas' })
  completedAppointments!: number;
}