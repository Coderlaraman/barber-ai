import { Injectable, Logger } from '@nestjs/common'
import { BookingEventHandler } from '../services/event-handler'
import { 
  BookingCreatedEvent, 
  BookingCancelledEvent, 
  BookingRescheduledEvent,
  BookingConfirmedEvent 
} from '../events/booking-events'
import { EventFactory } from '../utils/event-factory'
import { EventBusService } from '../services/event-bus.service'

/**
 * Handler que convierte eventos de booking en notificaciones
 * Integra el sistema de eventos entre BookingService y NotificationService
 */
@Injectable()
export class BookingNotificationHandler extends BookingEventHandler<BookingCreatedEvent | BookingCancelledEvent | BookingRescheduledEvent | BookingConfirmedEvent> {
  protected readonly logger = new Logger(BookingNotificationHandler.name)

  constructor(private readonly eventBus: EventBusService) {
    super()
  }

  canHandle(eventType: string): boolean {
    return [
      'booking.created',
      'booking.cancelled',
      'booking.rescheduled',
      'booking.confirmed'
    ].includes(eventType)
  }

  protected async processEvent(event: BookingCreatedEvent | BookingCancelledEvent | BookingRescheduledEvent | BookingConfirmedEvent): Promise<void> {
    this.logger.log(`Procesando evento de booking para notificación: ${event.eventType}`)

    switch (event.eventType) {
      case 'booking.created':
        await this.handleBookingCreated(event as BookingCreatedEvent)
        break
      case 'booking.cancelled':
        await this.handleBookingCancelled(event as BookingCancelledEvent)
        break
      case 'booking.rescheduled':
        await this.handleBookingRescheduled(event as BookingRescheduledEvent)
        break
      case 'booking.confirmed':
        await this.handleBookingConfirmed(event as BookingConfirmedEvent)
        break
      default:
        this.logger.warn(`Tipo de evento no manejado: ${(event as any).eventType}`)
    }
  }

  /**
   * Maneja la creación de una cita - notifica al cliente y barbero
   */
  private async handleBookingCreated(event: BookingCreatedEvent): Promise<void> {
    const { payload } = event

    // Notificación al cliente
    const clientNotification = EventFactory.createNotificationSentEvent(
      `notif-client-${event.eventId}`,
      payload.clientId,
      'CLIENT',
      'EMAIL',
      'APPOINTMENT_CONFIRMED',
      'SENT',
      {
        bookingId: payload.appointmentId,
        barberId: payload.barberId,
        serviceId: payload.serviceId,
        date: payload.date,
        time: payload.startTime,
        message: `Tu cita ha sido confirmada para el ${payload.date} a las ${payload.startTime}`
      }
    )

    // Notificación al barbero
    const barberNotification = EventFactory.createNotificationSentEvent(
      `notif-barber-${event.eventId}`,
      payload.barberId,
      'BARBER',
      'PUSH',
      'APPOINTMENT_CONFIRMED',
      'SENT',
      {
        bookingId: payload.appointmentId,
        clientId: payload.clientId,
        serviceId: payload.serviceId,
        date: payload.date,
        time: payload.startTime,
        message: `Nueva cita programada para el ${payload.date} a las ${payload.startTime}`
      }
    )

    // Programar recordatorio (24 horas antes)
    const reminderDateTime = this.calculateReminderDateTime(payload.date, payload.startTime, 24)
    const reminderNotification = EventFactory.createNotificationScheduledEvent(
      `reminder-${event.eventId}`,
      payload.clientId,
      'CLIENT',
      'SMS',
      'APPOINTMENT_REMINDER',
      reminderDateTime,
      {
        bookingId: payload.appointmentId,
        reminderType: '24_HOURS',
        date: payload.date,
        time: payload.startTime
      }
    )

    // Publicar todas las notificaciones
    await Promise.all([
      this.eventBus.publish(clientNotification),
      this.eventBus.publish(barberNotification),
      this.eventBus.publish(reminderNotification)
    ])

    this.logger.log(`Notificaciones creadas para booking creado: ${payload.appointmentId}`)
  }

  /**
   * Maneja la cancelación de una cita - notifica a todas las partes
   */
  private async handleBookingCancelled(event: BookingCancelledEvent): Promise<void> {
    const { payload } = event

    // Notificación al cliente
    const clientNotification = EventFactory.createNotificationSentEvent(
      `notif-client-cancel-${event.eventId}`,
      payload.clientId,
      'CLIENT',
      'EMAIL',
      'BOOKING_CANCELLED',
      'SENT',
      {
        bookingId: payload.appointmentId,
        reason: payload.reason,
        cancelledBy: payload.cancelledBy,
        message: `Tu cita ha sido cancelada. Razón: ${payload.reason || 'No especificada'}`
      }
    )

    // Notificación al barbero
    const barberNotification = EventFactory.createNotificationSentEvent(
      `notif-barber-cancel-${event.eventId}`,
      payload.barberId,
      'BARBER',
      'PUSH',
      'BOOKING_CANCELLED',
      'SENT',
      {
        bookingId: payload.appointmentId,
        clientId: payload.clientId,
        reason: payload.reason,
        cancelledBy: payload.cancelledBy,
        message: `Cita cancelada por ${payload.cancelledBy}. Razón: ${payload.reason || 'No especificada'}`
      }
    )

    // Cancelar recordatorio programado
    const cancelReminderNotification = EventFactory.createNotificationSentEvent(
      `cancel-reminder-${event.eventId}`,
      payload.clientId,
      'CLIENT',
      'SMS',
      'APPOINTMENT_REMINDER',
      'SENT',
      {
        bookingId: payload.appointmentId,
        action: 'CANCEL_REMINDER',
        message: 'Recordatorio cancelado debido a cancelación de cita'
      }
    )

    await Promise.all([
      this.eventBus.publish(clientNotification),
      this.eventBus.publish(barberNotification),
      this.eventBus.publish(cancelReminderNotification)
    ])

    this.logger.log(`Notificaciones de cancelación enviadas para booking: ${payload.appointmentId}`)
  }

  /**
   * Maneja la reprogramación de una cita
   */
  private async handleBookingRescheduled(event: BookingRescheduledEvent): Promise<void> {
    const { payload } = event

    // Notificación al cliente con nueva información
    const clientNotification = EventFactory.createNotificationSentEvent(
      `notif-client-reschedule-${event.eventId}`,
      payload.clientId,
      'CLIENT',
      'EMAIL',
      'APPOINTMENT_CONFIRMED',
      'SENT',
      {
        bookingId: payload.appointmentId,
        oldDate: payload.previousDate,
        oldTime: payload.previousStartTime,
        newDate: payload.newDate,
        newTime: payload.newStartTime,
        reason: payload.reason,
        message: `Tu cita ha sido reprogramada de ${payload.previousDate} ${payload.previousStartTime} a ${payload.newDate} ${payload.newStartTime}`
      }
    )

    // Actualizar recordatorio
    const newReminderDateTime = this.calculateReminderDateTime(payload.newDate, payload.newStartTime, 24)
    const updatedReminderNotification = EventFactory.createNotificationScheduledEvent(
      `updated-reminder-${event.eventId}`,
      payload.clientId,
      'CLIENT',
      'SMS',
      'APPOINTMENT_REMINDER',
      newReminderDateTime,
      {
        bookingId: payload.appointmentId,
        reminderType: '24_HOURS',
        date: payload.newDate,
        time: payload.newStartTime,
        isRescheduled: true
      }
    )

    await Promise.all([
      this.eventBus.publish(clientNotification),
      this.eventBus.publish(updatedReminderNotification)
    ])

    this.logger.log(`Notificaciones de reprogramación enviadas para booking: ${payload.appointmentId}`)
  }

  /**
   * Maneja la confirmación de una cita
   */
  private async handleBookingConfirmed(event: BookingConfirmedEvent): Promise<void> {
    const { payload } = event

    // Notificación de confirmación al cliente
    const confirmationNotification = EventFactory.createNotificationSentEvent(
      `notif-confirmation-${event.eventId}`,
      payload.clientId,
      'CLIENT',
      'EMAIL',
      'APPOINTMENT_CONFIRMED',
      'SENT',
      {
        bookingId: payload.appointmentId,
        confirmedBy: payload.confirmedBy,
        message: 'Tu cita ha sido confirmada. Te esperamos!'
      }
    )

    await this.eventBus.publish(confirmationNotification)

    this.logger.log(`Notificación de confirmación enviada para booking: ${payload.appointmentId}`)
  }

  /**
   * Calcula la fecha/hora para un recordatorio
   */
  private calculateReminderDateTime(date: string, time: string, hoursBefore: number): string {
    const [year, month, day] = date.split('-').map(Number)
    const [hours, minutes] = time.split(':').map(Number)
    
    const appointmentDateTime = new Date(year, month - 1, day, hours, minutes)
    const reminderDateTime = new Date(appointmentDateTime.getTime() - hoursBefore * 60 * 60 * 1000)
    
    return reminderDateTime.toISOString()
  }
}