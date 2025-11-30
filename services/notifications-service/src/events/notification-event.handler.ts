import { Injectable, Logger } from '@nestjs/common'
import { EventHandler } from 'contracts'
import { DomainEvent } from 'contracts'
import { NotificationService } from '../modules/notifications/services/notification.service'
import { NotificationType, NotificationChannel } from '../modules/notifications/enums/notification.enum'

@Injectable()
export class NotificationEventHandler extends EventHandler<DomainEvent> {
  constructor(private readonly notificationService: NotificationService) {
    super()
  }

  canHandle(eventType: string): boolean {
    const handleableEvents = [
      'booking.created',
      'booking.confirmed',
      'booking.cancelled',
      'booking.rescheduled',
      'booking.completed',
      'payment.confirmed',
      'payment.failed',
      'user.registered',
      'user.verified',
      'review.created'
    ]
    
    return handleableEvents.includes(eventType)
  }

  async processEvent(event: DomainEvent): Promise<void> {
    // Mapear eventos a tipos de notificación
    const notificationData = this.mapEventToNotification(event)
    
    if (notificationData) {
      // Crear notificación
      const notification = await this.notificationService.createNotification({
        userId: notificationData.userId,
        type: notificationData.type,
        channel: notificationData.channel,
        title: notificationData.title,
        content: notificationData.content,
        metadata: {
          ...notificationData.metadata,
          eventId: event.eventId,
          eventType: event.eventType,
          aggregateId: event.aggregateId,
          timestamp: event.timestamp
        }
      })

      // Enviar notificación
      const results = await this.notificationService.sendNotification(notification)
      
      // Log resultados
      results.forEach(result => {
        if (result.success) {
          this.logger.log(`Notificación enviada exitosamente por ${result.channel}: ${result.messageId}`)
        } else {
          this.logger.error(`Fallo al enviar notificación por ${result.channel}: ${result.error}`)
        }
      })
    }
  }

  private mapEventToNotification(event: DomainEvent): {
    userId: string
    type: NotificationType
    channel: NotificationChannel
    title: string
    content: string
    metadata?: any
  } | null {
    
    switch (event.eventType) {
      case 'booking.created':
        return {
          userId: event.payload.clientId || event.payload.userId,
          type: NotificationType.APPOINTMENT_CONFIRMED,
          channel: NotificationChannel.EMAIL,
          title: 'Cita Agendada',
          content: `Tu cita para el ${event.payload.date} a las ${event.payload.startTime} ha sido confirmada.`,
          metadata: {
            bookingId: event.aggregateId,
            barberId: event.payload.barberId,
            serviceId: event.payload.serviceId,
            date: event.payload.date,
            startTime: event.payload.startTime,
            endTime: event.payload.endTime,
            price: event.payload.price
          }
        }

      case 'booking.confirmed':
        return {
          userId: event.payload.clientId || event.payload.userId,
          type: NotificationType.APPOINTMENT_CONFIRMED,
          channel: NotificationChannel.EMAIL,
          title: 'Cita Confirmada',
          content: `Tu cita para el ${event.payload.date} a las ${event.payload.startTime} ha sido confirmada por el barbero.`,
          metadata: {
            bookingId: event.aggregateId,
            barberId: event.payload.barberId,
            date: event.payload.date,
            startTime: event.payload.startTime
          }
        }

      case 'booking.cancelled':
        return {
          userId: event.payload.clientId || event.payload.userId,
          type: NotificationType.APPOINTMENT_CANCELLED,
          channel: NotificationChannel.EMAIL,
          title: 'Cita Cancelada',
          content: `Tu cita para el ${event.payload.date} a las ${event.payload.startTime} ha sido cancelada.`,
          metadata: {
            bookingId: event.aggregateId,
            cancellationReason: event.payload.reason,
            date: event.payload.date,
            startTime: event.payload.startTime
          }
        }

      case 'booking.rescheduled':
        return {
          userId: event.payload.clientId || event.payload.userId,
          type: NotificationType.APPOINTMENT_RESCHEDULED,
          channel: NotificationChannel.EMAIL,
          title: 'Cita Reprogramada',
          content: `Tu cita ha sido reprogramada para el ${event.payload.newDate} a las ${event.payload.newStartTime}.`,
          metadata: {
            bookingId: event.aggregateId,
            oldDate: event.payload.oldDate,
            oldStartTime: event.payload.oldStartTime,
            newDate: event.payload.newDate,
            newStartTime: event.payload.newStartTime
          }
        }

      case 'booking.completed':
        return {
          userId: event.payload.clientId || event.payload.userId,
          type: NotificationType.APPOINTMENT_COMPLETED,
          channel: NotificationChannel.EMAIL,
          title: 'Cita Completada',
          content: 'Tu cita ha sido completada. ¿Te gustaría dejar una reseña?',
          metadata: {
            bookingId: event.aggregateId,
            barberId: event.payload.barberId,
            completedAt: event.timestamp
          }
        }

      case 'payment.confirmed':
        return {
          userId: event.payload.clientId || event.payload.userId,
          type: NotificationType.PAYMENT_CONFIRMED,
          channel: NotificationChannel.EMAIL,
          title: 'Pago Confirmado',
          content: `Tu pago de $${event.payload.amount} ha sido confirmado.`,
          metadata: {
            paymentId: event.aggregateId,
            amount: event.payload.amount,
            currency: event.payload.currency,
            bookingId: event.payload.bookingId
          }
        }

      case 'payment.failed':
        return {
          userId: event.payload.clientId || event.payload.userId,
          type: NotificationType.PAYMENT_FAILED,
          channel: NotificationChannel.EMAIL,
          title: 'Pago Fallido',
          content: 'Hubo un problema con tu pago. Por favor, intenta nuevamente.',
          metadata: {
            paymentId: event.aggregateId,
            amount: event.payload.amount,
            failureReason: event.payload.failureReason,
            bookingId: event.payload.bookingId
          }
        }

      case 'user.registered':
        return {
          userId: event.aggregateId,
          type: NotificationType.WELCOME,
          channel: NotificationChannel.EMAIL,
          title: 'Bienvenido a BarberIA',
          content: '¡Gracias por registrarte! Tu cuenta ha sido creada exitosamente.',
          metadata: {
            userId: event.aggregateId,
            email: event.payload.email,
            name: event.payload.name
          }
        }

      case 'user.verified':
        return {
          userId: event.aggregateId,
          type: NotificationType.EMAIL_VERIFICATION,
          channel: NotificationChannel.EMAIL,
          title: 'Cuenta Verificada',
          content: 'Tu cuenta ha sido verificada exitosamente.',
          metadata: {
            userId: event.aggregateId,
            verifiedAt: event.timestamp
          }
        }

      case 'review.created':
        return {
          userId: event.payload.barberId,
          type: NotificationType.REVIEW_RECEIVED,
          channel: NotificationChannel.EMAIL,
          title: 'Nueva Reseña',
          content: 'Has recibido una nueva reseña de un cliente.',
          metadata: {
            reviewId: event.aggregateId,
            bookingId: event.payload.bookingId,
            rating: event.payload.rating,
            clientId: event.payload.clientId
          }
        }

      default:
        this.logger.warn(`Evento ${event.eventType} no tiene mapeo de notificación`)
        return null
    }
  }
}