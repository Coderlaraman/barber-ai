import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpCode, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AvailabilityDomainService } from '../services/availability-domain.service';
import { BarberAvailability } from '../entities/barber-availability.entity';
import { TimeSlot } from '../../time-slots/entities/time-slot.entity';
import { CreateBarberAvailabilityDto, UpdateBarberAvailabilityDto } from '../dto/barber-availability.dto';

@ApiTags('availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityDomainService: AvailabilityDomainService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva disponibilidad de barbero' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Disponibilidad creada exitosamente', type: BarberAvailability })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Conflicto: horario superpuesto' })
  async create(@Body() createDto: CreateBarberAvailabilityDto): Promise<BarberAvailability> {
    const userId = 'system';
    return this.availabilityDomainService.createAvailability(createDto, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una disponibilidad por ID' })
  @ApiParam({ name: 'id', description: 'ID de la disponibilidad', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Disponibilidad encontrada', type: BarberAvailability })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Disponibilidad no encontrada' })
  async findOne(@Param('id') id: string): Promise<BarberAvailability> {
    const availability = await this.availabilityDomainService.getAvailabilityById(id);
    if (!availability) {
      throw new NotFoundException('Disponibilidad no encontrada');
    }
    return availability;
  }

  @Get()
  @ApiOperation({ summary: 'Obtener disponibilidades con filtros opcionales' })
  @ApiQuery({ name: 'barberId', required: false, description: 'ID del barbero' })
  @ApiQuery({ name: 'dayOfWeek', required: false, description: 'Día de la semana (0-6)', type: Number })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha de inicio del rango (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha de fin del rango (YYYY-MM-DD)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de disponibilidades', type: [BarberAvailability] })
  async findAll(
    @Query('barberId') barberId?: string,
    @Query('dayOfWeek') dayOfWeek?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<BarberAvailability[]> {
    if (barberId && dayOfWeek !== undefined) {
      return this.availabilityDomainService.getAvailabilityByBarberAndDay(barberId, dayOfWeek);
    }
    
    if (barberId && startDate && endDate) {
      return this.availabilityDomainService.getAvailabilityByDateRange(new Date(startDate), new Date(endDate), barberId);
    }
    
    if (startDate && endDate) {
      return this.availabilityDomainService.getAvailabilityByDateRange(new Date(startDate), new Date(endDate));
    }
    
    if (barberId) {
      return this.availabilityDomainService.getAvailabilityByBarber(barberId);
    }
    
    return this.availabilityDomainService.getActiveAvailabilities();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una disponibilidad' })
  @ApiParam({ name: 'id', description: 'ID de la disponibilidad', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Disponibilidad actualizada', type: BarberAvailability })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Disponibilidad no encontrada' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Conflicto: horario superpuesto' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateBarberAvailabilityDto,
  ): Promise<BarberAvailability> {
    const userId = 'system';
    return this.availabilityDomainService.updateAvailability(id, updateDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una disponibilidad' })
  @ApiParam({ name: 'id', description: 'ID de la disponibilidad', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Disponibilidad eliminada exitosamente' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Disponibilidad no encontrada' })
  async delete(@Param('id') id: string): Promise<void> {
    const userId = 'system';
    await this.availabilityDomainService.deleteAvailability(id, userId);
  }

  @Post('generate-slots')
  @ApiOperation({ summary: 'Generar franjas horarias para un rango de fechas' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Franjas horarias generadas exitosamente' })
  async generateTimeSlots(
    @Body('barberId') barberId: string,
    @Body('startDate') startDate: string,
    @Body('endDate') endDate: string,
  ): Promise<void> {
    const userId = 'system';
    await this.availabilityDomainService.generateTimeSlotsForDateRange(
      barberId,
      new Date(startDate),
      new Date(endDate),
      userId,
    );
  }

  @Post('block-slot')
  @ApiOperation({ summary: 'Bloquear una franja horaria específica' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Franja horaria bloqueada', type: TimeSlot })
  async blockTimeSlot(
    @Body('barberId') barberId: string,
    @Body('date') date: string,
    @Body('startTime') startTime: string,
    @Body('endTime') endTime: string,
    @Body('reason') reason: string,
  ): Promise<TimeSlot> {
    const userId = 'system';
    return this.availabilityDomainService.blockTimeSlot(barberId, new Date(date), startTime, endTime, reason, userId);
  }

  @Put('unblock-slot/:slotId')
  @ApiOperation({ summary: 'Desbloquear una franja horaria' })
  @ApiParam({ name: 'slotId', description: 'ID de la franja horaria', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Franja horaria desbloqueada', type: TimeSlot })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Franja horaria no encontrada' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'La franja horaria no está bloqueada' })
  async unblockTimeSlot(@Param('slotId') slotId: string): Promise<TimeSlot> {
    const userId = 'system';
    return this.availabilityDomainService.unblockTimeSlot(slotId, userId);
  }
}