import { Module } from '@nestjs/common'
import { GatewayController, AvailabilityController } from './gateway.controller'

@Module({
  controllers: [GatewayController, AvailabilityController],
})
export class GatewayModule {}