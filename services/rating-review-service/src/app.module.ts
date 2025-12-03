import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RatingsModule } from './modules/ratings/ratings.module'
import { Rating } from './modules/ratings/entities/rating.entity'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const url = process.env.DATABASE_URL
        const base: any = { 
          type: 'postgres', 
          entities: [Rating], 
          synchronize: true 
        }
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
    RatingsModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
