import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NotificationsController } from './notifications.controller'
import { NotificationService } from './services/notification.service'
import { TemplateService } from './services/template.service'
import { EmailService } from './services/email.service'
import { PushNotificationService } from './services/push-notification-mock.service'
import { SMSMockService } from './services/sms-mock.service'
import { RedisSubscriber } from '../../infrastructure/redis/redis.subscriber'
import { NotificationEventHandler } from '../../events/notification-event.handler'
import { EventHandlersConfigService } from '../../events/event-handlers-config.service'
import { CompleteEventsModule } from 'contracts'
import { Repository } from '../../typeorm-mock'
import { Notification } from './entities/notification.entity'
import { UserNotificationPreference } from './entities/user-notification-preference.entity'

@Module({ 
  imports: [
    CompleteEventsModule.forRoot({
      useInMemoryStore: true,
      enableMetrics: true,
      enableDeadLetterQueue: false,
      enableDashboard: false
    })
  ],
  controllers: [NotificationsController], 
  providers: [
    {
      provide: 'NotificationRepository',
      useValue: {
        findOne: async (): Promise<any> => null,
        find: async (): Promise<any[]> => [],
        save: async (entity: any): Promise<any> => entity,
        create: (entity: any): any => entity,
        delete: async (): Promise<void> => {},
        update: async (): Promise<void> => {},
        count: async (): Promise<number> => 0
      } as Repository<Notification>
    },
    {
      provide: 'UserNotificationPreferenceRepository',
      useValue: {
        findOne: async (): Promise<any> => null,
        find: async (): Promise<any[]> => [],
        save: async (entity: any): Promise<any> => entity,
        create: (entity: any): any => entity,
        delete: async (): Promise<void> => {},
        update: async (): Promise<void> => {},
        count: async (): Promise<number> => 0
      } as Repository<UserNotificationPreference>
    },
    {
      provide: 'TemplateRepository',
      useValue: {
        findOne: async (): Promise<any> => null,
        find: async (): Promise<any[]> => [],
        save: async (entity: any): Promise<any> => entity,
        create: (entity: any): any => entity,
        delete: async (): Promise<void> => {},
        update: async (): Promise<void> => {},
        count: async (): Promise<number> => 0
      }
    },
    {
      provide: TemplateService,
      useFactory: (templateRepo) => {
        const service = new TemplateService(templateRepo);
        return service;
      },
      inject: ['TemplateRepository']
    },
    ConfigService,
    NotificationService,
    EmailService,
    PushNotificationService,
    SMSMockService,
    RedisSubscriber,
    NotificationEventHandler,
    EventHandlersConfigService
  ] 
})
export class NotificationsModule {}