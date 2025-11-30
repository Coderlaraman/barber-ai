import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { EventBusService } from '../services/event-bus.service'
import { BookingCreatedHandler } from '../handlers/booking-created.handler'
import { EventFactory } from '../utils/event-factory'
import { EventType } from '../events/base'

/**
 * Ejemplo de cómo integrar el sistema de eventos en un servicio
 */
@Injectable()
export class BookingEventExample implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly bookingCreatedHandler: BookingCreatedHandler
  ) {}

  async onModuleInit(): Promise<void> {
    // Suscribir handlers a eventos
    this.eventBus.subscribe(
      'BOOKING',
      EventType.BOOKING_CREATED,
      this.bookingCreatedHandler
    )

    console.log('BookingEventExample inicializado y handlers suscritos')
  }

  async onModuleDestroy(): Promise<void> {
    // Cleanup si es necesario
    console.log('BookingEventExample destruido')
  }

  /**
   * Ejemplo de cómo publicar un evento cuando se crea una cita
   */
  async createBooking(bookingData: {
    appointmentId: string
    barberId: string
    clientId: string
    serviceId: string
    startTime: string
    endTime: string
    date: string
    price: number
    notes?: string
  }): Promise<void> {
    
    // Crear el evento usando la factory
    const event = EventFactory.createBookingCreatedEvent(
      bookingData.appointmentId,
      bookingData.barberId,
      bookingData.clientId,
      bookingData.serviceId,
      bookingData.startTime,
      bookingData.endTime,
      bookingData.date,
      bookingData.price,
      bookingData.notes
    )

    // Publicar el evento
    await this.eventBus.publish(event)

    console.log(`Evento de cita creada publicado: ${event.aggregateId}`)
  }

  /**
   * Ejemplo de cómo cancelar una cita y publicar el evento
   */
  async cancelBooking(
    appointmentId: string,
    barberId: string,
    clientId: string,
    reason?: string
  ): Promise<void> {
    
    const event = EventFactory.createBookingCancelledEvent(
      appointmentId,
      barberId,
      clientId,
      reason,
      'CLIENT'
    )

    await this.eventBus.publish(event)

    console.log(`Evento de cita cancelada publicado: ${event.aggregateId}`)
  }

  /**
   * Ejemplo de cómo obtener estadísticas de suscripciones
   */
  getSubscriptionStats(): Record<string, number> {
    return this.eventBus.getSubscriptionStats()
  }
}