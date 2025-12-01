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
        findOne: async (): Promise<any> => ({
          id: 'mock-preference-id',
          userId: 'mock-user-id',
          emailEnabled: true,
          pushEnabled: true,
          smsEnabled: false,
          inAppEnabled: true,
          appointmentReminders: true,
          promotionalEmails: true,
          bookingConfirmations: true,
          paymentNotifications: true,
          reviewRequests: true,
          systemUpdates: true,
          quietHoursStart: null,
          quietHoursEnd: null,
          timezone: 'America/Mexico_City',
          createdAt: new Date(),
          updatedAt: new Date(),
          isChannelEnabled: (channel: any) => {
            switch (channel) {
              case 'email': return true
              case 'push': return true
              case 'sms': return false
              case 'in_app': return true
              default: return false
            }
          },
          isNotificationTypeEnabled: (type: string) => {
            switch (type) {
              case 'appointment_reminder': return true
              case 'promotional': return true
              case 'booking_confirmation': return true
              case 'payment': return true
              case 'review_request': return true
              case 'system_update': return true
              default: return true
            }
          }
        }),
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