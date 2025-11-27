import { Module } from '@nestjs/common'
import { SchedulerController } from './scheduler.controller'
import { SchedulerService } from './scheduler.service'
import { RedisPublisher } from '../../infrastructure/redis/redis.publisher'
import { SchedulerRepository } from '../../infrastructure/persistence/scheduler.repository'

@Module({ controllers: [SchedulerController], providers: [SchedulerService, RedisPublisher, SchedulerRepository] })
export class SchedulerModule {}