import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeSlot } from './entities/time-slot.entity';
import { TimeSlotRepository } from './repositories/time-slot.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TimeSlot])],
  providers: [TimeSlotRepository],
  exports: [TimeSlotRepository],
})
export class TimeSlotsModule {}