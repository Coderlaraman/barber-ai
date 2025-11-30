import { Module, DynamicModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EventBusService } from '../services/event-bus.service'
import { PostgresEventStore, EventEntity, EventSnapshotEntity } from '../services/postgres-event-store.service'
import { InMemoryEventStore } from '../services/event-store.service'
import { EventMetricsService } from '../services/event-metrics.service'
import { DeadLetterQueueService } from '../services/dead-letter-queue.service'
import { EventDashboardController } from '../controllers/event-dashboard.controller'
import { RedisConfig } from '../config/redis.config'

export interface CompleteEventsModuleOptions {
  redisConfig?: RedisConfig
  useInMemoryStore?: boolean
  enableMetrics?: boolean
  enableDeadLetterQueue?: boolean
  enableDashboard?: boolean
}

/**
 * Módulo completo de eventos con todas las funcionalidades
 * Incluye: EventStore persistente, métricas, dead letter queue y dashboard
 */
@Module({})
export class CompleteEventsModule {
  static forRoot(options: CompleteEventsModuleOptions = {}): DynamicModule {
    const {
      redisConfig,
      useInMemoryStore = false,
      enableMetrics = true,
      enableDeadLetterQueue = true,
      enableDashboard = true
    } = options

    // Configuración de Redis se maneja internamente en EventBusService

    // Configurar módulos de TypeORM si se usa PostgreSQL
    const typeOrmModule = useInMemoryStore ? [] : [
      TypeOrmModule.forFeature([EventEntity, EventSnapshotEntity])
    ]

    // Proveedores base
    const providers: any[] = [
      {
        provide: 'EVENT_STORE',
        useClass: useInMemoryStore ? InMemoryEventStore : PostgresEventStore,
      }
    ]

    // Agregar EventBusService con dependencias
    providers.push({
      provide: EventBusService,
      useFactory: (eventStore: any, deadLetterQueue?: DeadLetterQueueService) => {
        const service = new EventBusService(eventStore, deadLetterQueue)
        return service
      },
      inject: ['EVENT_STORE', ...(enableDeadLetterQueue ? [DeadLetterQueueService] : [])],
    })

    // Agregar DeadLetterQueueService si está habilitado
    if (enableDeadLetterQueue) {
      providers.push(DeadLetterQueueService)
    }

    // Agregar EventMetricsService si está habilitado
    if (enableMetrics) {
      providers.push(EventMetricsService)
    }

    // Controladores
    const controllers: any[] = []
    if (enableDashboard) {
      controllers.push(EventDashboardController)
    }

    return {
      module: CompleteEventsModule,
      imports: [
        ...typeOrmModule
      ],
      providers,
      exports: [
        EventBusService,
        'EVENT_STORE',
        ...(enableMetrics ? [EventMetricsService] : []),
        ...(enableDeadLetterQueue ? [DeadLetterQueueService] : [])
      ],
      controllers,
      global: true,
    }
  }

  static forFeature(): DynamicModule {
    return {
      module: CompleteEventsModule,
      providers: [],
      exports: [EventBusService, EventMetricsService, DeadLetterQueueService],
    }
  }
}