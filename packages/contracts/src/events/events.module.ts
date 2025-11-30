import { Module, DynamicModule, Provider } from '@nestjs/common'
import { EventBusService } from '../services/event-bus.service'
import { InMemoryEventStore } from '../services/event-store.service'
import { PostgresEventStore } from '../services/postgres-event-store.service'
import { EventReplayService } from '../services/event-replay.service'

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

    const providers: Provider[] = [
      {
        provide: 'EVENT_STORE',
        useClass: useInMemoryStore ? InMemoryEventStore : PostgresEventStore,
      },
      {
        provide: EventBusService,
        useFactory: (eventStore: any) => {
          const service = new EventBusService(eventStore)
          // La conexión se hace en el onModuleInit
          return service
        },
        inject: ['EVENT_STORE'],
      },
      EventReplayService,
    ]

    return {
      module: EventsModule,
      providers,
      exports: [EventBusService, 'EVENT_STORE', EventReplayService],
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