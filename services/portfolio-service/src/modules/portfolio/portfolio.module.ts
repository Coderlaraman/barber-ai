import { Module } from '@nestjs/common'
import { PortfolioController } from './portfolio.controller'
import { PortfolioService } from './portfolio.service'
import { StorageClient } from '../../infrastructure/storage/storage.client'

@Module({ controllers: [PortfolioController], providers: [PortfolioService, StorageClient] })
export class PortfolioModule {}