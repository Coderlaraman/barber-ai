import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Barber } from './barber.entity';

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

export enum ScheduleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SPECIAL = 'special', // Horario especial (feriados, eventos)
  TEMPORARY = 'temporary', // Temporal (vacaciones, etc.)
}

export enum ScheduleType {
  REGULAR = 'regular', // Horario regular semanal
  EXCEPTION = 'exception', // Excepción al horario regular
  OVERTIME = 'overtime', // Horas extra
}

@Entity('barber_schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: DayOfWeek })
  dayOfWeek: DayOfWeek;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'time', nullable: true })
  breakStartTime: string;

  @Column({ type: 'time', nullable: true })
  breakEndTime: string;

  @Column({ type: 'enum', enum: ScheduleStatus, default: ScheduleStatus.ACTIVE })
  status: ScheduleStatus;

  @Column({ type: 'enum', enum: ScheduleType, default: ScheduleType.REGULAR })
  type: ScheduleType;

  @Column({ type: 'integer', default: 60 })
  slotDuration: number; // Duración de cada franja en minutos

  @Column({ type: 'integer', default: 15 })
  bufferTime: number; // Tiempo entre citas en minutos

  @Column({ type: 'integer', nullable: true })
  maxAppointments: number; // Máximo de citas para este horario

  @Column({ type: 'date', nullable: true })
  specificDate: Date; // Para horarios específicos de un día

  @Column({ type: 'date', nullable: true })
  validFrom: Date; // Fecha desde cuando es válido este horario

  @Column({ type: 'date', nullable: true })
  validUntil: Date; // Fecha hasta cuando es válido este horario

  @Column({ type: 'jsonb', nullable: true })
  notes: Record<string, any>; // Notas adicionales

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean; // Si se repite semanalmente

  @Column({ type: 'jsonb', nullable: true })
  recurringPattern: Record<string, any>; // Patrón de recurrencia

  @Column({ type: 'boolean', default: true })
  allowsWalkIns: boolean; // Permite clientes sin cita

  @Column({ type: 'boolean', default: false })
  isEmergencySlot: boolean; // Es un horario de emergencia

  @Column({ type: 'integer', nullable: true })
  priority: number; // Prioridad del horario (para conflictos)

  @Column({ type: 'jsonb', nullable: true })
  restrictions: Record<string, any>; // Restricciones específicas

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relación con Barber
  @ManyToOne(() => Barber, (barber) => barber.schedules)
  @JoinColumn({ name: 'barberId' })
  barber: Barber;

  @Column()
  barberId: string;

  // Métodos de utilidad
  getTotalHours(): number {
    const start = this.timeToMinutes(this.startTime);
    const end = this.timeToMinutes(this.endTime);
    let totalMinutes = end - start;

    // Restar tiempo de descanso si existe
    if (this.breakStartTime && this.breakEndTime) {
      const breakStart = this.timeToMinutes(this.breakStartTime);
      const breakEnd = this.timeToMinutes(this.breakEndTime);
      totalMinutes -= (breakEnd - breakStart);
    }

    return totalMinutes / 60;
  }

  getAvailableSlots(): string[] {
    const slots: string[] = [];
    const start = this.timeToMinutes(this.startTime);
    const end = this.timeToMinutes(this.endTime);
    const slotDuration = this.slotDuration + this.bufferTime;

    let currentTime = start;
    while (currentTime + this.slotDuration <= end) {
      // Saltar el horario de descanso
      if (this.isBreakTime(currentTime)) {
        currentTime = this.timeToMinutes(this.breakEndTime!);
        continue;
      }

      slots.push(this.minutesToTime(currentTime));
      currentTime += slotDuration;
    }

    return slots;
  }

  isAvailableAt(time: string, date?: Date): boolean {
    if (this.status !== ScheduleStatus.ACTIVE) return false;

    // Verificar validez de fechas
    const now = date || new Date();
    if (this.validFrom && now < this.validFrom) return false;
    if (this.validUntil && now > this.validUntil) return false;

    // Verificar horario específico si existe
    if (this.specificDate && date) {
      const scheduleDate = new Date(this.specificDate);
      const checkDate = new Date(date);
      if (scheduleDate.toDateString() !== checkDate.toDateString()) {
        return false;
      }
    }

    const timeMinutes = this.timeToMinutes(time);
    const startMinutes = this.timeToMinutes(this.startTime);
    const endMinutes = this.timeToMinutes(this.endTime);

    if (timeMinutes < startMinutes || timeMinutes >= endMinutes) {
      return false;
    }

    // Verificar si es horario de descanso
    if (this.isBreakTime(timeMinutes)) {
      return false;
    }

    return true;
  }

  isBreakTime(timeMinutes: number): boolean {
    if (!this.breakStartTime || !this.breakEndTime) return false;
    
    const breakStart = this.timeToMinutes(this.breakStartTime);
    const breakEnd = this.timeToMinutes(this.breakEndTime);
    
    return timeMinutes >= breakStart && timeMinutes < breakEnd;
  }

  conflictsWith(other: Schedule): boolean {
    // Verificar si hay conflicto de horarios
    if (this.dayOfWeek !== other.dayOfWeek && !this.specificDate && !other.specificDate) {
      return false;
    }

    // Verificar superposición de horarios
    const thisStart = this.timeToMinutes(this.startTime);
    const thisEnd = this.timeToMinutes(this.endTime);
    const otherStart = this.timeToMinutes(other.startTime);
    const otherEnd = this.timeToMinutes(other.endTime);

    return (thisStart < otherEnd && thisEnd > otherStart);
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  getNextAvailableDate(fromDate: Date = new Date()): Date {
    const nextDate = new Date(fromDate);
    
    // Si es un horario específico
    if (this.specificDate) {
      return new Date(this.specificDate);
    }

    // Para horarios recurrentes
    if (this.isRecurring) {
      const daysOfWeek = [
        'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
      ];
      
      const targetDayIndex = daysOfWeek.indexOf(this.dayOfWeek);
      const currentDayIndex = nextDate.getDay();
      
      let daysUntilNext = targetDayIndex - currentDayIndex;
      if (daysUntilNext <= 0) daysUntilNext += 7;
      
      nextDate.setDate(nextDate.getDate() + daysUntilNext);
    }

    return nextDate;
  }

  clone(): Schedule {
    const cloned = new Schedule();
    Object.assign(cloned, this);
    cloned.id = undefined;
    cloned.createdAt = undefined;
    cloned.updatedAt = undefined;
    return cloned;
  }
}