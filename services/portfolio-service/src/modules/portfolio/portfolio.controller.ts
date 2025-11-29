import { Body, Controller, Post, Get } from '@nestjs/common'

@Controller('portfolio')
export class PortfolioController {
  @Post('items')
  addItem(@Body() _dto: any) {
    return { status: 'stub', action: 'addItem' }
  }

  @Get('health')
  health() {
    return { status: 'ok', service: 'portfolio' }
  }
}