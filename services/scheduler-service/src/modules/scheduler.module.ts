import { Module } from '@nestjs/common';
import { AppointmentsModule } from './appointments/appointments.module';
import { AvailabilityModule } from './availability/availability.module';
import { ServicesModule } from './services/services.module';
import { TimeSlotsModule } from './time-slots/time-slots.module';

@Module({
  imports: [
    AppointmentsModule,
    AvailabilityModule,
    ServicesModule,
    TimeSlotsModule,
  ],
  exports: [
    AppointmentsModule,
    AvailabilityModule,
    ServicesModule,
    TimeSlotsModule,
  ],
})
export class SchedulerModule {}