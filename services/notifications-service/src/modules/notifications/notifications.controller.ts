import { Controller, Get } from '@nestjs/common'

@Controller('notifications')
export class NotificationsController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'notifications' }
  }
}