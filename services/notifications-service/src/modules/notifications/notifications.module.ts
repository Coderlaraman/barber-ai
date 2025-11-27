import { Module } from '@nestjs/common'
import { NotificationsController } from './notifications.controller'
import { NotificationsService } from './notifications.service'
import { RedisSubscriber } from '../../infrastructure/redis/redis.subscriber'

@Module({ controllers: [NotificationsController], providers: [NotificationsService, RedisSubscriber] })
export class NotificationsModule {}