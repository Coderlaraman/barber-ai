import { Controller, Get, Post, Put, Body, Param, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AppointmentDomainService } from '../services/appointment-domain.service';
import { Appointment } from '../entities/appointment.entity';
import { CreateAppointmentDto, UpdateAppointmentDto } from '../dto/appointment.dto';
import { AppointmentStatus } from '../enums/appointment.enum';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentDomainService: AppointmentDomainService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva cita' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Cita creada exitosamente', type: Appointment })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Conflicto: horario no disponible' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Servicio o franja horaria no encontrada' })
  async create(@Body() createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    // En un sistema real, obtendríamos el userId del contexto de autenticación
    const userId = 'system';
    return this.appointmentDomainService.createAppointment(createAppointmentDto, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una cita por ID' })
  @ApiParam({ name: 'id', description: 'ID de la cita', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cita encontrada', type: Appointment })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Cita no encontrada' })
  async findOne(@Param('id') id: string): Promise<Appointment> {
    return this.appointmentDomainService.getAppointmentById(id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las citas con filtros opcionales' })
  @ApiQuery({ name: 'barberId', required: false, description: 'ID del barbero' })
  @ApiQuery({ name: 'clientId', required: false, description: 'ID del cliente' })
  @ApiQuery({ name: 'date', required: false, description: 'Fecha específica (YYYY-MM-DD)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha de inicio del rango (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha de fin del rango (YYYY-MM-DD)' })
  @ApiQuery({ name: 'status', required: false, description: 'Estado de la cita', enum: AppointmentStatus })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de citas', type: [Appointment] })
  async findAll(
    @Query('barberId') barberId?: string,
    @Query('clientId') clientId?: string,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: AppointmentStatus,
  ): Promise<Appointment[]> {
    if (barberId && date) {
      return this.appointmentDomainService.getAppointmentsByBarber(barberId, new Date(date));
    }
    
    if (clientId && date) {
      return this.appointmentDomainService.getAppointmentsByClient(clientId, new Date(date));
    }
    
    if (barberId && startDate && endDate) {
      return this.appointmentDomainService.getAppointmentsByDateRange(new Date(startDate), new Date(endDate), barberId);
    }
    
    if (startDate && endDate) {
      return this.appointmentDomainService.getAppointmentsByDateRange(new Date(startDate), new Date(endDate));
    }
    
    if (status) {
      return this.appointmentDomainService.getAppointmentsByStatus(status);
    }
    
    if (barberId) {
      return this.appointmentDomainService.getAppointmentsByBarber(barberId);
    }
    
    if (clientId) {
      return this.appointmentDomainService.getAppointmentsByClient(clientId);
    }
    
    // Retornar todas las citas activas si no hay filtros
    return []; // Implementar método en el servicio si es necesario
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una cita' })
  @ApiParam({ name: 'id', description: 'ID de la cita', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cita actualizada', type: Appointment })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Cita no encontrada' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Conflicto: horario no disponible' })
  async update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const userId = 'system';
    return this.appointmentDomainService.updateAppointment(id, updateAppointmentDto, userId);
  }

  @Put(':id/confirm')
  @ApiOperation({ summary: 'Confirmar una cita' })
  @ApiParam({ name: 'id', description: 'ID de la cita', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cita confirmada', type: Appointment })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Cita no encontrada' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'La cita no puede ser confirmada' })
  async confirm(@Param('id') id: string): Promise<Appointment> {
    const userId = 'system';
    return this.appointmentDomainService.confirmAppointment(id, userId);
  }

  @Put(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar una cita' })
  @ApiParam({ name: 'id', description: 'ID de la cita', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cita cancelada', type: Appointment })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Cita no encontrada' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'La cita no puede ser cancelada' })
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ): Promise<Appointment> {
    const userId = 'system';
    return this.appointmentDomainService.cancelAppointment(id, reason || 'Cancelada por el sistema', userId);
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Completar una cita' })
  @ApiParam({ name: 'id', description: 'ID de la cita', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cita completada', type: Appointment })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Cita no encontrada' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'La cita no puede ser completada' })
  async complete(
    @Param('id') id: string,
    @Body('notes') notes: string,
  ): Promise<Appointment> {
    const userId = 'system';
    return this.appointmentDomainService.completeAppointment(id, notes, userId);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Obtener el historial de cambios de una cita' })
  @ApiParam({ name: 'id', description: 'ID de la cita', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Historial de la cita' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Cita no encontrada' })
  async getHistory(@Param('id') id: string) {
    return this.appointmentDomainService.getAppointmentHistory(id);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validar la disponibilidad de un horario para una cita' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Validación exitosa' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Horario no disponible' })
  async validateAvailability(@Body() createAppointmentDto: CreateAppointmentDto): Promise<{ available: boolean }> {
    const isAvailable = await this.appointmentDomainService.validateAppointmentAvailability(createAppointmentDto);
    return { available: isAvailable };
  }
}