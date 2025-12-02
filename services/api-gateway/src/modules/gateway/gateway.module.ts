import { Module } from '@nestjs/common'
import { GatewayController, AvailabilityController } from './gateway.controller'
import { BarberController, SpecialtyController, ServiceController } from './barber.controller'

@Module({
  controllers: [GatewayController, AvailabilityController, BarberController, SpecialtyController, ServiceController],
})
export class GatewayModule {}