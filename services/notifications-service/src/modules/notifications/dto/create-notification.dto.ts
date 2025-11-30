import { IsEnum, IsString, IsOptional, IsUUID, IsObject, IsDateString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { NotificationChannel, NotificationType } from '../enums/notification.enum'

export class CreateNotificationDto {
  @ApiProperty({ description: 'ID del usuario destinatario', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  userId!: string

  @ApiProperty({ description: 'Tipo de notificación', enum: NotificationType, example: NotificationType.APPOINTMENT_CONFIRMED })
  @IsEnum(NotificationType)
  type!: NotificationType

  @ApiProperty({ description: 'Canal de notificación', enum: NotificationChannel, example: NotificationChannel.EMAIL })
  @IsEnum(NotificationChannel)
  channel!: NotificationChannel

  @ApiProperty({ description: 'Título de la notificación', example: 'Cita Confirmada' })
  @IsString()
  title!: string

  @ApiProperty({ description: 'Contenido de la notificación', example: 'Tu cita con el barbero Juan ha sido confirmada para el 15 de enero a las 14:00' })
  @IsString()
  content!: string

  @ApiPropertyOptional({ description: 'Datos adicionales para la plantilla', example: { appointmentId: '123', barberName: 'Juan', date: '2024-01-15', time: '14:00' } })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>

  @ApiPropertyOptional({ description: 'ID de plantilla para usar', example: 'appointment-confirmed-es' })
  @IsString()
  @IsOptional()
  templateId?: string

  @ApiPropertyOptional({ description: 'Fecha programada para envío', example: '2024-01-15T13:30:00Z' })
  @IsDateString()
  @IsOptional()
  scheduledFor?: string
}