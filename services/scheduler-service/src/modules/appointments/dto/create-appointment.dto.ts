import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { AppointmentType } from '../enums/appointment.enum';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'ID del barbero' })
  @IsUUID()
  barberId!: string;

  @ApiProperty({ description: 'ID del cliente' })
  @IsUUID()
  clientId!: string;

  @ApiProperty({ description: 'ID del servicio' })
  @IsUUID()
  serviceId!: string;

  @ApiProperty({ description: 'ID de la franja horaria', required: false })
  @IsUUID()
  @IsOptional()
  timeSlotId?: string;

  @ApiProperty({ description: 'Fecha de la cita' })
  @IsDateString()
  appointmentDate!: string;

  @ApiProperty({ description: 'Hora de inicio (HH:mm)' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  startTime!: string;

  @ApiProperty({ description: 'Hora de fin (HH:mm)' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime!: string;

  @ApiProperty({ description: 'Tipo de cita', enum: AppointmentType })
  @IsEnum(AppointmentType)
  type!: AppointmentType;

  @ApiProperty({ description: 'Notas adicionales', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}