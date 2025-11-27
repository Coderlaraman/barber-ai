import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { SchedulerModule } from './scheduler/scheduler.module'

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), SchedulerModule] })
export class AppModule {}