import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, MoreThan, LessThan, Between } from 'typeorm'
import { DomainEvent, IEventStore, PersistentEventStore } from '../events/base'
import { EventEntity } from '../entities/event.entity'
import { EventSnapshotEntity } from '../entities/event-snapshot.entity'

export { EventEntity, EventSnapshotEntity }

@Injectable()
export class PostgresEventStore implements PersistentEventStore {
  private readonly logger = new Logger(PostgresEventStore.name)

  constructor(
    @InjectRepository(EventEntity)
    private eventRepository: Repository<EventEntity>,
    @InjectRepository(EventSnapshotEntity)
    private snapshotRepository: Repository<EventSnapshotEntity>
  ) {}

  async saveEvent(event: DomainEvent): Promise<void> {
    try {
      const eventEntity = this.eventRepository.create({
        eventId: event.eventId,
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        timestamp: event.timestamp,
        version: event.version,
        payload: event.payload,
        metadata: event.metadata,
        createdAt: new Date(),
        retryCount: 0,
        status: 'PENDING'
      })

      await this.eventRepository.save(eventEntity)
      
      this.logger.log(`Evento guardado en PostgreSQL: ${event.eventType} para ${event.aggregateId}`)
    } catch (error) {
      this.logger.error(`Error guardando evento en PostgreSQL:`, error)
      throw error
    }
  }

  async saveEvents(events: DomainEvent[]): Promise<void> {
    const savePromises = events.map(event => this.saveEvent(event))
    await Promise.all(savePromises)
  }

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    const eventEntities = await this.eventRepository.find({
      where: { aggregateId },
      order: { timestamp: 'ASC' }
    })

    return eventEntities.map((entity: EventEntity) => this.entityToDomainEvent(entity))
  }

  async getEventsByType(eventType: string): Promise<DomainEvent[]> {
    const eventEntities = await this.eventRepository.find({
      where: { eventType },
      order: { timestamp: 'ASC' }
    })

    return eventEntities.map((entity: EventEntity) => this.entityToDomainEvent(entity))
  }

  async getEventsByAggregateType(aggregateType: string): Promise<DomainEvent[]> {
    const eventEntities = await this.eventRepository.find({
      where: { aggregateType },
      order: { timestamp: 'ASC' }
    })

    return eventEntities.map((entity: EventEntity) => this.entityToDomainEvent(entity))
  }

  async getAllEvents(): Promise<DomainEvent[]> {
    const eventEntities = await this.eventRepository.find({
      order: { timestamp: 'ASC' }
    })

    return eventEntities.map((entity: EventEntity) => this.entityToDomainEvent(entity))
  }

  async getEventsByTimeRange(startTime: string, endTime: string): Promise<DomainEvent[]> {
    const eventEntities = await this.eventRepository.find({
      where: {
        timestamp: Between(startTime, endTime)
      },
      order: { timestamp: 'ASC' }
    })

    return eventEntities.map((entity: EventEntity) => this.entityToDomainEvent(entity))
  }

  async createSnapshot(aggregateId: string): Promise<void> {
    try {
      // Obtener todos los eventos del agregado
      const events = await this.getEvents(aggregateId)
      
      if (events.length === 0) {
        return
      }

      // Crear snapshot (en una implementación real, esto dependería del agregado específico)
      const snapshot = {
        aggregateId,
        lastEventTimestamp: events[events.length - 1].timestamp,
        eventCount: events.length,
        lastEventType: events[events.length - 1].eventType
      }

      const snapshotEntity = this.snapshotRepository.create({
        aggregateId,
        aggregateType: events[0].aggregateType,
        snapshot,
        version: events[events.length - 1].version,
        createdAt: new Date()
      })

      await this.snapshotRepository.save(snapshotEntity)
      
      this.logger.log(`Snapshot creado para agregado: ${aggregateId}`)
    } catch (error) {
      this.logger.error(`Error creando snapshot:`, error)
      throw error
    }
  }

  async getEventById(eventId: string): Promise<DomainEvent | null> {
    const eventEntity = await this.eventRepository.findOne({
      where: { eventId }
    })

    if (!eventEntity) {
      return null
    }

    return {
      eventId: eventEntity.eventId,
      eventType: eventEntity.eventType,
      aggregateId: eventEntity.aggregateId,
      aggregateType: eventEntity.aggregateType,
      timestamp: eventEntity.timestamp,
      version: eventEntity.version,
      payload: eventEntity.payload,
      metadata: eventEntity.metadata
    }
  }

  async getSnapshot(aggregateId: string): Promise<any> {
    const snapshotEntity = await this.snapshotRepository.findOne({
      where: { aggregateId },
      order: { createdAt: 'DESC' }
    })

    return snapshotEntity?.snapshot || null
  }

  async replayEvents(fromTime: string): Promise<DomainEvent[]> {
    const events = await this.getEventsByTimeRange(fromTime, new Date().toISOString())
    
    this.logger.log(`Reproduciendo ${events.length} eventos desde ${fromTime}`)
    
    // Marcar eventos como reprocesados
    for (const event of events) {
      try {
        this.logger.log(`Marcando evento como replayed: ${event.eventType} - ${event.aggregateId}`)
        await this.markEventAsReplayed(event.eventId)
      } catch (error) {
        this.logger.error(`Error marcando evento ${event.eventId} como replayed:`, error)
      }
    }
    
    this.logger.log(`Reproducción completada: ${events.length} eventos marcados como replayed`)
    return events
  }

  // Métodos adicionales para métricas y monitoreo

  async getEventStats(): Promise<{
    totalEvents: number
    eventsByType: Record<string, number>
    eventsByAggregate: Record<string, number>
    eventsByStatus: Record<string, number>
    eventsLast24Hours: number
    failedEvents: number
    pendingEvents: number
  }> {
    const totalEvents = await this.eventRepository.count()
    
    // Obtener estadísticas por tipo
    const eventsByTypeResult = await this.eventRepository
      .createQueryBuilder('event')
      .select('event.event_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('event.event_type')
      .getRawMany()

    const eventsByType: Record<string, number> = {}
    eventsByTypeResult.forEach((row: any) => {
      eventsByType[row.type] = parseInt(row.count, 10)
    })

    // Obtener estadísticas por agregado
    const eventsByAggregateResult = await this.eventRepository
      .createQueryBuilder('event')
      .select('event.aggregate_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('event.aggregate_type')
      .getRawMany()

    const eventsByAggregate: Record<string, number> = {}
    eventsByAggregateResult.forEach((row: any) => {
      eventsByAggregate[row.type] = parseInt(row.count, 10)
    })

    // Obtener estadísticas por estado
    const eventsByStatusResult = await this.eventRepository
      .createQueryBuilder('event')
      .select('event.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('event.status')
      .getRawMany()

    const eventsByStatus: Record<string, number> = {}
    eventsByStatusResult.forEach((row: any) => {
      eventsByStatus[row.status] = parseInt(row.count, 10)
    })

    // Eventos de las últimas 24 horas
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const eventsLast24Hours = await this.eventRepository.count({
      where: {
        createdAt: MoreThan(last24Hours)
      }
    })

    // Eventos fallidos y pendientes
    const failedEvents = await this.eventRepository.count({
      where: { status: 'FAILED' }
    })

    const pendingEvents = await this.eventRepository.count({
      where: { status: 'PENDING' }
    })

    return {
      totalEvents,
      eventsByType,
      eventsByAggregate,
      eventsByStatus,
      eventsLast24Hours,
      failedEvents,
      pendingEvents
    }
  }

  async getFailedEvents(limit: number = 100): Promise<EventEntity[]> {
    return this.eventRepository.find({
      where: { status: 'FAILED' },
      order: { createdAt: 'DESC' },
      take: limit
    })
  }

  async getPendingEvents(limit: number = 100): Promise<EventEntity[]> {
    return this.eventRepository.find({
      where: { status: 'PENDING' },
      order: { createdAt: 'ASC' },
      take: limit
    })
  }

  async markEventAsProcessed(eventId: string): Promise<void> {
    await this.eventRepository.update(eventId, {
      status: 'PROCESSED',
      processedAt: new Date()
    })
  }

  async markEventAsFailed(eventId: string, errorMessage: string): Promise<void> {
    const event = await this.eventRepository.findOne({ where: { eventId } })
    
    if (event) {
      await this.eventRepository.update(eventId, {
        status: 'FAILED',
        errorMessage,
        retryCount: event.retryCount + 1,
        processedAt: new Date()
      })
    }
  }

  async markEventAsReplayed(eventId: string): Promise<void> {
    await this.eventRepository.update(eventId, {
      status: 'REPLAYED',
      processedAt: new Date()
    })
  }

  async getLastEventTimestamp(): Promise<string | null> {
    const lastEvent = await this.eventRepository.findOne({
      order: { timestamp: 'DESC' }
    })
    
    return lastEvent?.timestamp || null
  }

  async getFirstEventTimestamp(): Promise<string | null> {
    const firstEvent = await this.eventRepository.findOne({
      order: { timestamp: 'ASC' }
    })
    
    return firstEvent?.timestamp || null
  }

  private entityToDomainEvent(entity: EventEntity): DomainEvent {
    return {
      eventId: entity.eventId,
      eventType: entity.eventType,
      aggregateId: entity.aggregateId,
      aggregateType: entity.aggregateType,
      timestamp: entity.timestamp,
      version: entity.version,
      payload: entity.payload,
      metadata: entity.metadata
    }
  }
}