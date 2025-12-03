import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { RatingsService } from './ratings.service'
import { CreateRatingDto } from './dto/create-rating.dto'

@ApiTags('Ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new rating' })
  @ApiResponse({ status: 201, description: 'The rating has been successfully created.' })
  create(@Body() createRatingDto: CreateRatingDto) {
    return this.ratingsService.create(createRatingDto)
  }

  @Get('barber/:barberId')
  @ApiOperation({ summary: 'Get ratings by barber' })
  findAllByBarber(@Param('barberId') barberId: string) {
    return this.ratingsService.findAllByBarber(barberId)
  }

  @Get()
  @ApiOperation({ summary: 'Get all ratings' })
  findAll() {
    return this.ratingsService.findAll()
  }
}
