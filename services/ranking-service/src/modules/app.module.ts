import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { RankingModule } from './ranking/ranking.module'

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), RankingModule] })
export class AppModule {}