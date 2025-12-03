import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Block } from '../../domain/entities/block.entity'

const url = process.env.DATABASE_URL

export const AppDataSource = new DataSource(
  url
    ? {
        type: 'postgres',
        url,
        entities: [Block],
        migrations: ['dist/infrastructure/typeorm/migrations/*.js'],
        synchronize: false
      }
    : {
        type: 'postgres',
        host: process.env.DB_HOST || 'postgres',
        port: Number(process.env.DB_PORT || 5432),
        username: process.env.DB_USER || 'barber',
        password: process.env.DB_PASSWORD || 'barber',
        database: process.env.DB_NAME || 'barber',
        entities: [Block],
        migrations: ['dist/infrastructure/typeorm/migrations/*.js'],
        synchronize: false
      }
)