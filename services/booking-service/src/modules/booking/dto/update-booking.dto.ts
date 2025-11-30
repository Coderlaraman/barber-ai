import { IsUUID, IsOptional, IsString, IsEnum } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateBookingDto {
  @ApiProperty({ description: 'ID del cliente', example: '123e4567-e89b-12d3-a456-426614174000', required: false })
  @IsOptional()
  @IsUUID()
  clientId?: string

  @ApiProperty({ description: 'ID del barbero', example: '123e4567-e89b-12d3-a456-426614174001', required: false })
  @IsOptional()
  @IsUUID()
  barberId?: string

  @ApiProperty({ description: 'ID del servicio', example: '123e4567-e89b-12d3-a456-426614174002', required: false })
  @IsOptional()
  @IsUUID()
  serviceId?: string

  @ApiProperty({ description: 'Fecha de la cita', example: '2024-01-15', required: false })
  @IsOptional()
  date?: string

  @ApiProperty({ description: 'Hora de inicio', example: '10:00', required: false })
  @IsOptional()
  @IsString()
  startTime?: string

  @ApiProperty({ description: 'Hora de fin', example: '11:00', required: false })
  @IsOptional()
  @IsString()
  endTime?: string

  @ApiProperty({ description: 'Precio del servicio', example: 25.00, required: false })
  @IsOptional()
  price?: number

  @ApiProperty({ description: 'Notas adicionales', example: 'Corte de cabello y barba', required: false })
  @IsOptional()
  @IsString()
  notes?: string
}