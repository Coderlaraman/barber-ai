import { Injectable, Logger } from '@nestjs/common'
import { DomainEvent } from '../events/base'
import { EventBusService } from './event-bus.service'
import { PostgresEventStore } from './postgres-event-store.service'

/**
 * Servicio para manejar el replay de eventos
 * Coordina entre EventStore y EventBus para reprocesar eventos históricos
 */
@Injectable()
export class EventReplayService {
  private readonly logger = new Logger(EventReplayService.name)

  constructor(
    private readonly eventStore: PostgresEventStore,
    private readonly eventBus: EventBusService
  ) {}

  /**
   * Replay events from a specific time
   * Returns the events for manual processing if needed
   */
  async replayEventsFromTime(fromTime: string): Promise<DomainEvent[]> {
    try {
      this.logger.log(`Iniciando replay de eventos desde: ${fromTime}`)
      
      // Obtener eventos desde el EventStore
      const events = await this.eventStore.replayEvents(fromTime)
      
      this.logger.log(`Se encontraron ${events.length} eventos para replay`)
      
      // Re-publicar cada evento en el EventBus
      let successCount = 0
      let errorCount = 0
      
      for (const event of events) {
        try {
          this.logger.log(`Re-publicando evento: ${event.eventType} - ${event.aggregateId}`)
          await this.eventBus.publish(event)
          successCount++
        } catch (error) {
          this.logger.error(`Error re-publicando evento ${event.eventId}:`, error)
          errorCount++
          
          // Marcar el evento como fallido en el store
          try {
            await this.eventStore.markEventAsFailed(
              event.eventId, 
              `Replay publication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          } catch (storeError) {
            this.logger.error(`Error marcando evento como fallido:`, storeError)
          }
        }
      }
      
      this.logger.log(`Replay completado: ${successCount} éxitos, ${errorCount} errores`)
      return events
      
    } catch (error) {
      this.logger.error(`Error durante el replay de eventos:`, error)
      throw error
    }
  }

  /**
   * Replay specific events by IDs
   */
  async replayEventsByIds(eventIds: string[]): Promise<void> {
    try {
      this.logger.log(`Replaying ${eventIds.length} specific events`)
      
      for (const eventId of eventIds) {
        try {
          // Obtener el evento del store
          const event = await this.eventStore.getEventById(eventId)
          if (!event) {
            this.logger.warn(`Evento no encontrado: ${eventId}`)
            continue
          }
          
          // Re-publicar el evento
          await this.eventBus.publish(event)
          
          // Marcar como replayed
          await this.eventStore.markEventAsReplayed(eventId)
          
          this.logger.log(`Evento replayed exitosamente: ${eventId}`)
          
        } catch (error) {
          this.logger.error(`Error replaying event ${eventId}:`, error)
          
          // Marcar como fallido
          await this.eventStore.markEventAsFailed(
            eventId,
            `Specific replay failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }
      
    } catch (error) {
      this.logger.error(`Error durante replay específico de eventos:`, error)
      throw error
    }
  }

  /**
   * Get replay status and statistics
   */
  async getReplayStatus(fromTime?: string): Promise<{
    totalEvents: number
    replayableEvents: number
    lastReplayTime?: string
    eventsByStatus: Record<string, number>
  }> {
    try {
      const stats = await this.eventStore.getEventStats()
      
      let replayableEvents = stats.totalEvents
      if (fromTime) {
        const eventsFromTime = await this.eventStore.getEventsByTimeRange(fromTime, new Date().toISOString())
        replayableEvents = eventsFromTime.length
      }
      
      return {
        totalEvents: stats.totalEvents,
        replayableEvents,
        eventsByStatus: stats.eventsByStatus
      }
      
    } catch (error) {
      this.logger.error(`Error obteniendo estado de replay:`, error)
      throw error
    }
  }
}