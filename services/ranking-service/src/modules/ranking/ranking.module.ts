import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { RankingController } from './ranking.controller'
import { RankingService } from './ranking.service'
import { RankingSubscriber } from '../../infrastructure/redis/ranking.subscriber'
import { Ranking } from './entities/ranking.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Ranking]),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
  ],
  controllers: [RankingController],
  providers: [RankingService, RankingSubscriber],
  exports: [RankingService],
})
export class RankingModule {}