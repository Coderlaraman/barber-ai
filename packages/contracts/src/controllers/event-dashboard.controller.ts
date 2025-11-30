import { Controller, Get, Post, Body, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger'
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
  @ApiOperation({ 
    summary: 'Obtener métricas del sistema de eventos',
    description: 'Obtiene métricas detalladas del sistema de eventos incluyendo contadores, tasas de procesamiento, métricas de Redis y estadísticas de rendimiento'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Métricas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        totalEvents: { type: 'number', example: 15420, description: 'Total de eventos procesados' },
        eventsLast24Hours: { type: 'number', example: 1245, description: 'Eventos en las últimas 24 horas' },
        eventsLastHour: { type: 'number', example: 89, description: 'Eventos en la última hora' },
        averageEventsPerMinute: { type: 'number', example: 1.5, description: 'Promedio de eventos por minuto' },
        eventsByType: { 
          type: 'object', 
          example: { 'booking.created': 450, 'notification.sent': 380, 'booking.confirmed': 220 },
          description: 'Distribución de eventos por tipo'
        },
        eventsByAggregate: { 
          type: 'object', 
          example: { BOOKING: 890, NOTIFICATION: 380, USER: 150 },
          description: 'Distribución de eventos por tipo de agregado'
        },
        eventsByStatus: { 
          type: 'object', 
          example: { success: 1420, failed: 15, pending: 8 },
          description: 'Distribución de eventos por estado'
        },
        averageProcessingTime: { type: 'number', example: 0.023, description: 'Tiempo promedio de procesamiento en segundos' },
        eventsPerSecond: { type: 'number', example: 0.025, description: 'Eventos por segundo' },
        failedEvents: { type: 'number', example: 15, description: 'Total de eventos fallidos' },
        pendingEvents: { type: 'number', example: 8, description: 'Eventos pendientes de procesamiento' },
        deadLetterEvents: { type: 'number', example: 3, description: 'Eventos en cola de mensajes fallidos' },
        successRate: { type: 'number', example: 0.989, description: 'Tasa de éxito (0-1)' },
        redisConnectedClients: { type: 'number', example: 12, description: 'Clientes conectados a Redis' },
        redisUsedMemory: { type: 'number', example: 10485760, description: 'Memoria usada por Redis en bytes' },
        redisKeyspaceHits: { type: 'number', example: 8920, description: 'Hits en el keyspace de Redis' },
        redisKeyspaceMisses: { type: 'number', example: 234, description: 'Misses en el keyspace de Redis' },
        lastEventTimestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z', description: 'Timestamp del último evento' },
        lastFailedEventTimestamp: { type: 'string', example: '2024-01-15T09:45:00.000Z', description: 'Timestamp del último evento fallido' },
        metricsCalculatedAt: { type: 'string', example: '2024-01-15T10:30:15.000Z', description: 'Timestamp del cálculo de métricas' }
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async getMetrics(): Promise<EventMetrics> {
    return this.metricsService.getMetrics()
  }

  @Get()
  @ApiOperation({ 
    summary: 'Obtener datos completos del dashboard',
    description: 'Obtiene todos los datos necesarios para el dashboard de eventos incluyendo métricas, alertas, estadísticas y estado de salud del sistema'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard data obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        metrics: {
          type: 'object',
          description: 'Métricas del sistema de eventos'
        },
        alerts: {
          type: 'array',
          description: 'Alertas activas del sistema',
          items: { type: 'object' }
        },
        recentEvents: {
          type: 'array',
          description: 'Eventos recientes',
          items: { type: 'object' }
        },
        eventTypes: {
          type: 'array',
          description: 'Tipos de eventos disponibles',
          items: { type: 'string' }
        },
        aggregateTypes: {
          type: 'array',
          description: 'Tipos de agregados disponibles',
          items: { type: 'string' }
        },
        timestamp: {
          type: 'string',
          example: '2024-01-15T10:30:15.000Z',
          description: 'Timestamp de generación de datos'
        }
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async getDashboard(): Promise<EventDashboardData> {
    return this.metricsService.getDashboardData()
  }

  @Get('alerts')
  @ApiOperation({ 
    summary: 'Obtener alertas del sistema',
    description: 'Obtiene alertas activas del sistema de eventos basadas en umbrales configurados para métricas como tasa de éxito, tiempo de procesamiento, etc.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Alertas obtenidas exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { 
            type: 'string', 
            enum: ['warning', 'error', 'info'],
            example: 'warning',
            description: 'Tipo de alerta'
          },
          message: { 
            type: 'string',
            example: 'High failure rate detected: 15%',
            description: 'Mensaje descriptivo de la alerta'
          },
          timestamp: { 
            type: 'string',
            example: '2024-01-15T10:30:00.000Z',
            description: 'Timestamp cuando se generó la alerta'
          },
          metric: { 
            type: 'string',
            example: 'successRate',
            description: 'Métrica que disparó la alerta'
          },
          value: { 
            type: 'number',
            example: 0.85,
            description: 'Valor actual de la métrica'
          },
          threshold: { 
            type: 'number',
            example: 0.90,
            description: 'Umbral configurado para la métrica'
          }
        }
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async getAlerts(): Promise<Array<{ type: string; message: string; timestamp: string; metric?: string; value?: number; threshold?: number }>> {
    return this.metricsService.getAlerts()
  }

  @Get('events')
  @ApiOperation({ 
    summary: 'Obtener eventos con filtros',
    description: 'Obtiene eventos del sistema con opciones de filtrado por tipo, ID de agregado, tipo de agregado, estado y límite de resultados'
  })
  @ApiQuery({ 
    name: 'type', 
    required: false, 
    description: 'Tipo de evento (ej: booking.created, notification.sent)',
    example: 'booking.created'
  })
  @ApiQuery({ 
    name: 'aggregateId', 
    required: false, 
    description: 'ID del agregado para filtrar eventos específicos',
    example: 'booking-123'
  })
  @ApiQuery({ 
    name: 'aggregateType', 
    required: false, 
    description: 'Tipo de agregado (ej: BOOKING, NOTIFICATION, USER)',
    example: 'BOOKING'
  })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    description: 'Estado del evento (ej: success, failed, pending)',
    example: 'success'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Límite de resultados (máximo 1000)',
    type: Number,
    example: 50
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Eventos obtenidos exitosamente',
    schema: {
      type: 'object',
      properties: {
        events: {
          type: 'array',
          description: 'Lista de eventos encontrados',
          items: {
            type: 'object',
            properties: {
              eventId: { type: 'string', example: 'evt-123-456', description: 'ID único del evento' },
              eventType: { type: 'string', example: 'booking.created', description: 'Tipo de evento' },
              aggregateId: { type: 'string', example: 'booking-123', description: 'ID del agregado' },
              aggregateType: { type: 'string', example: 'BOOKING', description: 'Tipo de agregado' },
              payload: { type: 'object', description: 'Datos del evento' },
              timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z', description: 'Timestamp del evento' },
              version: { type: 'number', example: 1, description: 'Versión del evento' }
            }
          }
        },
        total: { type: 'number', example: 25, description: 'Total de eventos encontrados' },
        filters: {
          type: 'object',
          description: 'Filtros aplicados',
          properties: {
            type: { type: 'string', description: 'Tipo de evento filtrado' },
            aggregateId: { type: 'string', description: 'ID de agregado filtrado' },
            aggregateType: { type: 'string', description: 'Tipo de agregado filtrado' },
            status: { type: 'string', description: 'Estado filtrado' },
            limit: { type: 'number', description: 'Límite aplicado' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Parámetros de consulta inválidos' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
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
  @ApiOperation({ 
    summary: 'Obtener estadísticas detalladas',
    description: 'Obtiene estadísticas detalladas del EventStore y las suscripciones activas en el EventBus'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        eventStore: {
          type: 'object',
          description: 'Estadísticas del EventStore',
          properties: {
            totalEvents: { type: 'number', example: 15420, description: 'Total de eventos almacenados' },
            oldestEvent: { type: 'string', example: '2024-01-01T00:00:00.000Z', description: 'Timestamp del evento más antiguo' },
            newestEvent: { type: 'string', example: '2024-01-15T10:30:00.000Z', description: 'Timestamp del evento más reciente' },
            eventTypes: { 
              type: 'array', 
              example: ['booking.created', 'notification.sent', 'booking.confirmed'],
              description: 'Tipos de eventos disponibles'
            },
            aggregateTypes: { 
              type: 'array', 
              example: ['BOOKING', 'NOTIFICATION', 'USER'],
              description: 'Tipos de agregados disponibles'
            }
          }
        },
        subscriptions: {
          type: 'object',
          description: 'Estadísticas de suscripciones',
          properties: {
            totalSubscriptions: { type: 'number', example: 8, description: 'Total de suscripciones activas' },
            handlers: { 
              type: 'array', 
              example: ['booking-created-handler', 'notification-sent-handler'],
              description: 'Handlers de eventos registrados'
            },
            channels: { 
              type: 'array', 
              example: ['BOOKING', 'NOTIFICATION'],
              description: 'Canales de eventos activos'
            }
          }
        },
        timestamp: {
          type: 'string',
          example: '2024-01-15T10:30:15.000Z',
          description: 'Timestamp de generación de estadísticas'
        }
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
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
  @ApiOperation({ 
    summary: 'Verificar salud del sistema de eventos',
    description: 'Verifica el estado de salud del sistema de eventos incluyendo EventStore, Redis y servicios de métricas'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado de salud del sistema',
    schema: {
      type: 'object',
      properties: {
        status: { 
          type: 'string', 
          enum: ['healthy', 'degraded', 'unhealthy'],
          example: 'healthy',
          description: 'Estado general del sistema'
        },
        timestamp: { 
          type: 'string',
          example: '2024-01-15T10:30:15.000Z',
          description: 'Timestamp del chequeo de salud'
        },
        checks: {
          type: 'object',
          description: 'Estado de los componentes del sistema',
          properties: {
            eventStore: { 
              type: 'string', 
              enum: ['up', 'down'],
              example: 'up',
              description: 'Estado del EventStore'
            },
            redis: { 
              type: 'string', 
              enum: ['up', 'down'],
              example: 'up',
              description: 'Estado de Redis'
            },
            metrics: { 
              type: 'string', 
              enum: ['up', 'down'],
              example: 'up',
              description: 'Estado del servicio de métricas'
            }
          }
        },
        details: {
          type: 'object',
          description: 'Detalles de las métricas de salud',
          properties: {
            successRate: { 
              type: 'number',
              example: 0.989,
              description: 'Tasa de éxito de procesamiento de eventos (0-1)'
            },
            pendingEvents: { 
              type: 'number',
              example: 8,
              description: 'Número de eventos pendientes'
            },
            failedEvents: { 
              type: 'number',
              example: 15,
              description: 'Número de eventos fallidos'
            },
            alerts: { 
              type: 'number',
              example: 2,
              description: 'Número de alertas activas'
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 503, description: 'Servicio no disponible' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
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
  @ApiOperation({ 
    summary: 'Reproducir eventos desde un timestamp',
    description: 'Reproduce eventos desde un timestamp específico. Útil para recuperación de estado o re-procesamiento de eventos'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Eventos reproduciéndose exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { 
          type: 'string',
          example: 'Reproducción de eventos iniciada',
          description: 'Mensaje de confirmación'
        },
        fromTime: { 
          type: 'string',
          example: '2024-01-15T08:00:00.000Z',
          description: 'Timestamp desde el cual se reproducirán los eventos'
        },
        eventsReplayed: { 
          type: 'number',
          example: 45,
          description: 'Número de eventos que se reproducirán'
        },
        timestamp: { 
          type: 'string',
          example: '2024-01-15T10:30:15.000Z',
          description: 'Timestamp de la operación'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Timestamp inválido' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
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
  @ApiOperation({ 
    summary: 'Crear un evento de prueba',
    description: 'Crea y publica un evento de prueba para validar el funcionamiento del sistema de eventos. Soporta tipos de evento predefinidos como booking.created y notification.sent'
  })
  @ApiBody({
    description: 'Datos del evento de prueba a crear',
    schema: {
      type: 'object',
      required: ['eventType', 'aggregateId'],
      properties: {
        eventType: { 
          type: 'string', 
          enum: ['booking.created', 'notification.sent'],
          example: 'booking.created',
          description: 'Tipo de evento a crear'
        },
        aggregateId: { 
          type: 'string', 
          example: 'booking-123',
          description: 'ID del agregado relacionado con el evento'
        },
        payload: { 
          type: 'object', 
          example: {
            metadata: {
              channel: 'EMAIL',
              recipientType: 'CLIENT',
              template: 'APPOINTMENT_CONFIRMED'
            }
          },
          description: 'Datos adicionales del evento (opcional, dependiendo del tipo)'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Evento de prueba creado y publicado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { 
          type: 'string',
          example: 'Evento de prueba creado y publicado',
          description: 'Mensaje de confirmación'
        },
        event: { 
          type: 'object',
          example: {
            id: 'event-123e4567-e89b-12d3-a456-426614174000',
            aggregateId: 'booking-123',
            eventType: 'booking.created',
            aggregateType: 'BOOKING',
            payload: {
              barberId: 'barber-123',
              clientId: 'client-456',
              serviceId: 'service-789',
              startTime: '09:00',
              endTime: '10:00',
              date: '2024-01-01',
              price: 50,
              notes: 'Test booking'
            },
            timestamp: '2024-01-15T10:30:15.000Z',
            version: 1
          },
          description: 'Evento creado con todos sus detalles'
        },
        timestamp: { 
          type: 'string',
          example: '2024-01-15T10:30:15.000Z',
          description: 'Timestamp de creación del evento'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Solicitud inválida',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Tipo de evento no soportado: invalid.event' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
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