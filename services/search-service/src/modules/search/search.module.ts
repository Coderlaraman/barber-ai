import { Module } from '@nestjs/common'
import { SearchController } from './search.controller'
import { SearchService } from './search.service'
import { CacheClient } from '../../infrastructure/cache/cache.client'

@Module({ controllers: [SearchController], providers: [SearchService, CacheClient] })
export class SearchModule {}