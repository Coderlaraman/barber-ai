import { IsEnum, IsString, IsOptional, IsObject, IsArray } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { NotificationChannel, NotificationType } from '../enums/notification.enum'

export class CreateTemplateDto {
  @ApiProperty({ description: 'Tipo de notificación', enum: NotificationType, example: NotificationType.APPOINTMENT_CONFIRMED })
  @IsEnum(NotificationType)
  type!: NotificationType

  @ApiProperty({ description: 'Canal de notificación', enum: NotificationChannel, example: NotificationChannel.EMAIL })
  @IsEnum(NotificationChannel)
  channel!: NotificationChannel

  @ApiProperty({ description: 'Código de idioma', example: 'es', default: 'es' })
  @IsString()
  @IsOptional()
  language?: string = 'es'

  @ApiProperty({ description: 'Nombre de la plantilla', example: 'Confirmación de Cita' })
  @IsString()
  name!: string

  @ApiPropertyOptional({ description: 'Asunto del email (solo para email)', example: 'Tu cita ha sido confirmada' })
  @IsString()
  @IsOptional()
  subject?: string

  @ApiPropertyOptional({ description: 'Plantilla del título', example: '¡Cita Confirmada!' })
  @IsString()
  @IsOptional()
  titleTemplate?: string

  @ApiProperty({ description: 'Plantilla del contenido', example: 'Hola {{userName}}, tu cita con {{barberName}} para el {{date}} a las {{time}} ha sido confirmada.' })
  @IsString()
  contentTemplate!: string

  @ApiPropertyOptional({ description: 'Variables disponibles en la plantilla', example: ['userName', 'barberName', 'date', 'time', 'service'] })
  @IsArray()
  @IsOptional()
  variables?: string[]

  @ApiPropertyOptional({ description: 'Descripción de la plantilla', example: 'Plantilla para confirmar citas de barbería' })
  @IsString()
  @IsOptional()
  description?: string
}