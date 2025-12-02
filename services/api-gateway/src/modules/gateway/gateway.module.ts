import { Module } from '@nestjs/common'
import { GatewayController, AvailabilityController } from './gateway.controller'
import { BarberController, SpecialtyController, ServiceController } from './barber.controller'
import { RatingController } from './rating.controller'

@Module({
  controllers: [GatewayController, AvailabilityController, BarberController, SpecialtyController, ServiceController, RatingController],
})
export class GatewayModule {}