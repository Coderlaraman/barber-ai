import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PaymentStatus } from './appointment.entity';
import { AppointmentStatus } from '../enums/appointment.enum';

export enum HistoryAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  PAYMENT_ADDED = 'PAYMENT_ADDED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  CONFIRMED = 'CONFIRMED',
  RATED = 'RATED',
  CHECKED_IN = 'CHECKED_IN',
  REMINDER_SENT = 'REMINDER_SENT',
  NO_SHOW = 'NO_SHOW',
  RESTORED = 'RESTORED',
  SOFT_DELETED = 'SOFT_DELETED',
}

@Entity('appointment_history')
@Index(['appointmentId', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['performedBy', 'createdAt'])
export class AppointmentHistory extends BaseEntity {
  @ApiProperty({ description: 'ID de la cita' })
  @Column({ name: 'appointment_id', type: 'uuid', nullable: false })
  appointmentId!: string;

  @ApiProperty({ description: 'Acción realizada' })
  @Column({ 
    name: 'action', 
    type: 'enum', 
    enum: HistoryAction, 
    nullable: false 
  })
  action!: HistoryAction;

  @ApiProperty({ description: 'ID del usuario que realizó la acción' })
  @Column({ name: 'performed_by', type: 'uuid', nullable: false })
  performedBy!: string;

  @ApiProperty({ description: 'ID del usuario que realizó el cambio', required: false })
  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changedBy?: string;

  @ApiProperty({ description: 'Nombre del usuario que realizó la acción' })
  @Column({ name: 'performed_by_name', type: 'varchar', length: 255, nullable: false })
  performedByName!: string;

  @ApiProperty({ description: 'Rol del usuario que realizó la acción' })
  @Column({ name: 'performed_by_role', type: 'varchar', length: 50, nullable: false })
  performedByRole!: string;

  @ApiProperty({ description: 'Estado anterior de la cita' })
  @Column({ 
    name: 'previous_status', 
    type: 'enum', 
    enum: AppointmentStatus, 
    nullable: true 
  })
  previousStatus?: AppointmentStatus;

  @ApiProperty({ description: 'Nuevo estado de la cita' })
  @Column({ 
    name: 'new_status', 
    type: 'enum', 
    enum: AppointmentStatus, 
    nullable: true 
  })
  newStatus?: AppointmentStatus;

  @ApiProperty({ description: 'Estado de pago anterior' })
  @Column({ 
    name: 'previous_payment_status', 
    type: 'enum', 
    enum: PaymentStatus, 
    nullable: true 
  })
  previousPaymentStatus?: PaymentStatus;

  @ApiProperty({ description: 'Nuevo estado de pago' })
  @Column({ 
    name: 'new_payment_status', 
    type: 'enum', 
    enum: PaymentStatus, 
    nullable: true 
  })
  newPaymentStatus?: PaymentStatus;

  @ApiProperty({ description: 'Monto anterior pagado' })
  @Column({ name: 'previous_paid_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  previousPaidAmount?: number;

  @ApiProperty({ description: 'Nuevo monto pagado' })
  @Column({ name: 'new_paid_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  newPaidAmount?: number;

  @ApiProperty({ description: 'Fecha anterior de la cita' })
  @Column({ name: 'previous_appointment_date', type: 'date', nullable: true })
  previousAppointmentDate?: Date;

  @ApiProperty({ description: 'Nueva fecha de la cita' })
  @Column({ name: 'new_appointment_date', type: 'date', nullable: true })
  newAppointmentDate?: Date;

  @ApiProperty({ description: 'Hora de inicio anterior' })
  @Column({ name: 'previous_start_time', type: 'time', nullable: true })
  previousStartTime?: string;

  @ApiProperty({ description: 'Nueva hora de inicio' })
  @Column({ name: 'new_start_time', type: 'time', nullable: true })
  newStartTime?: string;

  @ApiProperty({ description: 'Hora de fin anterior' })
  @Column({ name: 'previous_end_time', type: 'time', nullable: true })
  previousEndTime?: string;

  @ApiProperty({ description: 'Nueva hora de fin' })
  @Column({ name: 'new_end_time', type: 'time', nullable: true })
  newEndTime?: string;

  @ApiProperty({ description: 'ID del barbero anterior' })
  @Column({ name: 'previous_barber_id', type: 'uuid', nullable: true })
  previousBarberId?: string;

  @ApiProperty({ description: 'ID del nuevo barbero' })
  @Column({ name: 'new_barber_id', type: 'uuid', nullable: true })
  newBarberId?: string;

  @ApiProperty({ description: 'ID del servicio anterior' })
  @Column({ name: 'previous_service_id', type: 'uuid', nullable: true })
  previousServiceId?: string;

  @ApiProperty({ description: 'ID del nuevo servicio' })
  @Column({ name: 'new_service_id', type: 'uuid', nullable: true })
  newServiceId?: string;

  @ApiProperty({ description: 'Razón de cancelación anterior' })
  @Column({ name: 'previous_cancellation_reason', type: 'varchar', length: 500, nullable: true })
  previousCancellationReason?: string;

  @ApiProperty({ description: 'Nueva razón de cancelación' })
  @Column({ name: 'new_cancellation_reason', type: 'varchar', length: 500, nullable: true })
  newCancellationReason?: string;

  @ApiProperty({ description: 'Notas del cliente anteriores' })
  @Column({ name: 'previous_client_notes', type: 'text', nullable: true })
  previousClientNotes?: string;

  @ApiProperty({ description: 'Nuevas notas del cliente' })
  @Column({ name: 'new_client_notes', type: 'text', nullable: true })
  newClientNotes?: string;

  @ApiProperty({ description: 'Notas del barbero anteriores' })
  @Column({ name: 'previous_barber_notes', type: 'text', nullable: true })
  previousBarberNotes?: string;

  @ApiProperty({ description: 'Nuevas notas del barbero' })
  @Column({ name: 'new_barber_notes', type: 'text', nullable: true })
  newBarberNotes?: string;

  @ApiProperty({ description: 'Calificación anterior del cliente' })
  @Column({ name: 'previous_client_rating', type: 'integer', nullable: true })
  previousClientRating?: number;

  @ApiProperty({ description: 'Nueva calificación del cliente' })
  @Column({ name: 'new_client_rating', type: 'integer', nullable: true })
  newClientRating?: number;

  @ApiProperty({ description: 'Comentarios anteriores del cliente' })
  @Column({ name: 'previous_client_feedback', type: 'text', nullable: true })
  previousClientFeedback?: string;

  @ApiProperty({ description: 'Nuevos comentarios del cliente' })
  @Column({ name: 'new_client_feedback', type: 'text', nullable: true })
  newClientFeedback?: string;

  @ApiProperty({ description: 'Precio total anterior' })
  @Column({ name: 'previous_total_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  previousTotalPrice?: number;

  @ApiProperty({ description: 'Nuevo precio total' })
  @Column({ name: 'new_total_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  newTotalPrice?: number;

  @ApiProperty({ description: 'Comentarios adicionales sobre el cambio' })
  @Column({ name: 'change_comments', type: 'text', nullable: true })
  changeComments?: string;

  @ApiProperty({ description: 'IP desde donde se realizó la acción' })
  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @ApiProperty({ description: 'Agente de usuario del navegador' })
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @ApiProperty({ description: 'Dispositivo desde donde se realizó la acción' })
  @Column({ name: 'device_info', type: 'varchar', length: 255, nullable: true })
  deviceInfo?: string;

  static createHistoryEntry(
    appointmentId: string,
    action: HistoryAction,
    performedBy: string,
    performedByName: string,
    performedByRole: string,
    changes: Partial<AppointmentHistory> = {},
  ): AppointmentHistory {
    const history = new AppointmentHistory();
    history.appointmentId = appointmentId;
    history.action = action;
    history.performedBy = performedBy;
    history.performedByName = performedByName;
    history.performedByRole = performedByRole;
    
    Object.assign(history, changes);
    
    return history;
  }

  getChangeSummary(): string {
    const changes = [];
    
    if (this.previousStatus !== undefined && this.newStatus !== undefined) {
      changes.push(`Status: ${this.previousStatus} → ${this.newStatus}`);
    }
    
    if (this.previousPaymentStatus !== undefined && this.newPaymentStatus !== undefined) {
      changes.push(`Payment: ${this.previousPaymentStatus} → ${this.newPaymentStatus}`);
    }
    
    if (this.previousAppointmentDate !== undefined && this.newAppointmentDate !== undefined) {
      changes.push(`Date: ${this.previousAppointmentDate} → ${this.newAppointmentDate}`);
    }
    
    if (this.previousStartTime !== undefined && this.newStartTime !== undefined) {
      changes.push(`Start time: ${this.previousStartTime} → ${this.newStartTime}`);
    }
    
    if (this.previousBarberId !== undefined && this.newBarberId !== undefined) {
      changes.push(`Barber: ${this.previousBarberId} → ${this.newBarberId}`);
    }
    
    if (this.previousServiceId !== undefined && this.newServiceId !== undefined) {
      changes.push(`Service: ${this.previousServiceId} → ${this.newServiceId}`);
    }
    
    return changes.length > 0 ? changes.join(', ') : 'No significant changes';
  }
}