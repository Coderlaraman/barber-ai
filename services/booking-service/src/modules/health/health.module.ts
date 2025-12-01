import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HealthController } from './health.controller'
import { HealthService } from './health.service'

@Module({
  imports: [
    TypeOrmModule.forRoot() // Asegurar que TypeORM esté disponible para health checks
  ],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService] // Exportar para uso en otros módulos si es necesario
})
export class HealthModule {}