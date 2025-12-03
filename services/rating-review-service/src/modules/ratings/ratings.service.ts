import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Rating } from './entities/rating.entity'
import { CreateRatingDto } from './dto/create-rating.dto'

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private ratingsRepository: Repository<Rating>
  ) {}

  async create(createRatingDto: CreateRatingDto): Promise<Rating> {
    const rating = this.ratingsRepository.create(createRatingDto)
    return this.ratingsRepository.save(rating)
  }

  async findAllByBarber(barberId: string): Promise<Rating[]> {
    return this.ratingsRepository.find({ where: { barberId } })
  }

  async findAll(): Promise<Rating[]> {
    return this.ratingsRepository.find()
  }
}
