import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { BarberAvailabilityRepository } from '../repositories/barber-availability.repository';
import { TimeSlotRepository } from '../../time-slots/repositories/time-slot.repository';
import { BarberAvailability } from '../entities/barber-availability.entity';
import { TimeSlot } from '../../time-slots/entities/time-slot.entity';
import { CreateBarberAvailabilityDto, UpdateBarberAvailabilityDto } from '../dto/barber-availability.dto';
import { addDays, format } from 'date-fns';

@Injectable()
export class AvailabilityDomainService {
  constructor(
    private readonly barberAvailabilityRepository: BarberAvailabilityRepository,
    private readonly timeSlotRepository: TimeSlotRepository,
  ) {}

  async createAvailability(createDto: CreateBarberAvailabilityDto, userId: string): Promise<BarberAvailability> {
    const { barberId, dayOfWeek, startTime, endTime, validFrom, validUntil } = createDto;

    // Validar que no haya disponibilidades superpuestas
    const overlappingAvailabilities = await this.barberAvailabilityRepository.findOverlappingAvailabilities(
      barberId,
      dayOfWeek,
      startTime,
      endTime
    );

    if (overlappingAvailabilities.length > 0) {
      throw new ConflictException('Ya existe una disponibilidad en este horario para el barbero');
    }

    // Validar que la fecha de fin sea posterior a la fecha de inicio
    if (validUntil && validFrom && validFrom > validUntil) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    const availability = await this.barberAvailabilityRepository.create({
      ...createDto,
      createdBy: userId,
      updatedBy: userId,
    });

    // Generar time slots para las fechas futuras
    await this.generateTimeSlotsForAvailability(availability, userId);

    return availability;
  }

  async updateAvailability(id: string, updateDto: UpdateBarberAvailabilityDto, userId: string): Promise<BarberAvailability> {
    const existingAvailability = await this.barberAvailabilityRepository.findOneById(id);
    if (!existingAvailability) {
      throw new NotFoundException('Disponibilidad no encontrada');
    }

    const { barberId, dayOfWeek, startTime, endTime } = updateDto;

    // Validar que no haya disponibilidades superpuestas (excluyendo la actual)
    const overlappingAvailabilities = await this.barberAvailabilityRepository.findOverlappingAvailabilities(
      barberId || existingAvailability.barberId,
      dayOfWeek || existingAvailability.dayOfWeek,
      startTime || existingAvailability.startTime,
      endTime || existingAvailability.endTime,
      id
    );

    if (overlappingAvailabilities.length > 0) {
      throw new ConflictException('Ya existe una disponibilidad en este horario para el barbero');
    }

    // Validar que la fecha de fin sea posterior a la fecha de inicio
    if (updateDto.validUntil && updateDto.validFrom && updateDto.validFrom > updateDto.validUntil) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    const updatedAvailability = await this.barberAvailabilityRepository.update(id, {
      ...updateDto,
      updatedBy: userId,
    });

    if (!updatedAvailability) {
      throw new NotFoundException('Error al actualizar la disponibilidad');
    }

    // Regenerar time slots si cambiaron los horarios
    if (startTime || endTime) {
      await this.regenerateTimeSlotsForAvailability(updatedAvailability, userId);
    }

    return updatedAvailability;
  }

  async deleteAvailability(id: string, userId: string): Promise<boolean> {
    const availability = await this.barberAvailabilityRepository.findOneById(id);
    if (!availability) {
      throw new NotFoundException('Disponibilidad no encontrada');
    }

    // Eliminar time slots futuros asociados
    await this.deleteFutureTimeSlotsForAvailability(availability, userId);

    return this.barberAvailabilityRepository.softDelete(id, userId);
  }

  async getAvailabilityByBarber(barberId: string): Promise<BarberAvailability[]> {
    return this.barberAvailabilityRepository.findByBarberId(barberId);
  }

  async getAvailabilityByBarberAndDay(barberId: string, dayOfWeek: number): Promise<BarberAvailability[]> {
    return this.barberAvailabilityRepository.findByBarberIdAndDay(barberId, dayOfWeek);
  }

  async getActiveAvailabilities(): Promise<BarberAvailability[]> {
    return this.barberAvailabilityRepository.findActiveAvailabilities();
  }

  async getAvailabilityByDateRange(startDate: Date, endDate: Date, barberId?: string): Promise<BarberAvailability[]> {
    if (barberId) {
      return this.barberAvailabilityRepository.findByBarberIdAndDateRange(barberId, startDate, endDate);
    }
    return this.barberAvailabilityRepository.findByDateRange(startDate, endDate);
  }

  async getAvailabilityById(id: string): Promise<BarberAvailability> {
    const availability = await this.barberAvailabilityRepository.findOneById(id);
    if (!availability) {
      throw new NotFoundException('Disponibilidad no encontrada');
    }
    return availability;
  }

  async generateTimeSlotsForDateRange(barberId: string, startDate: Date, endDate: Date, userId: string): Promise<void> {
    const currentDate = new Date(startDate);
    const endDateTime = new Date(endDate);

    while (currentDate <= endDateTime) {
      const dayOfWeek = currentDate.getDay(); // 0 = Domingo, 1 = Lunes, etc.
      
      // Obtener disponibilidades del barbero para este día de la semana
      const availabilities = await this.barberAvailabilityRepository.findByBarberIdAndDay(barberId, dayOfWeek);

      for (const availability of availabilities) {
        // Verificar que la fecha esté dentro del rango válido de la disponibilidad
        if (this.isDateInAvailabilityRange(currentDate, availability)) {
          await this.createTimeSlotFromAvailability(availability, currentDate, userId);
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  async blockTimeSlot(barberId: string, date: Date, startTime: string, endTime: string, reason: string, userId: string): Promise<TimeSlot> {
    // Verificar si ya existe un time slot para este horario
    const existingSlots = await this.timeSlotRepository.findOverlappingSlots(barberId, date, startTime, endTime);
    
    let timeSlot: TimeSlot;
    
    if (existingSlots.length > 0) {
      // Actualizar el slot existente
      timeSlot = existingSlots[0];
      await this.timeSlotRepository.update(timeSlot.id, {
        isBlocked: true,
        isAvailable: false,
        isBooked: false,
        notes: reason,
        updatedBy: userId,
      });
    } else {
      // Crear un nuevo slot bloqueado
      timeSlot = await this.timeSlotRepository.create({
        barberId,
        date,
        startTime,
        endTime,
        isBlocked: true,
        isAvailable: false,
        isBooked: false,
        notes: reason,
        createdBy: userId,
        updatedBy: userId,
      });
    }

    return timeSlot;
  }

  async unblockTimeSlot(timeSlotId: string, userId: string): Promise<TimeSlot> {
    const timeSlot = await this.timeSlotRepository.findOneById(timeSlotId);
    if (!timeSlot) {
      throw new NotFoundException('Franja horaria no encontrada');
    }

    if (!timeSlot.isBlocked) {
      throw new BadRequestException('La franja horaria no está bloqueada');
    }

    const updatedTimeSlot = await this.timeSlotRepository.update(timeSlotId, {
      isBlocked: false,
      isAvailable: true,
      updatedBy: userId,
    });

    if (!updatedTimeSlot) {
      throw new NotFoundException('Error al desbloquear la franja horaria');
    }

    return updatedTimeSlot;
  }

  private async generateTimeSlotsForAvailability(availability: BarberAvailability, userId: string): Promise<void> {
    const today = new Date();
    const endDate = addDays(today, 90); // Generar slots para los próximos 90 días

    await this.generateTimeSlotsForDateRange(availability.barberId, today, endDate, userId);
  }

  private async regenerateTimeSlotsForAvailability(availability: BarberAvailability, userId: string): Promise<void> {
    // Eliminar slots futuros y regenerarlos
    await this.deleteFutureTimeSlotsForAvailability(availability, userId);
    await this.generateTimeSlotsForAvailability(availability, userId);
  }

  private async deleteFutureTimeSlotsForAvailability(availability: BarberAvailability, userId: string): Promise<void> {
    const today = new Date();
    
    // Obtener todos los time slots futuros para este barbero y día de la semana
    const futureSlots = await this.timeSlotRepository.findByBarberIdAndDateRange(
      availability.barberId,
      today,
      addDays(today, 365)
    );

    // Filtrar por día de la semana y horario
    const slotsToDelete = futureSlots.filter(slot => {
      const slotDayOfWeek = slot.date.getDay();
      return slotDayOfWeek === availability.dayOfWeek &&
             slot.startTime >= availability.startTime &&
             slot.endTime <= availability.endTime;
    });

    // Eliminar (soft delete) los slots
    for (const slot of slotsToDelete) {
      await this.timeSlotRepository.softDelete(slot.id, userId);
    }
  }

  private async createTimeSlotFromAvailability(availability: BarberAvailability, date: Date, userId: string): Promise<TimeSlot | undefined> {
    // Dividir la disponibilidad en slots de 30 minutos (ajustable)
    const slotDuration = 30; // minutos
    const startTime = this.parseTime(availability.startTime);
    const endTime = this.parseTime(availability.endTime);

    const slots: TimeSlot[] = [];
    let currentTime = startTime;

    while (currentTime < endTime) {
      const slotEndTime = new Date(currentTime.getTime() + slotDuration * 60000);
      
      if (slotEndTime <= endTime) {
        const slot = await this.timeSlotRepository.create({
          barberId: availability.barberId,
          date: new Date(date),
          startTime: this.formatTime(currentTime),
          endTime: this.formatTime(slotEndTime),
          isAvailable: true,
          isBooked: false,
          isBlocked: false,
          createdBy: userId,
          updatedBy: userId,
        });
        
        slots.push(slot);
      }

      currentTime = slotEndTime;
    }

    return slots.length > 0 ? slots[0] : undefined;
  }

  private isDateInAvailabilityRange(date: Date, availability: BarberAvailability): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    // Verificar que la fecha sea futura
    if (checkDate < today) {
      return false;
    }

    // Verificar que esté dentro del rango válido de la disponibilidad
    if (availability.validFrom && checkDate < availability.validFrom) {
      return false;
    }

    if (availability.validUntil && checkDate > availability.validUntil) {
      return false;
    }

    return true;
  }

  private parseTime(timeString: string): Date {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, seconds || 0, 0);
    return date;
  }

  private formatTime(date: Date): string {
    return format(date, 'HH:mm:ss');
  }
}