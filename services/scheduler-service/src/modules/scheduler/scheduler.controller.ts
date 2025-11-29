import { Body, Controller, Get, Post } from '@nestjs/common'

@Controller('scheduler')
export class SchedulerController {
  @Post('blocks')
  createBlock(@Body() _dto: any) {
    return { status: 'stub', action: 'createBlock' }
  }

  @Post('blocks/release')
  releaseBlock(@Body() _dto: any) {
    return { status: 'stub', action: 'releaseBlock' }
  }

  @Get('availability')
  getAvailability() {
    return { status: 'stub', availability: [] }
  }

  @Get('health')
  health() {
    return { status: 'ok', service: 'scheduler' }
  }
}