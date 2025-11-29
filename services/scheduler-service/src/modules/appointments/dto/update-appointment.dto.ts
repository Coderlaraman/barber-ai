import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { AppointmentType } from '../enums/appointment.enum';

export class UpdateAppointmentDto {
  @ApiProperty({ description: 'ID del barbero', required: false })
  @IsUUID()
  @IsOptional()
  barberId?: string;

  @ApiProperty({ description: 'ID del cliente', required: false })
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiProperty({ description: 'ID del servicio', required: false })
  @IsUUID()
  @IsOptional()
  serviceId?: string;

  @ApiProperty({ description: 'ID de la franja horaria', required: false })
  @IsUUID()
  @IsOptional()
  timeSlotId?: string;

  @ApiProperty({ description: 'Fecha de la cita', required: false })
  @IsDateString()
  @IsOptional()
  appointmentDate?: string;

  @ApiProperty({ description: 'Hora de inicio (HH:mm)', required: false })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  @IsOptional()
  startTime?: string;

  @ApiProperty({ description: 'Hora de fin (HH:mm)', required: false })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  @IsOptional()
  endTime?: string;

  @ApiProperty({ description: 'Tipo de cita', enum: AppointmentType, required: false })
  @IsEnum(AppointmentType)
  @IsOptional()
  type?: AppointmentType;

  @ApiProperty({ description: 'Notas adicionales', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}