import { Controller, Post } from '@nestjs/common'

@Controller('ranking')
export class RankingController {
  @Post('recalculate')
  recalculate() {
    return { status: 'stub', action: 'recalculate' }
  }
}