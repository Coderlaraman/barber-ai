import { Injectable, Logger } from '@nestjs/common'
import { BookingEventHandler } from '../services/event-handler'
import { BookingCreatedEvent } from '../events/booking-events'

/**
 * Handler para el evento BookingCreated
 * Ejemplo de implementación para notificar cuando se crea una cita
 */
@Injectable()
export class BookingCreatedHandler extends BookingEventHandler<BookingCreatedEvent> {
  protected readonly logger = new Logger(BookingCreatedHandler.name)

  canHandle(eventType: string): boolean {
    return eventType === 'booking.created'
  }

  protected async processEvent(event: BookingCreatedEvent): Promise<void> {
    this.logger.log(`Procesando creación de cita: ${event.aggregateId}`)
    
    const { payload } = event
    
    // Validar datos requeridos
    if (!payload.clientId || !payload.barberId || !payload.serviceId) {
      throw new Error('Datos incompletos en el evento de creación de cita')
    }

    // Aquí se implementaría la lógica específica
    // Por ejemplo:
    // - Enviar notificación al barbero
    // - Actualizar disponibilidad
    // - Crear recordatorio
    // - Enviar confirmación al cliente

    this.logger.log(`Cita creada exitosamente:
      - Cliente: ${payload.clientId}
      - Barbero: ${payload.barberId}
      - Servicio: ${payload.serviceId}
      - Fecha: ${payload.date}
      - Hora: ${payload.startTime} - ${payload.endTime}
    `)

    // Simular procesamiento asíncrono
    await this.simulateAsyncWork()
  }

  private async simulateAsyncWork(): Promise<void> {
    // Simular trabajo asíncrono
    return new Promise(resolve => setTimeout(resolve, 100))
  }
}