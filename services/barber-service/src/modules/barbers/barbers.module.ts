import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BarberController } from './controllers/barber.controller';
import { BarberService } from './services/barber.service';
import { Barber } from './entities/barber.entity';
import { Specialty } from './entities/specialty.entity';
import { Service } from './entities/service.entity';
import { BarberLocation } from './entities/barber-location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Barber, Specialty, Service, BarberLocation])],
  controllers: [BarberController],
  providers: [BarberService],
  exports: [BarberService],
})
export class BarbersModule {}