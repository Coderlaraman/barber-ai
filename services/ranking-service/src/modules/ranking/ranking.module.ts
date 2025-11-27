import { Module } from '@nestjs/common'
import { RankingController } from './ranking.controller'
import { RankingService } from './ranking.service'
import { RankingSubscriber } from '../../infrastructure/redis/ranking.subscriber'

@Module({ controllers: [RankingController], providers: [RankingService, RankingSubscriber] })
export class RankingModule {}