import { Body, Controller, Post } from '@nestjs/common'

@Controller('portfolio')
export class PortfolioController {
  @Post('items')
  addItem(@Body() _dto: any) {
    return { status: 'stub', action: 'addItem' }
  }
}