import { Injectable } from '@nestjs/common'
import { BookingEventHandler } from 'contracts'
import { BookingService } from './booking.service'
import { BookingCreatedEvent, BookingCancelledEvent, BookingRescheduledEvent, BookingConfirmedEvent } from 'contracts'

/**
 * Handler para procesar eventos de booking que vienen de otros servicios
 * Este handler permite que el BookingService reaccione a eventos del sistema
 */
@Injectable()
export class BookingEventProcessor extends BookingEventHandler<BookingCreatedEvent | BookingCancelledEvent | BookingRescheduledEvent | BookingConfirmedEvent> {

  constructor(private readonly bookingService: BookingService) {
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

  protected async processEvent(
    event: BookingCreatedEvent | BookingCancelledEvent | BookingRescheduledEvent | BookingConfirmedEvent
  ): Promise<void> {
    this.logger.log(`Procesando evento de booking: ${event.eventType}`)

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

  private async handleBookingCreated(event: BookingCreatedEvent): Promise<void> {
    this.logger.log(`Nueva cita creada: ${event.payload.appointmentId}`)
    
    // Aquí podríamos:
    // - Actualizar la disponibilidad del barbero
    // - Crear recordatorios automáticos
    // - Sincronizar con calendarios externos
    // - Enviar notificaciones adicionales
    
    this.logger.log(`Cita procesada: Cliente ${event.payload.clientId}, Barbero ${event.payload.barberId}`)
  }

  private async handleBookingCancelled(event: BookingCancelledEvent): Promise<void> {
    this.logger.log(`Cita cancelada: ${event.payload.appointmentId}`)
    
    // Aquí podríamos:
    // - Liberar la disponibilidad del barbero
    // - Cancelar recordatorios
    // - Notificar a lista de espera
    // - Actualizar métricas de cancelación
    
    this.logger.log(`Cancelación procesada: ${event.payload.cancelledBy}`)
  }

  private async handleBookingRescheduled(event: BookingRescheduledEvent): Promise<void> {
    this.logger.log(`Cita reprogramada: ${event.payload.appointmentId}`)
    
    // Aquí podríamos:
    // - Actualizar la disponibilidad (liberar viejo, ocupar nuevo)
    // - Reprogramar recordatorios
    // - Notificar cambios a interesados
    
    this.logger.log(`Reprogramación procesada: ${event.payload.previousDate} -> ${event.payload.newDate}`)
  }

  private async handleBookingConfirmed(event: BookingConfirmedEvent): Promise<void> {
    this.logger.log(`Cita confirmada: ${event.payload.appointmentId}`)
    
    // Aquí podríamos:
    // - Bloquear definitivamente el horario
    // - Programar recordatorios
    // - Preparar recursos necesarios
    
    this.logger.log(`Confirmación procesada por: ${event.payload.confirmedBy}`)
  }
}