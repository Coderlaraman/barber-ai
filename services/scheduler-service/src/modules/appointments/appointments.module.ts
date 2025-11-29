import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentHistory } from './entities/appointment-history.entity';
import { AppointmentRepository } from './repositories/appointment.repository';
import { AppointmentHistoryRepository } from './repositories/appointment-history.repository';
import { AppointmentDomainService } from './services/appointment-domain.service';
import { AppointmentsController } from './controllers/appointments.controller';
import { TimeSlotsModule } from '../time-slots/time-slots.module';
import { ServicesModule } from '../services/services.module';
import { AvailabilityModule } from '../availability/availability.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, AppointmentHistory]),
    TimeSlotsModule,
    ServicesModule,
    AvailabilityModule,
  ],
  controllers: [AppointmentsController],
  providers: [
    AppointmentRepository,
    AppointmentHistoryRepository,
    AppointmentDomainService,
  ],
  exports: [
    AppointmentRepository,
    AppointmentHistoryRepository,
    AppointmentDomainService,
  ],
})
export class AppointmentsModule {}