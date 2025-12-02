import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between, MoreThan, LessThan } from 'typeorm'
import { Ranking } from './entities/ranking.entity'
import { CreateRankingDto, UpdateRankingDto, RankingResponseDto } from './dto/ranking.dto'
import { EventEmitter2 } from '@nestjs/event-emitter'

@Injectable()
export class RankingService {
  private readonly logger = new Logger(RankingService.name)

  constructor(
    @InjectRepository(Ranking)
    private rankingRepository: Repository<Ranking>,
    private eventEmitter: EventEmitter2,
  ) {}

  async createRanking(createRankingDto: CreateRankingDto): Promise<RankingResponseDto> {
    const { barberId, period, periodStart, periodEnd } = createRankingDto

    // Check if ranking already exists for this barber and period
    const existingRanking = await this.rankingRepository.findOne({
      where: { barberId, period: period as any }
    })

    if (existingRanking) {
      throw new ConflictException(`Ranking already exists for barber ${barberId} in period ${period}`)
    }

    const ranking = this.rankingRepository.create({
      barberId,
      period: period as any,
      periodStart,
      periodEnd,
      averageRating: 0,
      totalRatings: 0,
      positiveRatings: 0,
      negativeRatings: 0,
      rankingScore: 0,
      position: 0,
      totalRevenue: 0,
      completedAppointments: 0,
    })

    const savedRanking = await this.rankingRepository.save(ranking)
    
    this.logger.log(`Created ranking for barber ${barberId} in period ${period}`)
    
    return this.toResponseDto(savedRanking)
  }

  async getRankingByBarberAndPeriod(barberId: string, period: string): Promise<RankingResponseDto> {
    const ranking = await this.rankingRepository.findOne({
      where: { barberId, period: period as any }
    })

    if (!ranking) {
      throw new NotFoundException(`Ranking not found for barber ${barberId} in period ${period}`)
    }

    return this.toResponseDto(ranking)
  }

  async getTopRankings(period: string, limit: number = 10): Promise<RankingResponseDto[]> {
    const rankings = await this.rankingRepository.find({
      where: { period: period as any },
      order: { rankingScore: 'DESC' },
      take: limit
    })

    // Update positions based on current ranking
    for (let i = 0; i < rankings.length; i++) {
      rankings[i].position = i + 1
    }

    await this.rankingRepository.save(rankings)

    return rankings.map(ranking => this.toResponseDto(ranking))
  }

  async updateRanking(barberId: string, period: string, updateRankingDto: UpdateRankingDto): Promise<RankingResponseDto> {
    const ranking = await this.rankingRepository.findOne({
      where: { barberId, period: period as any }
    })

    if (!ranking) {
      throw new NotFoundException(`Ranking not found for barber ${barberId} in period ${period}`)
    }

    Object.assign(ranking, updateRankingDto)
    ranking.rankingScore = ranking.calculateRankingScore()

    const updatedRanking = await this.rankingRepository.save(ranking)
    
    this.logger.log(`Updated ranking for barber ${barberId} in period ${period}`)
    
    return this.toResponseDto(updatedRanking)
  }

  async processRatingEvent(ratingData: {
    ratingId: string
    barberId: string
    rating: number
    aspects?: Record<string, number>
    timestamp?: Date
  }): Promise<void> {
    const { barberId, rating, aspects, timestamp = new Date() } = ratingData

    try {
      // Process for different time periods
      const periods = ['daily', 'weekly', 'monthly', 'yearly', 'all_time']
      
      for (const period of periods) {
        await this.updateRankingForPeriod(barberId, period, rating, aspects, timestamp)
      }

      // Emit event for real-time updates
      this.eventEmitter.emit('ranking.updated', {
        barberId,
        rating,
        aspects,
        timestamp,
      })

      this.logger.log(`Processed rating event for barber ${barberId}: ${rating} stars`)
    } catch (error) {
      this.logger.error(`Error processing rating event: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  private async updateRankingForPeriod(
    barberId: string,
    period: string,
    rating: number,
    aspects?: Record<string, number>,
    timestamp?: Date
  ): Promise<void> {
    // Get or create ranking for the period
    let ranking = await this.rankingRepository.findOne({
      where: { barberId, period: period as any }
    })

    if (!ranking) {
      const periodDates = this.getPeriodDates(period, timestamp)
      ranking = this.rankingRepository.create({
        barberId,
        period: period as any,
        periodStart: periodDates.start,
        periodEnd: periodDates.end,
        averageRating: 0,
        totalRatings: 0,
        positiveRatings: 0,
        negativeRatings: 0,
        rankingScore: 0,
        position: 0,
        totalRevenue: 0,
        completedAppointments: 0,
      })
    }

    // Update metrics with new rating
    ranking.updateMetrics(rating, aspects)

    await this.rankingRepository.save(ranking)
  }

  async processBusinessEvent(businessData: {
    barberId: string
    revenue: number
    completedAppointments: number
    timestamp?: Date
  }): Promise<void> {
    const { barberId, revenue, completedAppointments, timestamp = new Date() } = businessData

    try {
      const periods = ['daily', 'weekly', 'monthly', 'yearly', 'all_time']
      
      for (const period of periods) {
        let ranking = await this.rankingRepository.findOne({
          where: { barberId, period: period as any }
        })

        if (!ranking) {
          const periodDates = this.getPeriodDates(period, timestamp)
          ranking = this.rankingRepository.create({
            barberId,
            period: period as any,
            periodStart: periodDates.start,
            periodEnd: periodDates.end,
            averageRating: 0,
            totalRatings: 0,
            positiveRatings: 0,
            negativeRatings: 0,
            rankingScore: 0,
            position: 0,
            totalRevenue: 0,
            completedAppointments: 0,
          })
        }

        ranking.updateBusinessMetrics(revenue, completedAppointments)
        await this.rankingRepository.save(ranking)
      }

      this.logger.log(`Processed business event for barber ${barberId}: $${revenue} revenue, ${completedAppointments} appointments`)
    } catch (error) {
      this.logger.error(`Error processing business event: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async recalculateAllRankings(period: string): Promise<void> {
    const rankings = await this.rankingRepository.find({
      where: { period: period as any },
      order: { rankingScore: 'DESC' }
    })

    // Update positions
    for (let i = 0; i < rankings.length; i++) {
      rankings[i].position = i + 1
    }

    await this.rankingRepository.save(rankings)

    this.logger.log(`Recalculated ${rankings.length} rankings for period ${period}`)
  }

  async getRankingMetrics(barberId: string, period: string) {
    const ranking = await this.getRankingByBarberAndPeriod(barberId, period)
    
    return {
      barberId,
      period,
      averageRating: ranking.averageRating,
      totalRatings: ranking.totalRatings,
      positiveRatio: ranking.totalRatings > 0 ? (ranking.positiveRatings / ranking.totalRatings) * 100 : 0,
      negativeRatio: ranking.totalRatings > 0 ? (ranking.negativeRatings / ranking.totalRatings) * 100 : 0,
      rankingPosition: ranking.position,
      totalRevenue: ranking.totalRevenue,
      completedAppointments: ranking.completedAppointments,
      metrics: ranking.metrics,
    }
  }

  private getPeriodDates(period: string, date: Date = new Date()): { start: Date; end: Date } {
    const start = new Date(date)
    const end = new Date(date)

    switch (period) {
      case 'daily':
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'weekly':
        const dayOfWeek = start.getDay()
        start.setDate(start.getDate() - dayOfWeek)
        start.setHours(0, 0, 0, 0)
        end.setDate(start.getDate() + 6)
        end.setHours(23, 59, 59, 999)
        break
      case 'monthly':
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        end.setMonth(end.getMonth() + 1, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'yearly':
        start.setMonth(0, 1)
        start.setHours(0, 0, 0, 0)
        end.setMonth(11, 31)
        end.setHours(23, 59, 59, 999)
        break
      case 'all_time':
        start.setFullYear(2000, 0, 1)
        start.setHours(0, 0, 0, 0)
        end.setFullYear(2099, 11, 31)
        end.setHours(23, 59, 59, 999)
        break
    }

    return { start, end }
  }

  private toResponseDto(ranking: Ranking): RankingResponseDto {
    return {
      id: ranking.id,
      barberId: ranking.barberId,
      period: ranking.period,
      averageRating: ranking.averageRating,
      totalRatings: ranking.totalRatings,
      positiveRatings: ranking.positiveRatings,
      negativeRatings: ranking.negativeRatings,
      rankingScore: ranking.rankingScore,
      position: ranking.position,
      metrics: ranking.metrics || {},
      totalRevenue: ranking.totalRevenue,
      completedAppointments: ranking.completedAppointments,
      periodStart: ranking.periodStart,
      periodEnd: ranking.periodEnd,
      createdAt: ranking.createdAt,
      updatedAt: ranking.updatedAt,
    }
  }
}