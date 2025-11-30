import { ApiProperty } from '@nestjs/swagger'

export class BookingResponseDto {
  @ApiProperty({ description: 'ID de la cita', example: '123e4567-e89b-12d3-a456-426614174003' })
  id: string

  @ApiProperty({ description: 'ID del cliente', example: '123e4567-e89b-12d3-a456-426614174000' })
  clientId: string

  @ApiProperty({ description: 'ID del barbero', example: '123e4567-e89b-12d3-a456-426614174001' })
  barberId: string

  @ApiProperty({ description: 'ID del servicio', example: '123e4567-e89b-12d3-a456-426614174002' })
  serviceId: string

  @ApiProperty({ description: 'Fecha de la cita', example: '2024-01-15' })
  date: string

  @ApiProperty({ description: 'Hora de inicio', example: '10:00' })
  startTime: string

  @ApiProperty({ description: 'Hora de fin', example: '11:00' })
  endTime: string

  @ApiProperty({ description: 'Precio del servicio', example: 25.00 })
  price: number

  @ApiProperty({ description: 'Estado de la cita', example: 'PENDING' })
  status: string

  @ApiProperty({ description: 'Notas adicionales', example: 'Corte de cabello y barba', nullable: true })
  notes?: string

  @ApiProperty({ description: 'Confirmado por', example: 'CLIENT', nullable: true })
  confirmedBy?: string

  @ApiProperty({ description: 'Fecha de confirmación', example: '2024-01-14T10:00:00Z', nullable: true })
  confirmedAt?: Date

  @ApiProperty({ description: 'Razón de cancelación', example: 'Cliente enfermo', nullable: true })
  cancellationReason?: string

  @ApiProperty({ description: 'Fecha de cancelación', example: '2024-01-14T10:00:00Z', nullable: true })
  cancelledAt?: Date

  @ApiProperty({ description: 'Fecha de creación', example: '2024-01-14T10:00:00Z' })
  createdAt: Date

  @ApiProperty({ description: 'Fecha de actualización', example: '2024-01-14T10:00:00Z' })
  updatedAt: Date
}