import { Controller, Get, Query } from '@nestjs/common'

@Controller('search')
export class SearchController {
  @Get()
  search(@Query() _q: any) {
    return { status: 'stub', results: [] }
  }

  @Get('health')
  health() {
    return { status: 'ok', service: 'search' }
  }
}