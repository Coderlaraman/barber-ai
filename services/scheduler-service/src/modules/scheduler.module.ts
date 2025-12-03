import { Module } from '@nestjs/common';
import { AvailabilityModule } from './availability/availability.module';
import { ServicesModule } from './services/services.module';
import { TimeSlotsModule } from './time-slots/time-slots.module';

@Module({
  imports: [
    AvailabilityModule,
    ServicesModule,
    TimeSlotsModule,
  ],
  exports: [
    AvailabilityModule,
    ServicesModule,
    TimeSlotsModule,
  ],
})
export class SchedulerModule {}