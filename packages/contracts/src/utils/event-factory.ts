import { v4 as uuidv4 } from 'uuid'
import { BaseEvent, DomainEvent, EventType } from '../events/base'
import { 
  BookingCreatedEvent, 
  BookingCancelledEvent, 
  BookingRescheduledEvent,
  BookingConfirmedEvent,
  BookingReminderSentEvent 
} from '../events/booking-events'
import { 
  NotificationSentEvent,
  NotificationFailedEvent,
  NotificationScheduledEvent 
} from '../events/notification-events'

/**
 * Factory para crear eventos de dominio de forma consistente
 */
export class EventFactory {
  /**
   * Crea un evento base con los campos requeridos
   */
  private static createBaseEvent(
    eventType: string,
    aggregateId: string,
    aggregateType: string,
    version: number = 1
  ): BaseEvent {
    return {
      eventId: uuidv4(),
      eventType,
      aggregateId,
      aggregateType,
      timestamp: new Date().toISOString(),
      version,
      metadata: {
        createdBy: 'system',
        source: 'event-factory',
        correlationId: uuidv4()
      }
    }
  }

  /**
   * Crea un evento de cita creada
   */
  static createBookingCreatedEvent(
    appointmentId: string,
    barberId: string,
    clientId: string,
    serviceId: string,
    startTime: string,
    endTime: string,
    date: string,
    price: number,
    notes?: string
  ): BookingCreatedEvent {
    const baseEvent = this.createBaseEvent(
      EventType.BOOKING_CREATED,
      appointmentId,
      'BOOKING'
    )

    return {
      ...baseEvent,
      eventType: EventType.BOOKING_CREATED,
      payload: {
        appointmentId,
        barberId,
        clientId,
        serviceId,
        startTime,
        endTime,
        date,
        price,
        notes
      }
    }
  }

  /**
   * Crea un evento de cita cancelada
   */
  static createBookingCancelledEvent(
    appointmentId: string,
    barberId: string,
    clientId: string,
    reason?: string,
    cancelledBy: 'CLIENT' | 'BARBER' | 'SYSTEM' = 'CLIENT'
  ): BookingCancelledEvent {
    const baseEvent = this.createBaseEvent(
      EventType.BOOKING_CANCELLED,
      appointmentId,
      'BOOKING'
    )

    return {
      ...baseEvent,
      eventType: EventType.BOOKING_CANCELLED,
      payload: {
        appointmentId,
        barberId,
        clientId,
        reason,
        cancelledBy,
        cancelledAt: new Date().toISOString()
      }
    }
  }

  /**
   * Crea un evento de cita reprogramada
   */
  static createBookingRescheduledEvent(
    appointmentId: string,
    barberId: string,
    clientId: string,
    oldStartTime: string,
    oldEndTime: string,
    oldDate: string,
    newStartTime: string,
    newEndTime: string,
    newDate: string,
    reason?: string
  ): BookingRescheduledEvent {
    const baseEvent = this.createBaseEvent(
      EventType.BOOKING_RESCHEDULED,
      appointmentId,
      'BOOKING'
    )

    return {
      ...baseEvent,
      eventType: EventType.BOOKING_RESCHEDULED,
      payload: {
        appointmentId,
        barberId,
        clientId,
        previousStartTime: oldStartTime,
        previousEndTime: oldEndTime,
        previousDate: oldDate,
        newStartTime,
        newEndTime,
        newDate,
        reason
      }
    }
  }

  /**
   * Crea un evento de cita confirmada
   */
  static createBookingConfirmedEvent(
    appointmentId: string,
    barberId: string,
    clientId: string,
    confirmedBy: 'CLIENT' | 'BARBER' | 'SYSTEM' = 'SYSTEM'
  ): BookingConfirmedEvent {
    const baseEvent = this.createBaseEvent(
      EventType.BOOKING_CONFIRMED,
      appointmentId,
      'BOOKING'
    )

    return {
      ...baseEvent,
      eventType: EventType.BOOKING_CONFIRMED,
      payload: {
        appointmentId,
        barberId,
        clientId,
        confirmedBy,
        confirmedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Crea un evento de recordatorio de cita enviado
   */
  static createBookingReminderSentEvent(
    appointmentId: string,
    barberId: string,
    clientId: string,
    reminderType: '24_HOURS' | '1_HOUR' | '15_MINUTES',
    sentVia: 'EMAIL' | 'SMS' | 'PUSH'
  ): BookingReminderSentEvent {
    const baseEvent = this.createBaseEvent(
      EventType.BOOKING_REMINDER_SENT,
      appointmentId,
      'BOOKING'
    )

    return {
      ...baseEvent,
      eventType: EventType.BOOKING_REMINDER_SENT,
      payload: {
        appointmentId,
        barberId,
        clientId,
        reminderType,
        channel: sentVia,
        sentAt: new Date().toISOString()
      }
    }
  }

  /**
   * Crea un evento de notificación enviada
   */
  static createNotificationSentEvent(
    notificationId: string,
    recipientId: string,
    recipientType: 'CLIENT' | 'BARBER' | 'ADMIN',
    channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP',
    type: 'APPOINTMENT_CONFIRMED' | 'APPOINTMENT_REMINDER' | 'BOOKING_CANCELLED' | 'REVIEW_REQUEST' | 'PROMOTION' | 'SYSTEM',
    status: 'SENT' | 'DELIVERED' | 'FAILED',
    metadata?: Record<string, any>
  ): NotificationSentEvent {
    const baseEvent = this.createBaseEvent(
      EventType.NOTIFICATION_SENT,
      notificationId,
      'NOTIFICATION'
    )

    return {
      ...baseEvent,
      eventType: EventType.NOTIFICATION_SENT,
      payload: {
        notificationId,
        recipientId,
        recipientType,
        channel,
        type,
        status,
        sentAt: new Date().toISOString(),
        metadata
      }
    }
  }

  /**
   * Crea un evento de notificación fallida
   */
  static createNotificationFailedEvent(
    notificationId: string,
    recipientId: string,
    recipientType: 'CLIENT' | 'BARBER' | 'ADMIN',
    channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP',
    type: 'APPOINTMENT_CONFIRMED' | 'APPOINTMENT_REMINDER' | 'BOOKING_CANCELLED' | 'REVIEW_REQUEST' | 'PROMOTION' | 'SYSTEM',
    error: string,
    retryCount: number = 0
  ): NotificationFailedEvent {
    const baseEvent = this.createBaseEvent(
      EventType.NOTIFICATION_FAILED,
      notificationId,
      'NOTIFICATION'
    )

    return {
      ...baseEvent,
      eventType: EventType.NOTIFICATION_FAILED,
      payload: {
        notificationId,
        recipientId,
        channel,
        type,
        error,
        retryCount,
        maxRetries: 3,
        failedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Crea un evento de notificación programada
   */
  static createNotificationScheduledEvent(
    notificationId: string,
    recipientId: string,
    recipientType: 'CLIENT' | 'BARBER' | 'ADMIN',
    channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP',
    type: 'APPOINTMENT_CONFIRMED' | 'APPOINTMENT_REMINDER' | 'BOOKING_CANCELLED' | 'REVIEW_REQUEST' | 'PROMOTION' | 'SYSTEM',
    scheduledFor: string,
    metadata?: Record<string, any>
  ): NotificationScheduledEvent {
    const baseEvent = this.createBaseEvent(
      EventType.NOTIFICATION_SCHEDULED,
      notificationId,
      'NOTIFICATION'
    )

    return {
      ...baseEvent,
      eventType: EventType.NOTIFICATION_SCHEDULED,
      payload: {
        notificationId,
        recipientId,
        channel,
        type,
        scheduledFor
      }
    }
  }
}