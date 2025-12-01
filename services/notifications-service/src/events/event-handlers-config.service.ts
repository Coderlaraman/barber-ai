import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { EventBusService } from '@barber_ai/contracts'
import { NotificationEventHandler } from './notification-event.handler'

/**
 * Servicio para configurar los handlers de eventos al iniciar la aplicación
 */
@Injectable()
export class EventHandlersConfigService implements OnModuleInit {
  private readonly logger = new Logger(EventHandlersConfigService.name)

  constructor(
    private readonly eventBus: EventBusService,
    private readonly notificationEventHandler: NotificationEventHandler
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('🔄 Configurando handlers de eventos...')
    
    // Registrar el NotificationEventHandler para los tipos de eventos que maneja
    const handledEventTypes = [
      'booking.created',
      'booking.confirmed',
      'booking.cancelled',
      'booking.rescheduled',
      'booking.completed',
      'payment.confirmed',
      'payment.failed',
      'user.registered',
      'user.verified',
      'review.created'
    ]
    
    // Suscribir el handler a cada tipo de evento
    for (const eventType of handledEventTypes) {
      const aggregateType = eventType.split('.')[0] // 'booking', 'payment', 'user', 'review'
      this.eventBus.subscribe(aggregateType, eventType, this.notificationEventHandler)
      this.logger.log(`✅ Handler registrado para: ${eventType}`)
    }
    
    this.logger.log('✅ Configuración de handlers completada')
  }
}