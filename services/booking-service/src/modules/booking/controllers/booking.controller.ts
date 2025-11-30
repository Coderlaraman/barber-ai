import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ValidationPipe,
  HttpStatus,
  HttpCode
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger'
import { BookingService } from '../services/booking.service'
import { CreateBookingDto } from '../dto/create-booking.dto'
import { UpdateBookingDto } from '../dto/update-booking.dto'
import { BookingResponseDto } from '../dto/booking-response.dto'

@ApiTags('Bookings')
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva cita' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Cita creada exitosamente',
    type: BookingResponseDto
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'El barbero no está disponible en ese horario'
  })
  async createBooking(@Body(new ValidationPipe()) createBookingDto: CreateBookingDto): Promise<BookingResponseDto> {
    return this.bookingService.createBooking(createBookingDto)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cita por ID' })
  @ApiParam({ name: 'id', description: 'ID de la cita', example: '123e4567-e89b-12d3-a456-426614174003' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cita encontrada',
    type: BookingResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cita no encontrada'
  })
  async getBookingById(@Param('id') id: string): Promise<BookingResponseDto> {
    return this.bookingService.getBookingById(id)
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Obtener citas por cliente' })
  @ApiParam({ name: 'clientId', description: 'ID del cliente', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de citas del cliente',
    type: [BookingResponseDto]
  })
  async getBookingsByClient(@Param('clientId') clientId: string): Promise<BookingResponseDto[]> {
    return this.bookingService.getBookingsByClient(clientId)
  }

  @Get('barber/:barberId')
  @ApiOperation({ summary: 'Obtener citas por barbero' })
  @ApiParam({ name: 'barberId', description: 'ID del barbero', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de citas del barbero',
    type: [BookingResponseDto]
  })
  async getBookingsByBarber(@Param('barberId') barberId: string): Promise<BookingResponseDto[]> {
    return this.bookingService.getBookingsByBarber(barberId)
  }

  @Get('date/:date')
  @ApiOperation({ summary: 'Obtener citas por fecha' })
  @ApiParam({ name: 'date', description: 'Fecha de las citas', example: '2024-01-15' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de citas para la fecha especificada',
    type: [BookingResponseDto]
  })
  async getBookingsByDate(@Param('date') date: string): Promise<BookingResponseDto[]> {
    return this.bookingService.getBookingsByDate(date)
  }

  @Put(':id/confirm')
  @ApiOperation({ summary: 'Confirmar una cita' })
  @ApiParam({ name: 'id', description: 'ID de la cita', example: '123e4567-e89b-12d3-a456-426614174003' })
  @ApiQuery({ name: 'confirmedBy', description: 'Quién confirma la cita', example: 'CLIENT' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cita confirmada exitosamente',
    type: BookingResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cita no encontrada'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'La cita ya está confirmada o cancelada'
  })
  async confirmBooking(
    @Param('id') id: string,
    @Query('confirmedBy') confirmedBy: 'CLIENT' | 'BARBER' | 'SYSTEM'
  ): Promise<BookingResponseDto> {
    return this.bookingService.confirmBooking(id, confirmedBy)
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancelar una cita' })
  @ApiParam({ name: 'id', description: 'ID de la cita', example: '123e4567-e89b-12d3-a456-426614174003' })
  @ApiQuery({ name: 'reason', description: 'Razón de la cancelación', example: 'Cliente enfermo' })
  @ApiQuery({ name: 'cancelledBy', description: 'ID del usuario que cancela', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cita cancelada exitosamente',
    type: BookingResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cita no encontrada'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'La cita ya está cancelada'
  })
  async cancelBooking(
    @Param('id') id: string,
    @Query('reason') reason: string,
    @Query('cancelledBy') cancelledBy: string
  ): Promise<BookingResponseDto> {
    return this.bookingService.cancelBooking(id, reason, cancelledBy)
  }

  @Put(':id/reschedule')
  @ApiOperation({ summary: 'Reprogramar una cita' })
  @ApiParam({ name: 'id', description: 'ID de la cita', example: '123e4567-e89b-12d3-a456-426614174003' })
  @ApiQuery({ name: 'newDate', description: 'Nueva fecha', example: '2024-01-16' })
  @ApiQuery({ name: 'newStartTime', description: 'Nueva hora de inicio', example: '14:00' })
  @ApiQuery({ name: 'newEndTime', description: 'Nueva hora de fin', example: '15:00' })
  @ApiQuery({ name: 'reason', description: 'Razón de la reprogramación', example: 'Cambio de horario', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cita reprogramada exitosamente',
    type: BookingResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cita no encontrada'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'No se puede reprogramar una cita cancelada o el nuevo horario no está disponible'
  })
  async rescheduleBooking(
    @Param('id') id: string,
    @Query('newDate') newDate: string,
    @Query('newStartTime') newStartTime: string,
    @Query('newEndTime') newEndTime: string,
    @Query('reason') reason?: string
  ): Promise<BookingResponseDto> {
    return this.bookingService.rescheduleBooking(id, newDate, newStartTime, newEndTime, reason)
  }
}