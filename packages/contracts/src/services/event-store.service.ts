import { Injectable, Logger } from '@nestjs/common'
import { DomainEvent, IEventStore } from '../events/base'

/**
 * Implementación en memoria del Event Store
 * En producción, esto debería usar una base de datos persistente
 */
@Injectable()
export class InMemoryEventStore implements IEventStore {
  private readonly logger = new Logger(InMemoryEventStore.name)
  private events: DomainEvent[] = []
  private eventsByAggregate: Map<string, DomainEvent[]> = new Map()

  async saveEvent(event: DomainEvent): Promise<void> {
    try {
      this.events.push(event)
      
      // Indexar por aggregateId para búsquedas rápidas
      const aggregateEvents = this.eventsByAggregate.get(event.aggregateId) || []
      aggregateEvents.push(event)
      this.eventsByAggregate.set(event.aggregateId, aggregateEvents)
      
      this.logger.log(`Evento guardado: ${event.eventType} para ${event.aggregateId}`)
    } catch (error) {
      this.logger.error(`Error guardando evento:`, error)
      throw error
    }
  }

  async saveEvents(events: DomainEvent[]): Promise<void> {
    const savePromises = events.map(event => this.saveEvent(event))
    await Promise.all(savePromises)
  }

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    return this.eventsByAggregate.get(aggregateId) || []
  }

  async getEventsByType(eventType: string): Promise<DomainEvent[]> {
    return this.events.filter(event => event.eventType === eventType)
  }

  async getEventsByAggregateType(aggregateType: string): Promise<DomainEvent[]> {
    return this.events.filter(event => event.aggregateType === aggregateType)
  }

  async getAllEvents(): Promise<DomainEvent[]> {
    return [...this.events]
  }

  async getEventsByTimeRange(startTime: string, endTime: string): Promise<DomainEvent[]> {
    return this.events.filter(event => 
      event.timestamp >= startTime && event.timestamp <= endTime
    )
  }

  // Métodos de utilidad para debugging y monitoreo
  getStats(): { totalEvents: number; eventsByType: Record<string, number>; eventsByAggregate: Record<string, number> } {
    const eventsByType: Record<string, number> = {}
    const eventsByAggregate: Record<string, number> = {}

    this.events.forEach(event => {
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1
      eventsByAggregate[event.aggregateType] = (eventsByAggregate[event.aggregateType] || 0) + 1
    })

    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsByAggregate
    }
  }

  clear(): void {
    this.events = []
    this.eventsByAggregate.clear()
    this.logger.warn('Event store limpiado')
  }
}