import { IsEnum, IsString, IsOptional, IsObject, IsBoolean, IsDateString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { NotificationChannel } from '../enums/notification.enum'

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({ description: 'Habilitar notificaciones por email', example: true })
  @IsBoolean()
  @IsOptional()
  emailEnabled?: boolean

  @ApiPropertyOptional({ description: 'Habilitar notificaciones push', example: true })
  @IsBoolean()
  @IsOptional()
  pushEnabled?: boolean

  @ApiPropertyOptional({ description: 'Habilitar notificaciones SMS', example: false })
  @IsBoolean()
  @IsOptional()
  smsEnabled?: boolean

  @ApiPropertyOptional({ description: 'Habilitar notificaciones in-app', example: true })
  @IsBoolean()
  @IsOptional()
  inAppEnabled?: boolean

  @ApiPropertyOptional({ description: 'Hora de inicio de horas de silencio', example: '22:00' })
  @IsString()
  @IsOptional()
  quietHoursStart?: string

  @ApiPropertyOptional({ description: 'Hora de fin de horas de silencio', example: '08:00' })
  @IsString()
  @IsOptional()
  quietHoursEnd?: string

  @ApiPropertyOptional({ description: 'Zona horaria', example: 'America/Mexico_City' })
  @IsString()
  @IsOptional()
  timezone?: string

  @ApiPropertyOptional({ description: 'Recordatorios de citas', example: true })
  @IsBoolean()
  @IsOptional()
  appointmentReminders?: boolean

  @ApiPropertyOptional({ description: 'Emails promocionales', example: true })
  @IsBoolean()
  @IsOptional()
  promotionalEmails?: boolean

  @ApiPropertyOptional({ description: 'Confirmaciones de reserva', example: true })
  @IsBoolean()
  @IsOptional()
  bookingConfirmations?: boolean

  @ApiPropertyOptional({ description: 'Notificaciones de pago', example: true })
  @IsBoolean()
  @IsOptional()
  paymentNotifications?: boolean

  @ApiPropertyOptional({ description: 'Solicitudes de reseña', example: true })
  @IsBoolean()
  @IsOptional()
  reviewRequests?: boolean

  @ApiPropertyOptional({ description: 'Actualizaciones del sistema', example: true })
  @IsBoolean()
  @IsOptional()
  systemUpdates?: boolean
}