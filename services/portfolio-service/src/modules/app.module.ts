import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PortfolioModule } from './portfolio/portfolio.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PortfolioItem } from '../domain/entities/portfolio_item.entity'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const url = process.env.DATABASE_URL
        const base: any = { type: 'postgres', entities: [PortfolioItem], synchronize: false }
        if (url) return { ...base, url }
        return {
          ...base,
          host: process.env.DB_HOST || 'postgres',
          port: Number(process.env.DB_PORT || 5432),
          username: process.env.DB_USER || 'barber',
          password: process.env.DB_PASSWORD || 'barber',
          database: process.env.DB_NAME || 'barber'
        }
      }
    }),
    PortfolioModule
  ]
})
export class AppModule {}