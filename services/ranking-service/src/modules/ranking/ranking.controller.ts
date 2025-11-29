import { Controller, Post, Get } from '@nestjs/common'

@Controller('ranking')
export class RankingController {
  @Post('recalculate')
  recalculate() {
    return { status: 'stub', action: 'recalculate' }
  }

  @Get('health')
  health() {
    return { status: 'ok', service: 'ranking' }
  }
}