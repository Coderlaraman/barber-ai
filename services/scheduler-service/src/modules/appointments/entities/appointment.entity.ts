import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  Check,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Service } from '../../services/entities/service.entity';
import { AppointmentStatus, AppointmentType } from '../enums/appointment.enum';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

@Entity('appointments')
@Unique(['barberId', 'appointmentDate', 'startTime'])
@Check('end_time > start_time')
@Check('total_price >= 0')
@Index(['clientId', 'appointmentDate'])
@Index(['barberId', 'appointmentDate'])
@Index(['status', 'appointmentDate'])
@Index(['appointmentDate', 'startTime'])
export class Appointment extends BaseEntity {
  @ApiProperty({ description: 'ID del cliente' })
  @Column({ name: 'client_id', type: 'uuid', nullable: false })
  clientId!: string;

  @ApiProperty({ description: 'ID del barbero' })
  @Column({ name: 'barber_id', type: 'uuid', nullable: false })
  barberId!: string;

  @ApiProperty({ description: 'ID de la sucursal' })
  @Column({ name: 'branch_id', type: 'uuid', nullable: false })
  branchId!: string;

  @ApiProperty({ description: 'Fecha de la cita' })
  @Column({ name: 'appointment_date', type: 'date', nullable: false })
  appointmentDate!: Date;

  @ApiProperty({ description: 'Hora de inicio' })
  @Column({ name: 'start_time', type: 'time', nullable: false })
  startTime!: string;

  @ApiProperty({ description: 'Hora de fin' })
  @Column({ name: 'end_time', type: 'time', nullable: false })
  endTime!: string;

  @ApiProperty({ description: 'Estado de la cita' })
  @Column({ 
    name: 'status', 
    type: 'enum', 
    enum: AppointmentStatus, 
    default: AppointmentStatus.PENDING,
    nullable: false 
  })
  status!: AppointmentStatus;

  @ApiProperty({ description: 'Tipo de cita' })
  @Column({ 
    name: 'type', 
    type: 'enum', 
    enum: AppointmentType, 
    nullable: false 
  })
  type!: AppointmentType;

  @ApiProperty({ description: 'Estado del pago' })
  @Column({ 
    name: 'payment_status', 
    type: 'enum', 
    enum: PaymentStatus, 
    default: PaymentStatus.PENDING,
    nullable: false 
  })
  paymentStatus!: PaymentStatus;

  @ApiProperty({ description: 'Precio total de la cita' })
  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2, nullable: false })
  totalPrice!: number;

  @ApiProperty({ description: 'Monto pagado' })
  @Column({ name: 'paid_amount', type: 'decimal', precision: 10, scale: 2, default: 0, nullable: false })
  paidAmount!: number;

  @ApiProperty({ description: 'Notas del cliente' })
  @Column({ name: 'client_notes', type: 'text', nullable: true })
  clientNotes?: string;

  @ApiProperty({ description: 'Notas internas del barbero' })
  @Column({ name: 'barber_notes', type: 'text', nullable: true })
  barberNotes?: string;

  @ApiProperty({ description: 'Motivo de cancelación' })
  @Column({ name: 'cancellation_reason', type: 'varchar', length: 500, nullable: true })
  cancellationReason?: string;

  @ApiProperty({ description: 'Quién canceló la cita' })
  @Column({ name: 'cancelled_by', type: 'uuid', nullable: true })
  cancelledBy?: string;

  @ApiProperty({ description: 'Fecha y hora de cancelación' })
  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt?: Date;

  @ApiProperty({ description: 'Recordatorio enviado' })
  @Column({ name: 'reminder_sent', type: 'boolean', default: false, nullable: false })
  reminderSent!: boolean;

  @ApiProperty({ description: 'Fecha y hora del recordatorio' })
  @Column({ name: 'reminder_sent_at', type: 'timestamptz', nullable: true })
  reminderSentAt?: Date;

  @ApiProperty({ description: 'Check-in realizado' })
  @Column({ name: 'checked_in', type: 'boolean', default: false, nullable: false })
  checkedIn!: boolean;

  @ApiProperty({ description: 'Fecha y hora del check-in' })
  @Column({ name: 'checked_in_at', type: 'timestamptz', nullable: true })
  checkedInAt?: Date;

  @ApiProperty({ description: 'Calificación del cliente' })
  @Column({ name: 'client_rating', type: 'integer', nullable: true })
  clientRating?: number;

  @ApiProperty({ description: 'Comentarios del cliente sobre el servicio' })
  @Column({ name: 'client_feedback', type: 'text', nullable: true })
  clientFeedback?: string;

  @ManyToOne(() => Service, { eager: true })
  @JoinColumn({ name: 'service_id' })
  service!: Service;

  @ApiProperty({ description: 'ID del servicio' })
  @Column({ name: 'service_id', type: 'uuid', nullable: false })
  serviceId!: string;

  @ApiProperty({ description: 'ID de la franja horaria', required: false })
  @Column({ name: 'time_slot_id', type: 'uuid', nullable: true })
  timeSlotId?: string;



  @ApiProperty({ description: 'Notas adicionales', required: false })
  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  isUpcoming(): boolean {
    const now = new Date();
    const appointmentDateTime = new Date(`${this.appointmentDate.toISOString().split('T')[0]}T${this.startTime}`);
    return appointmentDateTime > now && this.status === AppointmentStatus.CONFIRMED;
  }

  isPast(): boolean {
    const now = new Date();
    const appointmentDateTime = new Date(`${this.appointmentDate.toISOString().split('T')[0]}T${this.endTime}`);
    return appointmentDateTime < now;
  }

  isInProgress(): boolean {
    const now = new Date();
    const appointmentStart = new Date(`${this.appointmentDate.toISOString().split('T')[0]}T${this.startTime}`);
    const appointmentEnd = new Date(`${this.appointmentDate.toISOString().split('T')[0]}T${this.endTime}`);
    return now >= appointmentStart && now <= appointmentEnd && this.status === AppointmentStatus.IN_PROGRESS;
  }

  canBeCancelled(): boolean {
    return [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED].includes(this.status);
  }

  canBeModified(): boolean {
    return [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED].includes(this.status);
  }

  isFullyPaid(): boolean {
    return this.paidAmount >= this.totalPrice;
  }

  getRemainingAmount(): number {
    return Math.max(0, this.totalPrice - this.paidAmount);
  }

  getDurationInMinutes(): number {
    const [startHour, startMinute] = this.startTime.split(':').map(Number);
    const [endHour, endMinute] = this.endTime.split(':').map(Number);
    return (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  }

  async confirm(userId?: string): Promise<void> {
    if (this.status !== AppointmentStatus.PENDING) {
      throw new Error('Only pending appointments can be confirmed');
    }
    this.status = AppointmentStatus.CONFIRMED;
    await this.updateAuditFields(userId);
  }

  async start(userId?: string): Promise<void> {
    if (this.status !== AppointmentStatus.CONFIRMED) {
      throw new Error('Only confirmed appointments can be started');
    }
    this.status = AppointmentStatus.IN_PROGRESS;
    await this.updateAuditFields(userId);
  }

  async complete(userId?: string): Promise<void> {
    if (this.status !== AppointmentStatus.IN_PROGRESS) {
      throw new Error('Only in-progress appointments can be completed');
    }
    this.status = AppointmentStatus.COMPLETED;
    await this.updateAuditFields(userId);
  }

  async cancel(reason: string, cancelledBy: string): Promise<void> {
    if (!this.canBeCancelled()) {
      throw new Error(`Appointment with status ${this.status} cannot be cancelled`);
    }
    this.status = AppointmentStatus.CANCELLED;
    this.cancellationReason = reason;
    this.cancelledBy = cancelledBy;
    this.cancelledAt = new Date();
    await this.updateAuditFields(cancelledBy);
  }

  async markAsNoShow(userId?: string): Promise<void> {
    if (this.status !== AppointmentStatus.CONFIRMED) {
      throw new Error('Only confirmed appointments can be marked as no-show');
    }
    this.status = AppointmentStatus.NO_SHOW;
    await this.updateAuditFields(userId);
  }

  async addPayment(amount: number): Promise<void> {
    if (amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }
    this.paidAmount += amount;
    if (this.isFullyPaid()) {
      this.paymentStatus = PaymentStatus.PAID;
    } else {
      this.paymentStatus = PaymentStatus.PARTIAL;
    }
  }

  async addRating(rating: number, feedback?: string): Promise<void> {
    if (this.status !== AppointmentStatus.COMPLETED) {
      throw new Error('Only completed appointments can be rated');
    }
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    this.clientRating = rating;
    if (feedback) {
      this.clientFeedback = feedback;
    }
  }

  async checkIn(): Promise<void> {
    if (![AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING].includes(this.status)) {
      throw new Error('Only pending or confirmed appointments can be checked in');
    }
    this.checkedIn = true;
    this.checkedInAt = new Date();
  }

  async sendReminder(): Promise<void> {
    if (this.reminderSent) {
      throw new Error('Reminder already sent for this appointment');
    }
    this.reminderSent = true;
    this.reminderSentAt = new Date();
  }
}