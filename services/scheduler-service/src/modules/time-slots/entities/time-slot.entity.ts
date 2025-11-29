import {
  Entity,
  Column,
  Index,
  Unique,
  Check,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BarberAvailability } from '../../availability/entities/barber-availability.entity';

export enum TimeSlotStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  BLOCKED = 'BLOCKED',
  BREAK = 'BREAK',
  UNAVAILABLE = 'UNAVAILABLE',
}

export enum BlockReason {
  BARBER_UNAVAILABLE = 'BARBER_UNAVAILABLE',
  CLIENT_CANCELLED = 'CLIENT_CANCELLED',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  EMERGENCY = 'EMERGENCY',
  VACATION = 'VACATION',
  SICK_LEAVE = 'SICK_LEAVE',
  OTHER = 'OTHER',
}

@Entity('time_slots')
@Unique(['barberId', 'date', 'startTime'])
@Check('end_time > start_time')
@Check('duration_minutes > 0')
@Index(['barberId', 'date', 'status'])
@Index(['date', 'startTime'])
@Index(['status', 'date'])
@Index(['availabilityId', 'date'])
export class TimeSlot extends BaseEntity {
  @ApiProperty({ description: 'ID del barbero' })
  @Column({ name: 'barber_id', type: 'uuid', nullable: false })
  barberId!: string;

  @ApiProperty({ description: 'ID de la disponibilidad' })
  @Column({ name: 'availability_id', type: 'uuid', nullable: false })
  availabilityId!: string;

  @ApiProperty({ description: 'Fecha del slot' })
  @Column({ name: 'date', type: 'date', nullable: false })
  date!: Date;

  @ApiProperty({ description: 'Hora de inicio' })
  @Column({ name: 'start_time', type: 'time', nullable: false })
  startTime!: string;

  @ApiProperty({ description: 'Hora de fin' })
  @Column({ name: 'end_time', type: 'time', nullable: false })
  endTime!: string;

  @ApiProperty({ description: 'Duración en minutos' })
  @Column({ name: 'duration_minutes', type: 'integer', nullable: false })
  durationMinutes!: number;

  @ApiProperty({ description: 'Estado del slot' })
  @Column({ 
    name: 'status', 
    type: 'enum', 
    enum: TimeSlotStatus, 
    default: TimeSlotStatus.AVAILABLE,
    nullable: false 
  })
  status!: TimeSlotStatus;

  @ApiProperty({ description: 'ID de la cita (si está reservado)' })
  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  appointmentId?: string;

  @ApiProperty({ description: 'ID del cliente (si está reservado)' })
  @Column({ name: 'client_id', type: 'uuid', nullable: true })
  clientId?: string;

  @ApiProperty({ description: 'Razón del bloqueo' })
  @Column({ 
    name: 'block_reason', 
    type: 'enum', 
    enum: BlockReason, 
    nullable: true 
  })
  blockReason?: BlockReason;

  @ApiProperty({ description: 'Descripción del bloqueo' })
  @Column({ name: 'block_description', type: 'text', nullable: true })
  blockDescription?: string;

  @ApiProperty({ description: 'Quién bloqueó el slot' })
  @Column({ name: 'blocked_by', type: 'uuid', nullable: true })
  blockedBy?: string;

  @ApiProperty({ description: 'Fecha y hora del bloqueo' })
  @Column({ name: 'blocked_at', type: 'timestamptz', nullable: true })
  blockedAt?: Date;

  @ApiProperty({ description: 'Precio del servicio (si aplica)' })
  @Column({ name: 'service_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  servicePrice?: number;

  @ApiProperty({ description: 'ID del servicio (si aplica)' })
  @Column({ name: 'service_id', type: 'uuid', nullable: true })
  serviceId?: string;

  @ApiProperty({ description: 'Nombre del servicio (para referencia rápida)' })
  @Column({ name: 'service_name', type: 'varchar', length: 100, nullable: true })
  serviceName?: string;

  @ApiProperty({ description: 'Duración del servicio en minutos' })
  @Column({ name: 'service_duration', type: 'integer', nullable: true })
  serviceDuration?: number;

  @ApiProperty({ description: 'Notas adicionales' })
  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @ApiProperty({ description: 'Indica si es un slot de descanso' })
  @Column({ name: 'is_break', type: 'boolean', default: false, nullable: false })
  isBreak!: boolean;

  @ApiProperty({ description: 'Indica si el slot puede ser sobrescrito por administradores' })
  @Column({ name: 'can_override', type: 'boolean', default: false, nullable: false })
  canOverride!: boolean;

  @ApiProperty({ description: 'Prioridad del slot (mayor número = mayor prioridad)' })
  @Column({ name: 'priority', type: 'integer', default: 0, nullable: false })
  priority!: number;

  @ManyToOne(() => BarberAvailability)
  @JoinColumn({ name: 'availability_id' })
  availability!: BarberAvailability;

  isAvailable(): boolean {
    return this.status === TimeSlotStatus.AVAILABLE && this.isActive;
  }

  isBooked(): boolean {
    return this.status === TimeSlotStatus.BOOKED;
  }

  isBlocked(): boolean {
    return this.status === TimeSlotStatus.BLOCKED;
  }

  canBeBooked(): boolean {
    return this.isAvailable() && !this.appointmentId && !this.clientId;
  }

  canBeBlocked(): boolean {
    return !this.isBooked();
  }

  canBeUnblocked(): boolean {
    return this.isBlocked() && this.canOverride;
  }

  overlapsWith(otherSlot: TimeSlot): boolean {
    if (this.date.getTime() !== otherSlot.date.getTime()) {
      return false;
    }
    
    const thisStart = this.timeToMinutes(this.startTime);
    const thisEnd = this.timeToMinutes(this.endTime);
    const otherStart = this.timeToMinutes(otherSlot.startTime);
    const otherEnd = this.timeToMinutes(otherSlot.endTime);
    
    return thisStart < otherEnd && thisEnd > otherStart;
  }

  book(appointmentId: string, clientId: string, serviceId: string, serviceName: string, serviceDuration: number, servicePrice: number): void {
    if (!this.canBeBooked()) {
      throw new Error('Time slot is not available for booking');
    }
    
    this.status = TimeSlotStatus.BOOKED;
    this.appointmentId = appointmentId;
    this.clientId = clientId;
    this.serviceId = serviceId;
    this.serviceName = serviceName;
    this.serviceDuration = serviceDuration;
    this.servicePrice = servicePrice;
  }

  cancelBooking(): void {
    if (!this.isBooked()) {
      throw new Error('Time slot is not booked');
    }
    
    this.status = TimeSlotStatus.AVAILABLE;
    this.appointmentId = undefined;
    this.clientId = undefined;
    this.serviceId = undefined;
    this.serviceName = undefined;
    this.serviceDuration = undefined;
    this.servicePrice = undefined;
  }

  block(reason: BlockReason, description: string, blockedBy: string, canOverride: boolean = false): void {
    if (!this.canBeBlocked()) {
      throw new Error('Time slot cannot be blocked');
    }
    
    this.status = TimeSlotStatus.BLOCKED;
    this.blockReason = reason;
    this.blockDescription = description;
    this.blockedBy = blockedBy;
    this.blockedAt = new Date();
    this.canOverride = canOverride;
  }

  unblock(): void {
    if (!this.isBlocked()) {
      throw new Error('Time slot is not blocked');
    }
    
    this.status = TimeSlotStatus.AVAILABLE;
    this.blockReason = undefined;
    this.blockDescription = undefined;
    this.blockedBy = undefined;
    this.blockedAt = undefined;
    this.canOverride = false;
  }

  markAsBreak(): void {
    if (!this.isAvailable()) {
      throw new Error('Only available time slots can be marked as break');
    }
    
    this.status = TimeSlotStatus.BREAK;
    this.isBreak = true;
  }

  removeBreak(): void {
    if (this.status !== TimeSlotStatus.BREAK) {
      throw new Error('Time slot is not marked as break');
    }
    
    this.status = TimeSlotStatus.AVAILABLE;
    this.isBreak = false;
  }

  updateServiceInfo(serviceId: string, serviceName: string, serviceDuration: number, servicePrice: number): void {
    this.serviceId = serviceId;
    this.serviceName = serviceName;
    this.serviceDuration = serviceDuration;
    this.servicePrice = servicePrice;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  getStartDateTime(): Date {
    return new Date(`${this.date.toISOString().split('T')[0]}T${this.startTime}`);
  }

  getEndDateTime(): Date {
    return new Date(`${this.date.toISOString().split('T')[0]}T${this.endTime}`);
  }

  isInThePast(): boolean {
    const now = new Date();
    const slotEnd = this.getEndDateTime();
    return slotEnd < now;
  }

  isUpcoming(): boolean {
    const now = new Date();
    const slotStart = this.getStartDateTime();
    return slotStart > now;
  }

  isCurrent(): boolean {
    const now = new Date();
    const slotStart = this.getStartDateTime();
    const slotEnd = this.getEndDateTime();
    return now >= slotStart && now <= slotEnd;
  }

  getTimeUntilStart(): number {
    const now = new Date();
    const slotStart = this.getStartDateTime();
    return slotStart.getTime() - now.getTime();
  }

  getTimeUntilEnd(): number {
    const now = new Date();
    const slotEnd = this.getEndDateTime();
    return slotEnd.getTime() - now.getTime();
  }
}