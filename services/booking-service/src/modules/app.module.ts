import { Module, OnModuleInit } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ScheduleModule } from '@nestjs/schedule'
import { CompleteEventsModule, EventBusService } from '@barber_ai/contracts'
import { BookingModule } from './booking/booking.module'
import { BookingEventProcessor } from './booking/services/booking-event.processor'
import { databaseConfig } from '../config/database.config'
import { HealthModule } from './health/health.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(databaseConfig()),
    ScheduleModule.forRoot(),
    CompleteEventsModule.forRoot({
      enableDeadLetterQueue: true,
      useInMemoryStore: false
    }),
    BookingModule,
    HealthModule
  ],
  providers: [BookingEventProcessor]
})
export class AppModule implements OnModuleInit {
  constructor(
    private eventBus: EventBusService,
    private bookingEventProcessor: BookingEventProcessor
  ) {}

  async onModuleInit() {
    // Registrar el procesador de eventos con el EventBus
    this.eventBus.subscribe('BOOKING', 'booking.created', this.bookingEventProcessor)
    this.eventBus.subscribe('BOOKING', 'booking.cancelled', this.bookingEventProcessor)
    this.eventBus.subscribe('BOOKING', 'booking.rescheduled', this.bookingEventProcessor)
    this.eventBus.subscribe('BOOKING', 'booking.confirmed', this.bookingEventProcessor)
    console.log('BookingEventProcessor registrado con EventBus')
  }
}