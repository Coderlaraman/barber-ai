import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { AppointmentHistoryRepository } from '../repositories/appointment-history.repository';
import { TimeSlotRepository } from '../../time-slots/repositories/time-slot.repository';
import { ServiceRepository } from '../../services/repositories/service.repository';
import { BarberAvailabilityRepository } from '../../availability/repositories/barber-availability.repository';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentHistory } from '../entities/appointment-history.entity';
import { CreateAppointmentDto, UpdateAppointmentDto } from '../dto/appointment.dto';
import { AppointmentStatus, AppointmentType } from '../enums/appointment.enum';
import { TimeSlotStatus } from '../../time-slots/entities/time-slot.entity';

@Injectable()
export class AppointmentDomainService {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly appointmentHistoryRepository: AppointmentHistoryRepository,
    private readonly timeSlotRepository: TimeSlotRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly barberAvailabilityRepository: BarberAvailabilityRepository,
  ) {}

  async createAppointment(createAppointmentDto: CreateAppointmentDto, userId: string): Promise<Appointment> {
    const { barberId, clientId, serviceId, appointmentDate, startTime } = createAppointmentDto;

    // Validar que el servicio existe y está activo
    const service = await this.serviceRepository.findOneById(serviceId);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    // Validar que el time slot existe y está disponible (si se proporciona)
    let timeSlot;
    if ('timeSlotId' in createAppointmentDto && createAppointmentDto.timeSlotId) {
      timeSlot = await this.timeSlotRepository.findOneById(createAppointmentDto.timeSlotId);
      if (!timeSlot) {
        throw new NotFoundException('Franja horaria no encontrada');
      }

      if (!timeSlot.isAvailable() || timeSlot.isBooked() || timeSlot.isBlocked()) {
        throw new ConflictException('La franja horaria no está disponible');
      }
    }

    // Validar que no haya citas superpuestas para el barbero
    const overlappingAppointments = await this.appointmentRepository.findOverlappingAppointments(
      barberId,
      appointmentDate,
      startTime,
      startTime // Usar startTime como endTime temporalmente
    );

    if (overlappingAppointments.length > 0) {
      throw new ConflictException('Ya existe una cita en este horario para el barbero');
    }

    // Validar que el cliente no tenga citas superpuestas
    const clientOverlappingAppointments = await this.appointmentRepository.findOverlappingAppointments(
      clientId,
      appointmentDate,
      startTime,
      startTime // Usar startTime como endTime temporalmente
    );

    if (clientOverlappingAppointments.length > 0) {
      throw new ConflictException('El cliente ya tiene una cita en este horario');
    }

    // Crear la cita
    const appointment = await this.appointmentRepository.create({
      ...createAppointmentDto,
      status: AppointmentStatus.PENDING,
      createdBy: userId,
      updatedBy: userId,
      endTime: startTime, // Temporal hasta que tengamos la duración del servicio
      type: createAppointmentDto.type || AppointmentType.HAIRCUT,
    });

    // Bloquear el time slot si se proporcionó
    if (timeSlot && createAppointmentDto.timeSlotId) {
      await this.timeSlotRepository.update(createAppointmentDto.timeSlotId, {
        status: TimeSlotStatus.BOOKED,
        updatedBy: userId,
      });
    }

    // Incrementar la popularidad del servicio
    await this.serviceRepository.incrementPopularity(serviceId);

    // Crear registro en el historial
    await this.createHistoryRecord(appointment.id, 'created', userId, null, appointment);

    return appointment;
  }

  async updateAppointment(id: string, updateAppointmentDto: UpdateAppointmentDto, userId: string): Promise<Appointment> {
    const existingAppointment = await this.appointmentRepository.findOneById(id);
    if (!existingAppointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    if (existingAppointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('No se puede modificar una cita completada');
    }

    if (existingAppointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('No se puede modificar una cita cancelada');
    }

    const oldAppointment = { ...existingAppointment };

    // Si se está cambiando el horario, validar disponibilidad
    if (updateAppointmentDto.appointmentDate || updateAppointmentDto.startTime) {
      const barberId = updateAppointmentDto.barberId || existingAppointment.barberId;
      const appointmentDate = updateAppointmentDto.appointmentDate || existingAppointment.appointmentDate;
      const startTime = updateAppointmentDto.startTime || existingAppointment.startTime;
      const endTime = startTime; // Temporal hasta que tengamos la duración del servicio

      const overlappingAppointments = await this.appointmentRepository.findOverlappingAppointments(
        barberId,
        appointmentDate,
        startTime,
        endTime,
        id
      );

      if (overlappingAppointments.length > 0) {
        throw new ConflictException('Ya existe una cita en este horario para el barbero');
      }
    }

    // Actualizar la cita
    const updatedAppointment = await this.appointmentRepository.update(id, {
      ...updateAppointmentDto,
      updatedBy: userId,
    });

    if (!updatedAppointment) {
      throw new NotFoundException('Error al actualizar la cita');
    }

    // Crear registro en el historial
    await this.createHistoryRecord(id, 'updated', userId, oldAppointment, updatedAppointment);

    return updatedAppointment;
  }

  async cancelAppointment(id: string, reason: string, userId: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOneById(id);
    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('La cita ya está cancelada');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('No se puede cancelar una cita completada');
    }

    // Actualizar el estado de la cita
    const cancelledAppointment = await this.appointmentRepository.update(id, {
      status: AppointmentStatus.CANCELLED,
      cancellationReason: reason,
      updatedBy: userId,
    });

    if (!cancelledAppointment) {
      throw new NotFoundException('Error al cancelar la cita');
    }

    // Liberar el time slot
    if (appointment.timeSlotId) {
      await this.timeSlotRepository.update(appointment.timeSlotId, {
        status: TimeSlotStatus.AVAILABLE,
        updatedBy: userId,
      });
    }

    // Decrementar la popularidad del servicio
    await this.serviceRepository.decrementPopularity(appointment.serviceId);

    // Crear registro en el historial
    await this.createHistoryRecord(id, 'cancelled', userId, appointment, cancelledAppointment);

    return cancelledAppointment;
  }

  async confirmAppointment(id: string, userId: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOneById(id);
    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException('Solo se pueden confirmar citas pendientes');
    }

    const confirmedAppointment = await this.appointmentRepository.update(id, {
      status: AppointmentStatus.CONFIRMED,
      updatedBy: userId,
    });

    if (!confirmedAppointment) {
      throw new NotFoundException('Error al confirmar la cita');
    }

    // Crear registro en el historial
    await this.createHistoryRecord(id, 'confirmed', userId, appointment, confirmedAppointment);

    return confirmedAppointment;
  }

  async completeAppointment(id: string, notes: string, userId: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOneById(id);
    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException('Solo se pueden completar citas confirmadas');
    }

    const completedAppointment = await this.appointmentRepository.update(id, {
      status: AppointmentStatus.COMPLETED,
      notes: notes || appointment.notes,
      updatedBy: userId,
    });

    if (!completedAppointment) {
      throw new NotFoundException('Error al completar la cita');
    }

    // Crear registro en el historial
    await this.createHistoryRecord(id, 'completed', userId, appointment, completedAppointment);

    return completedAppointment;
  }

  async getAppointmentById(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOneById(id);
    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }
    return appointment;
  }

  async getAppointmentsByBarber(barberId: string, date?: Date): Promise<Appointment[]> {
    if (date) {
      return this.appointmentRepository.findByBarberAndDate(barberId, date);
    }
    // Usar un método genérico con filtros
    return this.appointmentRepository.findByBarberId(barberId);
  }

  async getAppointmentsByClient(clientId: string, date?: Date): Promise<Appointment[]> {
    if (date) {
      return this.appointmentRepository.findByClientAndDate(clientId, date);
    }
    // Usar un método genérico con filtros
    return this.appointmentRepository.findByClientId(clientId);
  }

  async getAppointmentsByDateRange(startDate: Date, endDate: Date, barberId?: string): Promise<Appointment[]> {
    if (barberId) {
      return this.appointmentRepository.findByBarberAndDateRange(barberId, startDate, endDate);
    }
    // Usar un método genérico con filtros de rango de fechas
    return this.appointmentRepository.findByDateRange(startDate, endDate);
  }

  async getAppointmentsByStatus(status: AppointmentStatus): Promise<Appointment[]> {
    return this.appointmentRepository.findByStatus(status);
  }

  async getAppointmentHistory(appointmentId: string): Promise<AppointmentHistory[]> {
    return this.appointmentHistoryRepository.findByAppointmentId(appointmentId);
  }

  async validateAppointmentAvailability(createAppointmentDto: CreateAppointmentDto): Promise<boolean> {
    const { barberId, appointmentDate, startTime } = createAppointmentDto;

    // Validar que no haya citas superpuestas
    const overlappingAppointments = await this.appointmentRepository.findOverlappingAppointments(
      barberId,
      appointmentDate,
      startTime,
      startTime // Usar startTime como endTime temporalmente
    );

    return overlappingAppointments.length === 0;
  }

  private async createHistoryRecord(
    appointmentId: string,
    action: string,
    userId: string,
    _oldData?: any,
    _newData?: any
  ): Promise<AppointmentHistory> {
    return this.appointmentHistoryRepository.create({
      appointmentId,
      action: action as any,
      performedBy: userId,
      changedBy: userId,
      createdBy: userId,
      updatedBy: userId,
    });
  }
}