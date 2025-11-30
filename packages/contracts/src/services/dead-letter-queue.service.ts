import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common'
import { DomainEvent } from '../events/base'
import { PostgresEventStore } from './postgres-event-store.service'
import { EventBusService } from './event-bus.service'

export interface DeadLetterEvent {
  event: DomainEvent
  failedAt: string
  errorMessage: string
  retryCount: number
  nextRetryAt?: string
  resolvedAt?: string
  resolvedBy?: string
  resolutionNotes?: string
}

export interface RetryPolicy {
  maxRetries: number
  retryDelay: number // en milisegundos
  backoffMultiplier: number
  maxDelay: number // en milisegundos
}

@Injectable()
export class DeadLetterQueueService {
  private readonly logger = new Logger(DeadLetterQueueService.name)
  private deadLetterEvents: Map<string, DeadLetterEvent> = new Map()
  private retryPolicies: Map<string, RetryPolicy> = new Map()

  constructor(
    private readonly eventStore: PostgresEventStore,
    @Inject(forwardRef(() => EventBusService))
    private readonly eventBus: EventBusService
  ) {
    this.setupDefaultRetryPolicies()
  }

  /**
   * Configura políticas de reintento por defecto
   */
  private setupDefaultRetryPolicies(): void {
    // Política por defecto para todos los eventos
    this.retryPolicies.set('default', {
      maxRetries: 3,
      retryDelay: 5000, // 5 segundos
      backoffMultiplier: 2,
      maxDelay: 60000 // 1 minuto
    })

    // Política para eventos críticos (notificaciones)
    this.retryPolicies.set('notification', {
      maxRetries: 5,
      retryDelay: 10000, // 10 segundos
      backoffMultiplier: 1.5,
      maxDelay: 300000 // 5 minutos
    })

    // Política para eventos de booking
    this.retryPolicies.set('booking', {
      maxRetries: 4,
      retryDelay: 15000, // 15 segundos
      backoffMultiplier: 2,
      maxDelay: 120000 // 2 minutos
    })
  }

  /**
   * Maneja un evento que falló al procesarse
   */
  async handleFailedEvent(event: DomainEvent, error: Error): Promise<void> {
    const eventId = event.eventId
    const retryPolicy = this.getRetryPolicy(event.eventType)
    
    // Obtener el evento actual del store para ver el retry count
    const existingEvents = await this.eventStore.getEvents(event.aggregateId)
    const currentEvent = existingEvents.find(e => e.eventId === eventId)
    const currentRetryCount = currentEvent ? (currentEvent.metadata?.retryCount || 0) : 0

    this.logger.warn(`Evento falló: ${eventId}, reintento ${currentRetryCount + 1}/${retryPolicy.maxRetries}`)

    if (currentRetryCount < retryPolicy.maxRetries) {
      // Programar reintento
      await this.scheduleRetry(event, error.message, currentRetryCount + 1, retryPolicy)
      
      // Actualizar el evento en el store con el nuevo retry count
      await this.eventStore.markEventAsFailed(eventId, error.message)
    } else {
      // Mover a dead letter queue
      await this.moveToDeadLetter(event, error.message, currentRetryCount)
    }
  }

  /**
   * Programa un reintento del evento
   */
  private async scheduleRetry(
    event: DomainEvent, 
    errorMessage: string, 
    retryCount: number,
    retryPolicy: RetryPolicy
  ): Promise<void> {
    const delay = this.calculateRetryDelay(retryCount, retryPolicy)
    const nextRetryAt = new Date(Date.now() + delay).toISOString()

    const deadLetterEvent: DeadLetterEvent = {
      event,
      failedAt: new Date().toISOString(),
      errorMessage,
      retryCount,
      nextRetryAt
    }

    this.deadLetterEvents.set(event.eventId, deadLetterEvent)

    // Programar el reintento
    setTimeout(async () => {
      await this.retryEvent(event.eventId)
    }, delay)

    this.logger.log(`Reintento programado para evento ${event.eventId} en ${delay}ms`)
  }

  /**
   * Calcula el delay para el siguiente reintento con backoff exponencial
   */
  private calculateRetryDelay(retryCount: number, retryPolicy: RetryPolicy): number {
    const delay = retryPolicy.retryDelay * Math.pow(retryPolicy.backoffMultiplier, retryCount - 1)
    return Math.min(delay, retryPolicy.maxDelay)
  }

  /**
   * Reintenta procesar un evento
   */
  private async retryEvent(eventId: string): Promise<void> {
    const deadLetterEvent = this.deadLetterEvents.get(eventId)
    
    if (!deadLetterEvent) {
      this.logger.warn(`Evento no encontrado en dead letter queue: ${eventId}`)
      return
    }

    try {
      this.logger.log(`Reintentando procesar evento: ${eventId}`)
      
      // Re-publicar el evento
      await this.eventBus.publish(deadLetterEvent.event)
      
      // Marcar como procesado exitosamente
      await this.eventStore.markEventAsProcessed(eventId)
      
      // Remover de la dead letter queue
      this.deadLetterEvents.delete(eventId)
      
      this.logger.log(`Evento re-procesado exitosamente: ${eventId}`)
    } catch (error) {
      this.logger.error(`Reintento falló para evento ${eventId}:`, error)
      
      // El manejo del error continuará con el siguiente reintento o dead letter
      await this.handleFailedEvent(deadLetterEvent.event, error as Error)
    }
  }

  /**
   * Mueve un evento a la dead letter queue
   */
  private async moveToDeadLetter(event: DomainEvent, errorMessage: string, retryCount: number): Promise<void> {
    const deadLetterEvent: DeadLetterEvent = {
      event,
      failedAt: new Date().toISOString(),
      errorMessage,
      retryCount
    }

    this.deadLetterEvents.set(event.eventId, deadLetterEvent)
    
    // Actualizar el evento en el store
    await this.eventStore.markEventAsFailed(event.eventId, `Dead letter: ${errorMessage}`)

    this.logger.error(`Evento movido a dead letter queue: ${event.eventId} después de ${retryCount} reintentos`)
  }

  /**
   * Obtiene todos los eventos en dead letter queue
   */
  getDeadLetterEvents(): DeadLetterEvent[] {
    return Array.from(this.deadLetterEvents.values())
  }

  /**
   * Obtiene un evento específico de la dead letter queue
   */
  getDeadLetterEvent(eventId: string): DeadLetterEvent | undefined {
    return this.deadLetterEvents.get(eventId)
  }

  /**
   * Reprocesa manualmente un evento de la dead letter queue
   */
  async reprocessDeadLetterEvent(eventId: string, resolvedBy: string, notes?: string): Promise<void> {
    const deadLetterEvent = this.deadLetterEvents.get(eventId)
    
    if (!deadLetterEvent) {
      throw new Error(`Evento no encontrado en dead letter queue: ${eventId}`)
    }

    try {
      // Re-publicar el evento
      await this.eventBus.publish(deadLetterEvent.event)
      
      // Marcar como resuelto
      deadLetterEvent.resolvedAt = new Date().toISOString()
      deadLetterEvent.resolvedBy = resolvedBy
      deadLetterEvent.resolutionNotes = notes
      
      // Marcar como procesado en el store
      await this.eventStore.markEventAsProcessed(eventId)
      
      // Remover de la dead letter queue
      this.deadLetterEvents.delete(eventId)
      
      this.logger.log(`Evento reprocesado manualmente: ${eventId} por ${resolvedBy}`)
    } catch (error) {
      this.logger.error(`Error reprocesando evento ${eventId}:`, error)
      throw error
    }
  }

  /**
   * Reprocesa todos los eventos de la dead letter queue
   */
  async reprocessAllDeadLetterEvents(resolvedBy: string, notes?: string): Promise<{
    total: number
    successful: number
    failed: number
  }> {
    const deadLetterEvents = this.getDeadLetterEvents()
    let successful = 0
    let failed = 0

    for (const deadLetterEvent of deadLetterEvents) {
      try {
        await this.reprocessDeadLetterEvent(deadLetterEvent.event.eventId, resolvedBy, notes)
        successful++
      } catch (error) {
        failed++
      }
    }

    return {
      total: deadLetterEvents.length,
      successful,
      failed
    }
  }

  /**
   * Configura una política de reintento personalizada para un tipo de evento
   */
  setRetryPolicy(eventType: string, policy: RetryPolicy): void {
    this.retryPolicies.set(eventType, policy)
    this.logger.log(`Política de reintento actualizada para ${eventType}`)
  }

  /**
   * Obtiene la política de reintento para un tipo de evento
   */
  getRetryPolicy(eventType: string): RetryPolicy {
    // Buscar política específica para el tipo de evento
    for (const [key, policy] of this.retryPolicies.entries()) {
      if (eventType.includes(key)) {
        return policy
      }
    }
    
    // Retornar política por defecto
    return this.retryPolicies.get('default')!
  }

  /**
   * Obtiene estadísticas de la dead letter queue
   */
  getDeadLetterStats(): {
    totalEvents: number
    eventsByType: Record<string, number>
    eventsByError: Record<string, number>
    averageRetries: number
    oldestEvent?: string
    newestEvent?: string
  } {
    const deadLetterEvents = this.getDeadLetterEvents()
    
    if (deadLetterEvents.length === 0) {
      return {
        totalEvents: 0,
        eventsByType: {},
        eventsByError: {},
        averageRetries: 0
      }
    }

    const eventsByType: Record<string, number> = {}
    const eventsByError: Record<string, number> = {}
    let totalRetries = 0
    let oldestEvent: string | undefined
    let newestEvent: string | undefined

    for (const deadLetterEvent of deadLetterEvents) {
      const eventType = deadLetterEvent.event.eventType
      eventsByType[eventType] = (eventsByType[eventType] || 0) + 1

      const errorMessage = deadLetterEvent.errorMessage
      eventsByError[errorMessage] = (eventsByError[errorMessage] || 0) + 1

      totalRetries += deadLetterEvent.retryCount

      if (!oldestEvent || deadLetterEvent.failedAt < oldestEvent) {
        oldestEvent = deadLetterEvent.failedAt
      }
      if (!newestEvent || deadLetterEvent.failedAt > newestEvent) {
        newestEvent = deadLetterEvent.failedAt
      }
    }

    return {
      totalEvents: deadLetterEvents.length,
      eventsByType,
      eventsByError,
      averageRetries: totalRetries / deadLetterEvents.length,
      oldestEvent,
      newestEvent
    }
  }

  /**
   * Limpia la dead letter queue (útil para mantenimiento)
   */
  clearDeadLetterQueue(): void {
    const count = this.deadLetterEvents.size
    this.deadLetterEvents.clear()
    this.logger.warn(`Dead letter queue limpiada. ${count} eventos removidos.`)
  }
}