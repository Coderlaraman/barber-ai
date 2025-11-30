import { Module } from '@nestjs/common'
import { NotificationsController } from './notifications.controller'
import { NotificationService } from './services/notification.service'
import { TemplateService } from './services/template.service'
import { EmailService } from './services/email.service'
import { PushNotificationService } from './services/push-notification-mock.service'
import { SMSMockService } from './services/sms-mock.service'
import { RedisSubscriber } from '../../infrastructure/redis/redis.subscriber'

@Module({ 
  controllers: [NotificationsController], 
  providers: [
    NotificationService, 
    TemplateService,
    EmailService,
    PushNotificationService,
    SMSMockService,
    RedisSubscriber
  ] 
})
export class NotificationsModule {}