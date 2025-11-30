import { IsUUID, IsDateString, IsNumber, IsPositive, IsEnum, IsOptional, IsString, Min, Max } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateBookingDto {
  @ApiProperty({ description: 'ID del cliente', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  clientId: string

  @ApiProperty({ description: 'ID del barbero', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  barberId: string

  @ApiProperty({ description: 'ID del servicio', example: '123e4567-e89b-12d3-a456-426614174002' })
  @IsUUID()
  serviceId: string

  @ApiProperty({ description: 'Fecha de la cita', example: '2024-01-15' })
  @IsDateString()
  date: string

  @ApiProperty({ description: 'Hora de inicio', example: '10:00' })
  @IsString()
  startTime: string

  @ApiProperty({ description: 'Hora de fin', example: '11:00' })
  @IsString()
  endTime: string

  @ApiProperty({ description: 'Precio del servicio', example: 25.00 })
  @IsNumber()
  @IsPositive()
  price: number

  @ApiProperty({ description: 'Notas adicionales', example: 'Corte de cabello y barba', required: false })
  @IsOptional()
  @IsString()
  notes?: string
}