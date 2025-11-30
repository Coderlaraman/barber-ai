import { Module, OnModuleInit } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ScheduleModule } from '@nestjs/schedule'
import { CompleteEventsModule, EventBusService } from 'contracts'
import { BookingModule } from './booking/booking.module'
import { BookingEventProcessor } from './booking/services/booking-event.processor'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'barberia_booking',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development'
    }),
    ScheduleModule.forRoot(),
    CompleteEventsModule.forRoot({
      enableDeadLetterQueue: true,
      useInMemoryStore: false
    }),
    BookingModule
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