import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BarberAvailability } from './entities/barber-availability.entity';
import { BarberAvailabilityRepository } from './repositories/barber-availability.repository';
import { AvailabilityDomainService } from './services/availability-domain.service';
import { AvailabilityController } from './controllers/availability.controller';
import { TimeSlotsModule } from '../time-slots/time-slots.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BarberAvailability]),
    TimeSlotsModule,
  ],
  controllers: [AvailabilityController],
  providers: [
    BarberAvailabilityRepository,
    AvailabilityDomainService,
  ],
  exports: [
    BarberAvailabilityRepository,
    AvailabilityDomainService,
  ],
})
export class AvailabilityModule {}