import { Entity, Column, Index, Check, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

export enum AvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
  LIMITED = 'LIMITED',
  EMERGENCY_ONLY = 'EMERGENCY_ONLY',
}

/**
 * Entidad que representa la disponibilidad semanal de un barbero
 * Permite definir horarios de trabajo recurrentes por día de la semana
 */
@Entity('barber_availability')
@Index(['barberId', 'dayOfWeek', 'isActive'])
@Index(['startTime', 'endTime'])
@Unique(['barberId', 'dayOfWeek', 'startTime'])
@Check('end_time > start_time')
@Check('day_of_week >= 0 AND day_of_week <= 6')
export class BarberAvailability extends BaseEntity {
  @Column({
    name: 'barber_id',
    type: 'uuid',
    nullable: false,
    comment: 'ID del barbero',
  })
  barberId!: string;

  @Column({
    name: 'day_of_week',
    type: 'integer',
    nullable: false,
    comment: 'Día de la semana (0=Domingo, 6=Sábado)',
  })
  dayOfWeek!: DayOfWeek;

  @Column({
    name: 'start_time',
    type: 'time',
    nullable: false,
    comment: 'Hora de inicio de disponibilidad',
  })
  startTime!: string;

  @Column({
    name: 'end_time',
    type: 'time',
    nullable: false,
    comment: 'Hora de fin de disponibilidad',
  })
  endTime!: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: AvailabilityStatus,
    default: AvailabilityStatus.AVAILABLE,
    comment: 'Estado de disponibilidad',
  })
  status!: AvailabilityStatus;

  @Column({
    name: 'slot_duration_minutes',
    type: 'integer',
    default: 30,
    comment: 'Duración de cada slot de tiempo en minutos',
  })
  slotDurationMinutes!: number;

  @Column({
    name: 'buffer_time_minutes',
    type: 'integer',
    default: 5,
    comment: 'Tiempo de buffer entre slots en minutos',
  })
  bufferTimeMinutes!: number;

  @Column({
    name: 'max_appointments_per_slot',
    type: 'integer',
    default: 1,
    comment: 'Máximo número de citas por slot (para servicios grupales)',
  })
  maxAppointmentsPerSlot!: number;

  @Column({
    name: 'is_recurring',
    type: 'boolean',
    default: true,
    comment: 'Indica si esta disponibilidad es recurrente semanalmente',
  })
  isRecurring!: boolean;

  @Column({
    name: 'effective_from',
    type: 'date',
    nullable: true,
    comment: 'Fecha desde la cual es efectiva esta disponibilidad',
  })
  effectiveFrom?: Date;

  @Column({
    name: 'effective_until',
    type: 'date',
    nullable: true,
    comment: 'Fecha hasta la cual es efectiva esta disponibilidad',
  })
  effectiveUntil?: Date;

  @Column({
    name: 'valid_from',
    type: 'date',
    nullable: true,
    comment: 'Fecha desde la cual es válida esta disponibilidad',
  })
  validFrom?: Date;

  @Column({
    name: 'valid_until',
    type: 'date',
    nullable: true,
    comment: 'Fecha hasta la cual es válida esta disponibilidad',
  })
  validUntil?: Date;

  @Column({
    name: 'notes',
    type: 'text',
    nullable: true,
    comment: 'Notas adicionales sobre esta disponibilidad',
  })
  notes?: string;

  /**
   * Verifica si esta disponibilidad es efectiva en una fecha dada
   */
  isEffectiveOn(date: Date): boolean {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    if (this.effectiveFrom) {
      const fromDate = new Date(this.effectiveFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (checkDate < fromDate) return false;
    }

    if (this.effectiveUntil) {
      const untilDate = new Date(this.effectiveUntil);
      untilDate.setHours(23, 59, 59, 999);
      if (checkDate > untilDate) return false;
    }

    return true;
  }

  /**
   * Verifica si un día de la semana coincide con esta disponibilidad
   */
  matchesDayOfWeek(date: Date): boolean {
    return date.getDay() === this.dayOfWeek;
  }

  /**
   * Calcula la duración total en minutos
   */
  getDurationInMinutes(): number {
    const [startHour, startMinute] = this.startTime.split(':').map(Number);
    const [endHour, endMinute] = this.endTime.split(':').map(Number);
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    
    return endTotalMinutes - startTotalMinutes;
  }

  /**
   * Genera slots de tiempo disponibles
   */
  generateTimeSlots(): string[] {
    const slots: string[] = [];
    const duration = this.getDurationInMinutes();
    const totalSlots = Math.floor(duration / (this.slotDurationMinutes + this.bufferTimeMinutes));
    
    const [startHour, startMinute] = this.startTime.split(':').map(Number);
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    for (let i = 0; i < totalSlots; i++) {
      const slotStart = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      slots.push(slotStart);
      
      // Avanzar al siguiente slot
      currentMinute += this.slotDurationMinutes + this.bufferTimeMinutes;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }
    
    return slots;
  }

  /**
   * Verifica si un horario específico está dentro de esta disponibilidad
   */
  containsTime(time: string): boolean {
    return time >= this.startTime && time < this.endTime;
  }

  /**
   * Verifica si hay solapamiento con otra disponibilidad
   */
  overlapsWith(other: BarberAvailability): boolean {
    if (this.dayOfWeek !== other.dayOfWeek) return false;
    
    return (
      (this.startTime < other.endTime && this.endTime > other.startTime) ||
      (other.startTime < this.endTime && other.endTime > this.startTime)
    );
  }

  /**
   * Obtiene representación legible del día de la semana
   */
  getDayName(): string {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dayNames[this.dayOfWeek];
  }
}