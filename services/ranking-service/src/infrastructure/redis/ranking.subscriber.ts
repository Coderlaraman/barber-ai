import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { RankingService } from '../../modules/ranking/ranking.service'

@Injectable()
export class RankingSubscriber {
  private readonly logger = new Logger(RankingSubscriber.name)

  constructor(private readonly rankingService: RankingService) {}

  @OnEvent('rating.created')
  async handleRatingCreated(payload: {
    ratingId: string
    barberId: string
    rating: number
    aspects?: Record<string, number>
    timestamp?: Date
  }) {
    this.logger.log(`Processing rating.created event for barber ${payload.barberId}`)
    
    try {
      await this.rankingService.processRatingEvent({
        ratingId: payload.ratingId,
        barberId: payload.barberId,
        rating: payload.rating,
        aspects: payload.aspects,
        timestamp: payload.timestamp || new Date(),
      })
      
      this.logger.log(`Successfully processed rating event for barber ${payload.barberId}`)
    } catch (error) {
      this.logger.error(`Failed to process rating event: ${error instanceof Error ? error.message : String(error)}`)
      // Don't throw to prevent event bus interruption
    }
  }

  @OnEvent('rating.updated')
  async handleRatingUpdated(payload: {
    ratingId: string
    barberId: string
    oldRating: number
    newRating: number
    aspects?: Record<string, number>
    timestamp?: Date
  }) {
    this.logger.log(`Processing rating.updated event for barber ${payload.barberId}`)
    
    try {
      // For updates, we need to recalculate the ranking
      // This is a simplified approach - in a real system, you might want to store the old rating
      // and adjust the metrics accordingly
      await this.rankingService.processRatingEvent({
        ratingId: payload.ratingId,
        barberId: payload.barberId,
        rating: payload.newRating,
        aspects: payload.aspects,
        timestamp: payload.timestamp || new Date(),
      })
      
      this.logger.log(`Successfully processed rating update event for barber ${payload.barberId}`)
    } catch (error) {
      this.logger.error(`Failed to process rating update event: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  @OnEvent('appointment.completed')
  async handleAppointmentCompleted(payload: {
    appointmentId: string
    barberId: string
    clientId: string
    revenue: number
    timestamp?: Date
  }) {
    this.logger.log(`Processing appointment.completed event for barber ${payload.barberId}`)
    
    try {
      await this.rankingService.processBusinessEvent({
        barberId: payload.barberId,
        revenue: payload.revenue,
        completedAppointments: 1,
        timestamp: payload.timestamp || new Date(),
      })
      
      this.logger.log(`Successfully processed appointment completion event for barber ${payload.barberId}`)
    } catch (error) {
      this.logger.error(`Failed to process appointment completion event: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  @OnEvent('ranking.recalculate')
  async handleRankingRecalculate(payload: {
    period: string
    reason?: string
    timestamp?: Date
  }) {
    this.logger.log(`Processing ranking.recalculate event for period ${payload.period}`)
    
    try {
      await this.rankingService.recalculateAllRankings(payload.period)
      this.logger.log(`Successfully recalculated rankings for period ${payload.period}`)
    } catch (error) {
      this.logger.error(`Failed to recalculate rankings: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  @OnEvent('barber.service.created')
  async handleBarberServiceCreated(payload: {
    barberId: string
    serviceId: string
    serviceName: string
    price: number
    timestamp?: Date
  }) {
    this.logger.log(`Processing barber.service.created event for barber ${payload.barberId}`)
    
    // This could be used to track service diversity and specialization metrics
    // For now, we'll just log it as it's processed by other services
    this.logger.log(`Barber ${payload.barberId} created service ${payload.serviceName} for $${payload.price}`)
  }
}