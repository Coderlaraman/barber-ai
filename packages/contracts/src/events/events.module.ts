import { Module, DynamicModule } from '@nestjs/common'
import { EventBusService } from '../services/event-bus.service'
import { InMemoryEventStore } from '../services/event-store.service'

export interface EventsModuleOptions {
  redisUrl?: string
  useInMemoryStore?: boolean
}

/**
 * Módulo dinámico para configurar el sistema de eventos
 * Permite configurar Redis y el tipo de EventStore
 */
@Module({})
export class EventsModule {
  static forRoot(options: EventsModuleOptions = {}): DynamicModule {
    const { redisUrl = 'redis://localhost:6379', useInMemoryStore = true } = options

    const providers = [
      {
        provide: 'EVENT_STORE',
        useClass: InMemoryEventStore, // Por defecto usa memoria
      },
      {
        provide: 'REDIS_URL',
        useValue: redisUrl,
      },
      {
        provide: EventBusService,
        useFactory: (eventStore: any, redisUrl: string) => {
          const service = new EventBusService(eventStore)
          // La conexión se hace en el onModuleInit
          return service
        },
        inject: ['EVENT_STORE', 'REDIS_URL'],
      },
    ]

    return {
      module: EventsModule,
      providers,
      exports: [EventBusService, 'EVENT_STORE'],
      global: true,
    }
  }

  static forFeature(): DynamicModule {
    return {
      module: EventsModule,
      providers: [],
      exports: [EventBusService],
    }
  }
}