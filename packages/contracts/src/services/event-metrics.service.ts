import { Injectable, Logger } from '@nestjs/common'
import { EventBusService } from './event-bus.service'
import { PostgresEventStore } from './postgres-event-store.service'

export interface EventMetrics {
  // Métricas generales
  totalEvents: number
  eventsLast24Hours: number
  eventsLastHour: number
  averageEventsPerMinute: number
  
  // Métricas por tipo
  eventsByType: Record<string, number>
  eventsByAggregate: Record<string, number>
  eventsByStatus: Record<string, number>
  
  // Métricas de rendimiento
  averageProcessingTime: number
  eventsPerSecond: number
  
  // Métricas de salud
  failedEvents: number
  pendingEvents: number
  deadLetterEvents: number
  successRate: number
  
  // Métricas de Redis
  redisConnectedClients: number
  redisUsedMemory: number
  redisKeyspaceHits: number
  redisKeyspaceMisses: number
  
  // Timestamps
  lastEventTimestamp: string
  lastFailedEventTimestamp?: string
  metricsCalculatedAt: string
}

export interface EventDashboardData {
  metrics: EventMetrics
  recentEvents: any[]
  failedEvents: any[]
  pendingEvents: any[]
  topEventTypes: Array<{ type: string; count: number }>
  topAggregates: Array<{ type: string; count: number }>
  hourlyStats: Array<{ hour: string; count: number }>
  dailyStats: Array<{ date: string; count: number }>
}

@Injectable()
export class EventMetricsService {
  private readonly logger = new Logger(EventMetricsService.name)
  private metricsCache: EventMetrics | null = null
  private cacheExpiry = 30000 // 30 segundos
  private lastCacheUpdate = 0

  constructor(
    private readonly eventBus: EventBusService,
    private readonly eventStore: PostgresEventStore
  ) {}

  /**
   * Obtiene las métricas actuales del sistema de eventos
   */
  async getMetrics(): Promise<EventMetrics> {
    const now = Date.now()
    
    // Usar caché si está vigente
    if (this.metricsCache && (now - this.lastCacheUpdate) < this.cacheExpiry) {
      return this.metricsCache
    }

    try {
      // Obtener estadísticas del EventStore
      const storeStats = await this.eventStore.getEventStats()
      
      // Obtener estadísticas de Redis del EventBus
      const redisStats = await this.getRedisStats()
      
      // Calcular métricas de rendimiento
      const performanceMetrics = await this.calculatePerformanceMetrics()
      
      // Construir objeto de métricas
      const metrics: EventMetrics = {
        // Métricas generales
        totalEvents: storeStats.totalEvents,
        eventsLast24Hours: storeStats.eventsLast24Hours,
        eventsLastHour: await this.getEventsLastHour(),
        averageEventsPerMinute: await this.calculateAverageEventsPerMinute(),
        
        // Métricas por tipo
        eventsByType: storeStats.eventsByType,
        eventsByAggregate: storeStats.eventsByAggregate,
        eventsByStatus: storeStats.eventsByStatus,
        
        // Métricas de rendimiento
        averageProcessingTime: performanceMetrics.averageProcessingTime,
        eventsPerSecond: performanceMetrics.eventsPerSecond,
        
        // Métricas de salud
        failedEvents: storeStats.failedEvents,
        pendingEvents: storeStats.pendingEvents,
        deadLetterEvents: await this.getDeadLetterEventsCount(),
        successRate: await this.calculateSuccessRate(),
        
        // Métricas de Redis
        redisConnectedClients: redisStats.connectedClients,
        redisUsedMemory: redisStats.usedMemory,
        redisKeyspaceHits: redisStats.keyspaceHits,
        redisKeyspaceMisses: redisStats.keyspaceMisses,
        
        // Timestamps
        lastEventTimestamp: await this.getLastEventTimestamp(),
        lastFailedEventTimestamp: await this.getLastFailedEventTimestamp(),
        metricsCalculatedAt: new Date().toISOString()
      }

      // Actualizar caché
      this.metricsCache = metrics
      this.lastCacheUpdate = now

      return metrics
    } catch (error) {
      this.logger.error('Error calculando métricas:', error)
      throw error
    }
  }

  /**
   * Obtiene todos los datos para el dashboard
   */
  async getDashboardData(): Promise<EventDashboardData> {
    try {
      const [metrics, recentEvents, failedEvents, pendingEvents] = await Promise.all([
        this.getMetrics(),
        this.getRecentEvents(20),
        this.eventStore.getFailedEvents(10),
        this.eventStore.getPendingEvents(10)
      ])

      const topEventTypes = this.getTopItems(metrics.eventsByType, 5)
      const topAggregates = this.getTopItems(metrics.eventsByAggregate, 5)
      const hourlyStats = await this.getHourlyStats()
      const dailyStats = await this.getDailyStats()

      return {
        metrics,
        recentEvents,
        failedEvents,
        pendingEvents,
        topEventTypes,
        topAggregates,
        hourlyStats,
        dailyStats
      }
    } catch (error) {
      this.logger.error('Error obteniendo datos del dashboard:', error)
      throw error
    }
  }

  /**
   * Obtiene alertas basadas en las métricas actuales
   */
  async getAlerts(): Promise<Array<{
    type: 'warning' | 'error' | 'info'
    message: string
    timestamp: string
    metric?: string
    value?: number
    threshold?: number
  }>> {
    const metrics = await this.getMetrics()
    const alerts: any[] = []
    const now = new Date().toISOString()

    // Alertas de tasa de fallos
    if (metrics.successRate < 0.95) {
      alerts.push({
        type: 'error',
        message: `Tasa de éxito baja: ${(metrics.successRate * 100).toFixed(1)}%`,
        timestamp: now,
        metric: 'successRate',
        value: metrics.successRate,
        threshold: 0.95
      })
    }

    // Alertas de eventos pendientes
    if (metrics.pendingEvents > 100) {
      alerts.push({
        type: 'warning',
        message: `Muchos eventos pendientes: ${metrics.pendingEvents}`,
        timestamp: now,
        metric: 'pendingEvents',
        value: metrics.pendingEvents,
        threshold: 100
      })
    }

    // Alertas de eventos fallidos
    if (metrics.failedEvents > 50) {
      alerts.push({
        type: 'error',
        message: `Muchos eventos fallidos: ${metrics.failedEvents}`,
        timestamp: now,
        metric: 'failedEvents',
        value: metrics.failedEvents,
        threshold: 50
      })
    }

    // Alertas de rendimiento
    if (metrics.averageProcessingTime > 5000) {
      alerts.push({
        type: 'warning',
        message: `Tiempo de procesamiento alto: ${metrics.averageProcessingTime}ms`,
        timestamp: now,
        metric: 'averageProcessingTime',
        value: metrics.averageProcessingTime,
        threshold: 5000
      })
    }

    return alerts
  }

  // Métodos privados auxiliares

  private async getRedisStats(): Promise<{
    connectedClients: number
    usedMemory: number
    keyspaceHits: number
    keyspaceMisses: number
  }> {
    // En una implementación real, esto se conectaría a Redis
    // Por ahora, retornamos valores simulados
    return {
      connectedClients: Math.floor(Math.random() * 10) + 1,
      usedMemory: Math.floor(Math.random() * 1000000) + 100000,
      keyspaceHits: Math.floor(Math.random() * 1000) + 100,
      keyspaceMisses: Math.floor(Math.random() * 100) + 10
    }
  }

  private async calculatePerformanceMetrics(): Promise<{
    averageProcessingTime: number
    eventsPerSecond: number
  }> {
    // Simular cálculo de métricas de rendimiento
    // En producción, esto se calcularía con datos reales
    return {
      averageProcessingTime: Math.floor(Math.random() * 2000) + 100,
      eventsPerSecond: Math.floor(Math.random() * 100) + 10
    }
  }

  private async getEventsLastHour(): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const events = await this.eventStore.getEventsByTimeRange(oneHourAgo, new Date().toISOString())
    return events.length
  }

  private async calculateAverageEventsPerMinute(): Promise<number> {
    const eventsLastHour = await this.getEventsLastHour()
    return Math.round(eventsLastHour / 60)
  }

  private async getDeadLetterEventsCount(): Promise<number> {
    // Por ahora, retornamos un valor simulado
    // En producción, esto consultaría la dead letter queue
    return Math.floor(Math.random() * 10)
  }

  private async calculateSuccessRate(): Promise<number> {
    const stats = await this.eventStore.getEventStats()
    const total = stats.totalEvents
    const failed = stats.failedEvents
    
    if (total === 0) return 1
    return (total - failed) / total
  }

  private async getLastEventTimestamp(): Promise<string> {
    const allEvents = await this.eventStore.getAllEvents()
    if (allEvents.length === 0) {
      return new Date().toISOString()
    }
    return allEvents[allEvents.length - 1].timestamp
  }

  private async getLastFailedEventTimestamp(): Promise<string | undefined> {
    const failedEvents = await this.eventStore.getFailedEvents(1)
    return failedEvents.length > 0 ? failedEvents[0].createdAt.toISOString() : undefined
  }

  private async getRecentEvents(limit: number): Promise<any[]> {
    const allEvents = await this.eventStore.getAllEvents()
    return allEvents.slice(-limit).reverse()
  }

  private getTopItems(items: Record<string, number>, limit: number): Array<{ type: string; count: number }> {
    return Object.entries(items)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([type, count]) => ({ type, count }))
  }

  private async getHourlyStats(): Promise<Array<{ hour: string; count: number }>> {
    // Simular estadísticas por hora
    const stats = []
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(Date.now() - i * 60 * 60 * 1000)
      stats.push({
        hour: hour.getHours().toString().padStart(2, '0') + ':00',
        count: Math.floor(Math.random() * 100) + 10
      })
    }
    return stats
  }

  private async getDailyStats(): Promise<Array<{ date: string; count: number }>> {
    // Simular estadísticas diarias
    const stats = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      stats.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 1000) + 100
      })
    }
    return stats
  }
}