import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common'
import { Redis } from 'ioredis'
import { DomainEvent, IEventBus, IEventHandler, IEventStore } from '../events/base'
import { DeadLetterQueueService } from './dead-letter-queue.service'
import { RedisConfiguration } from '../config/redis.config'

@Injectable()
export class EventBusService implements IEventBus, OnModuleInit {
  private redisConfig?: RedisConfiguration
  private readonly logger = new Logger(EventBusService.name)
  private publisher!: Redis
  private subscriber!: Redis
  private handlers: Map<string, IEventHandler<any>[]> = new Map()
  private eventStore: IEventStore

  constructor(
    eventStore: IEventStore,
    @Inject(forwardRef(() => DeadLetterQueueService))
    private readonly deadLetterQueue?: DeadLetterQueueService
  ) {
    this.eventStore = eventStore
  }

  async onModuleInit(): Promise<void> {
    await this.connect()
  }

  async connect(redisConfig?: RedisConfiguration): Promise<void> {
    try {
      const config = redisConfig || RedisConfiguration.getInstance()
      const { publisher, subscriber } = config.createRedisClientForPubSub()
      
      this.publisher = publisher
      this.subscriber = subscriber

      await this.publisher.ping()
      await this.subscriber.ping()

      this.subscriber.on('message', this.handleMessage.bind(this))
      
      this.logger.log('EventBus conectado a Redis exitosamente')
    } catch (error) {
      this.logger.error('Error conectando EventBus a Redis:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.publisher) {
      await this.publisher.quit()
    }
    if (this.subscriber) {
      await this.subscriber.quit()
    }
    this.logger.log('EventBus desconectado de Redis')
  }

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    try {
      // Guardar evento en el event store
      await this.eventStore.saveEvent(event)
      
      // Publicar evento en Redis
      const channel = `events:${event.aggregateType}:${event.eventType}`
      const message = JSON.stringify(event)
      
      await this.publisher.publish(channel, message)
      
      this.logger.log(`Evento publicado: ${event.eventType} para ${event.aggregateId}`)
    } catch (error) {
      this.logger.error(`Error publicando evento ${event.eventType}:`, error)
      throw error
    }
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    const publishPromises = events.map(event => this.publish(event))
    await Promise.all(publishPromises)
  }

  subscribe(aggregateType: string, eventType: string, handler: IEventHandler<any>): void {
    const key = `${aggregateType}:${eventType}`
    
    if (!this.handlers.has(key)) {
      this.handlers.set(key, [])
    }
    
    this.handlers.get(key)!.push(handler)
    
    // Suscribirse al canal de Redis
    const channel = `events:${aggregateType}:${eventType}`
    this.subscriber.subscribe(channel)
    
    this.logger.log(`Handler suscrito a: ${channel}`)
  }

  unsubscribe(aggregateType: string, eventType: string, handler: IEventHandler<any>): void {
    const key = `${aggregateType}:${eventType}`
    const handlers = this.handlers.get(key)
    
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
      
      if (handlers.length === 0) {
        this.handlers.delete(key)
        const channel = `events:${aggregateType}:${eventType}`
        this.subscriber.unsubscribe(channel)
      }
    }
  }

  private async handleMessage(channel: string, message: string): Promise<void> {
    try {
      const event: DomainEvent = JSON.parse(message)
      const parts = channel.split(':')
      const aggregateType = parts[1]
      const eventType = parts[2]
      
      const key = `${aggregateType}:${eventType}`
      const handlers = this.handlers.get(key)
      
      if (handlers && handlers.length > 0) {
        const handlePromises = handlers.map(handler => 
          this.safeHandle(handler, event)
        )
        await Promise.all(handlePromises)
      }
    } catch (error) {
      this.logger.error('Error procesando mensaje:', error)
    }
  }

  private async safeHandle(handler: IEventHandler<any>, event: DomainEvent): Promise<void> {
    try {
      const startTime = Date.now()
      await handler.handle(event)
      const processingTime = Date.now() - startTime
      
      // Marcar evento como procesado exitosamente
      if (this.eventStore && 'markEventAsProcessed' in this.eventStore) {
        await (this.eventStore as any).markEventAsProcessed(event.eventId)
      }
      
      this.logger.log(`Evento procesado exitosamente: ${event.eventType} en ${processingTime}ms`)
    } catch (error) {
      this.logger.error(`Error en handler para evento ${event.eventType}:`, error)
      
      // Manejar evento fallido
      if (this.deadLetterQueue) {
        await this.deadLetterQueue.handleFailedEvent(event, error as Error)
      }
    }
  }

  // Métodos de utilidad para patrones comunes
  async publishBookingEvent(event: DomainEvent): Promise<void> {
    await this.publish(event)
  }

  async publishNotificationEvent(event: DomainEvent): Promise<void> {
    await this.publish(event)
  }

  // Método para obtener estadísticas
  getSubscriptionStats(): Record<string, number> {
    const stats: Record<string, number> = {}
    
    for (const [key, handlers] of this.handlers.entries()) {
      stats[key] = handlers.length
    }
    
    return stats
  }
}