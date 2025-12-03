import { Controller, Get } from '@nestjs/common'

@Controller('scheduler')
export class SchedulerController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'scheduler' }
  }
}