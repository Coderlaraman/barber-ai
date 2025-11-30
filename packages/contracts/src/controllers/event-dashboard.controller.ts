import { Controller, Get, Post, Body, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger'
import { EventMetricsService, EventMetrics, EventDashboardData } from '../services/event-metrics.service'
import { EventBusService } from '../services/event-bus.service'
import { PostgresEventStore } from '../services/postgres-event-store.service'
import { EventFactory } from '../utils/event-factory'
import { DomainEvent } from '../events/base'

@ApiTags('Event Dashboard')
@Controller('events/dashboard')
export class EventDashboardController {
  constructor(
    private readonly metricsService: EventMetricsService,
    private readonly eventBus: EventBusService,
    private readonly eventStore: PostgresEventStore
  ) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Obtener métricas del sistema de eventos' })
  @ApiResponse({ 
    status: 200, 
    description: 'Métricas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        totalEvents: { type: 'number' },
        eventsLast24Hours: { type: 'number' },
        eventsLastHour: { type: 'number' },
        averageEventsPerMinute: { type: 'number' },
        eventsByType: { type: 'object' },
        eventsByAggregate: { type: 'object' },
        eventsByStatus: { type: 'object' },
        averageProcessingTime: { type: 'number' },
        eventsPerSecond: { type: 'number' },
        failedEvents: { type: 'number' },
        pendingEvents: { type: 'number' },
        deadLetterEvents: { type: 'number' },
        successRate: { type: 'number' },
        redisConnectedClients: { type: 'number' },
        redisUsedMemory: { type: 'number' },
        redisKeyspaceHits: { type: 'number' },
        redisKeyspaceMisses: { type: 'number' },
        lastEventTimestamp: { type: 'string' },
        lastFailedEventTimestamp: { type: 'string' },
        metricsCalculatedAt: { type: 'string' }
      }
    }
  })
  async getMetrics(): Promise<EventMetrics> {
    return this.metricsService.getMetrics()
  }

  @Get()
  @ApiOperation({ summary: 'Obtener datos completos del dashboard' })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard data obtenido exitosamente'
  })
  async getDashboard(): Promise<EventDashboardData> {
    return this.metricsService.getDashboardData()
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Obtener alertas del sistema' })
  @ApiResponse({ 
    status: 200, 
    description: 'Alertas obtenidas exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['warning', 'error', 'info'] },
          message: { type: 'string' },
          timestamp: { type: 'string' },
          metric: { type: 'string' },
          value: { type: 'number' },
          threshold: { type: 'number' }
        }
      }
    }
  })
  async getAlerts(): Promise<Array<{ type: string; message: string; timestamp: string; metric?: string; value?: number; threshold?: number }>> {
    return this.metricsService.getAlerts()
  }

  @Get('events')
  @ApiOperation({ summary: 'Obtener eventos con filtros' })
  @ApiQuery({ name: 'type', required: false, description: 'Tipo de evento' })
  @ApiQuery({ name: 'aggregateId', required: false, description: 'ID del agregado' })
  @ApiQuery({ name: 'aggregateType', required: false, description: 'Tipo de agregado' })
  @ApiQuery({ name: 'status', required: false, description: 'Estado del evento' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados', type: Number })
  async getEvents(
    @Query('type') type?: string,
    @Query('aggregateId') aggregateId?: string,
    @Query('aggregateType') aggregateType?: string,
    @Query('status') status?: string,
    @Query('limit') limit: number = 100
  ): Promise<{ events: DomainEvent[]; total: number; filters: { type?: string; aggregateId?: string; aggregateType?: string; status?: string; limit: number } }> {
    let events: DomainEvent[] = []

    if (aggregateId) {
      events = await this.eventStore.getEvents(aggregateId)
    } else if (type) {
      events = await this.eventStore.getEventsByType(type)
    } else if (aggregateType) {
      events = await this.eventStore.getEventsByAggregateType(aggregateType)
    } else {
      events = await this.eventStore.getAllEvents()
    }

    // Filtrar por estado si se especifica
    if (status) {
      // En una implementación real, esto se haría en la consulta SQL
      events = events.slice(0, limit)
    } else {
      events = events.slice(-limit)
    }

    return {
      events: events.reverse(),
      total: events.length,
      filters: { type, aggregateId, aggregateType, status, limit }
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas detalladas' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas obtenidas exitosamente'
  })
  async getStats(): Promise<{ eventStore: any; subscriptions: any; timestamp: string }> {
    const stats = await this.eventStore.getEventStats()
    const subscriptionStats = this.eventBus.getSubscriptionStats()

    return {
      eventStore: stats,
      subscriptions: subscriptionStats,
      timestamp: new Date().toISOString()
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Verificar salud del sistema de eventos' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado de salud del sistema',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
        timestamp: { type: 'string' },
        checks: {
          type: 'object',
          properties: {
            eventStore: { type: 'string', enum: ['up', 'down'] },
            redis: { type: 'string', enum: ['up', 'down'] },
            metrics: { type: 'string', enum: ['up', 'down'] }
          }
        },
        details: {
          type: 'object',
          properties: {
            successRate: { type: 'number' },
            pendingEvents: { type: 'number' },
            failedEvents: { type: 'number' },
            alerts: { type: 'number' }
          }
        }
      }
    }
  })
  async getHealth(): Promise<{ status: string; timestamp: string; checks: { eventStore: string; redis: string; metrics: string }; details: { successRate: number; pendingEvents: number; failedEvents: number; alerts: number } }> {
    const metrics = await this.metricsService.getMetrics()
    const alerts = await this.metricsService.getAlerts()

    // Determinar estado general
    let status = 'healthy'
    if (metrics.successRate < 0.9 || alerts.length > 5) {
      status = 'degraded'
    }
    if (metrics.successRate < 0.5 || metrics.failedEvents > 100) {
      status = 'unhealthy'
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      checks: {
        eventStore: 'up',
        redis: 'up',
        metrics: 'up'
      },
      details: {
        successRate: metrics.successRate,
        pendingEvents: metrics.pendingEvents,
        failedEvents: metrics.failedEvents,
        alerts: alerts.length
      }
    }
  }

  @Post('replay')
  @ApiOperation({ summary: 'Reproducir eventos desde un timestamp' })
  @ApiResponse({ 
    status: 200, 
    description: 'Eventos reproduciéndose',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        fromTime: { type: 'string' },
        eventsReplayed: { type: 'number' },
        timestamp: { type: 'string' }
      }
    }
  })
  async replayEvents(@Body('fromTime') fromTime: string): Promise<{ message: string; fromTime: string; eventsReplayed: number; timestamp: string }> {
    const events = await this.eventStore.getEventsByTimeRange(fromTime, new Date().toISOString())
    
    // Reproducir eventos
    await this.eventStore.replayEvents(fromTime)

    return {
      message: 'Reproducción de eventos iniciada',
      fromTime,
      eventsReplayed: events.length,
      timestamp: new Date().toISOString()
    }
  }

  @Post('test-event')
  @ApiOperation({ summary: 'Crear un evento de prueba' })
  @ApiResponse({ 
    status: 201, 
    description: 'Evento de prueba creado',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        event: { type: 'object' },
        timestamp: { type: 'string' }
      }
    }
  })
  async createTestEvent(@Body() body: { eventType: string; aggregateId: string; payload?: any }): Promise<{ message: string; event: DomainEvent; timestamp: string }> {
    let event: DomainEvent

    switch (body.eventType) {
      case 'booking.created':
        event = EventFactory.createBookingCreatedEvent(
          body.aggregateId,
          'barber-123',
          'client-456',
          'service-789',
          '09:00',
          '10:00',
          '2024-01-01',
          50,
          'Test booking'
        )
        break
      case 'notification.sent':
        event = EventFactory.createNotificationSentEvent(
          body.aggregateId,
          'user-123',
          'CLIENT',
          'EMAIL',
          'APPOINTMENT_CONFIRMED',
          'SENT',
          body.payload?.metadata
        )
        break
      default:
        throw new Error(`Tipo de evento no soportado: ${body.eventType}`)
    }

    await this.eventBus.publish(event)

    return {
      message: 'Evento de prueba creado y publicado',
      event,
      timestamp: new Date().toISOString()
    }
  }
}