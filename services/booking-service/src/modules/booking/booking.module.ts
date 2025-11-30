import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BookingController } from './controllers/booking.controller'
import { BookingService } from './services/booking.service'
import { Booking } from './entities/booking.entity'
import { BookingEventProcessor } from './services/booking-event.processor'
import { BookingReminderService } from './services/booking-reminder.service'
import { EventBusService } from 'contracts'

@Module({
  imports: [TypeOrmModule.forFeature([Booking])],
  controllers: [BookingController],
  providers: [BookingService, BookingEventProcessor, BookingReminderService],
  exports: [BookingService, BookingEventProcessor, BookingReminderService]
})
export class BookingModule {}