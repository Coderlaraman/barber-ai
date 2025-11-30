import { Logger } from '@nestjs/common'
import { DomainEvent, IEventHandler } from '../events/base'

/**
 * Clase base para manejar eventos de dominio
 * Proporciona estructura común y manejo de errores
 */
export abstract class EventHandler<T extends DomainEvent> implements IEventHandler<T> {
  protected readonly logger = new Logger(this.constructor.name)

  /**
   * Determina si este handler puede manejar el tipo de evento dado
   */
  abstract canHandle(eventType: string): boolean

  /**
   * Maneja el evento de forma segura con try-catch
   */
  async handle(event: T): Promise<void> {
    try {
      this.logger.log(`Procesando evento: ${event.eventType} para ${event.aggregateId}`)
      await this.processEvent(event)
      this.logger.log(`Evento procesado exitosamente: ${event.eventType}`)
    } catch (error) {
      this.logger.error(`Error procesando evento ${event.eventType}:`, error)
      await this.handleError(event, error as Error)
    }
  }

  /**
   * Método abstracto que debe implementar cada handler específico
   */
  protected abstract processEvent(event: T): Promise<void>

  /**
   * Manejo de errores - puede ser sobrescrito por handlers específicos
   */
  protected async handleError(event: T, error: Error): Promise<void> {
    this.logger.error(`Error no manejado en ${this.constructor.name}:`, error)
    // Aquí se podría implementar lógica de reintento o dead letter queue
  }

  /**
   * Valida que el evento tenga la estructura esperada
   */
  protected validateEvent(event: T): boolean {
    return !!(event && event.eventId && event.eventType && event.aggregateId)
  }
}

/**
 * Handler para eventos de booking
 */
export abstract class BookingEventHandler<T extends DomainEvent> extends EventHandler<T> {
  protected getBookingId(event: T): string {
    return event.aggregateId
  }

  protected getClientId(event: T): string | undefined {
    return event.payload?.clientId
  }

  protected getBarberId(event: T): string | undefined {
    return event.payload?.barberId
  }
}

/**
 * Handler para eventos de notificaciones
 */
export abstract class NotificationEventHandler<T extends DomainEvent> extends EventHandler<T> {
  protected getNotificationId(event: T): string {
    return event.aggregateId
  }

  protected getRecipientId(event: T): string | undefined {
    return event.payload?.recipientId
  }

  protected getChannel(event: T): string | undefined {
    return event.payload?.channel
  }
}

/**
 * Factory para crear handlers de eventos
 */
export class EventHandlerFactory {
  private static handlers = new Map<string, new () => IEventHandler<any>>()

  static register(eventType: string, handlerClass: new () => IEventHandler<any>): void {
    this.handlers.set(eventType, handlerClass)
  }

  static create(eventType: string): IEventHandler<any> | null {
    const HandlerClass = this.handlers.get(eventType)
    return HandlerClass ? new HandlerClass() : null
  }

  static getRegisteredEventTypes(): string[] {
    return Array.from(this.handlers.keys())
  }
}