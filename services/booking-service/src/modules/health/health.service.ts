import { Injectable, Logger } from '@nestjs/common'
import { InjectConnection } from '@nestjs/typeorm'
import { Connection } from 'typeorm'
import Redis from 'ioredis'

export interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  timestamp: Date
  services: {
    database: ServiceHealth
    redis: ServiceHealth
    memory: ServiceHealth
    disk: ServiceHealth
  }
  version: string
  uptime: number
}

export interface ServiceHealth {
  status: 'up' | 'down'
  responseTime?: number
  error?: string
  details?: Record<string, any>
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name)
  private readonly startTime = Date.now()
  private redisClient: Redis

  getStartTime(): number {
    return this.startTime
  }

  constructor(
    @InjectConnection() 
    private readonly connection: Connection
  ) {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    })
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const startCheck = Date.now()
    
    const [databaseHealth, redisHealth, memoryHealth, diskHealth] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMemory(),
      this.checkDisk(),
    ])

    const services = {
      database: databaseHealth.status === 'fulfilled' ? databaseHealth.value : { status: 'down' as const, error: databaseHealth.reason?.message },
      redis: redisHealth.status === 'fulfilled' ? redisHealth.value : { status: 'down' as const, error: redisHealth.reason?.message },
      memory: memoryHealth.status === 'fulfilled' ? memoryHealth.value : { status: 'down' as const, error: memoryHealth.reason?.message },
      disk: diskHealth.status === 'fulfilled' ? diskHealth.value : { status: 'down' as const, error: diskHealth.reason?.message },
    }

    const allHealthy = Object.values(services).every(service => service.status === 'up')
    const responseTime = Date.now() - startCheck

    this.logger.log(`Health check completed in ${responseTime}ms - Status: ${allHealthy ? 'HEALTHY' : 'UNHEALTHY'}`)

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date(),
      services,
      version: process.env.npm_package_version || '0.1.0',
      uptime: Date.now() - this.startTime,
    }
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now()
    
    try {
      await this.connection.query('SELECT 1')
      const responseTime = Date.now() - start
      
      // Verificar conexiones activas
      const connections = await this.connection.query('SELECT count(*) as active_connections FROM pg_stat_activity WHERE datname = $1', [process.env.DB_NAME])
      
      return {
        status: 'up',
        responseTime,
        details: {
          activeConnections: parseInt(connections[0].active_connections),
          database: process.env.DB_NAME,
          host: process.env.DB_HOST,
        }
      }
    } catch (error) {
      this.logger.error('Database health check failed:', error)
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown database error'
      }
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const start = Date.now()
    
    try {
      await this.redisClient.ping()
      const responseTime = Date.now() - start
      
      // Obtener información de Redis
      const info = await this.redisClient.info()
      const memoryMatch = info.match(/used_memory_human:(\S+)/)
      const connectedClientsMatch = info.match(/connected_clients:(\d+)/)
      
      return {
        status: 'up',
        responseTime,
        details: {
          usedMemory: memoryMatch ? memoryMatch[1] : 'unknown',
          connectedClients: connectedClientsMatch ? parseInt(connectedClientsMatch[1]) : 0,
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
        }
      }
    } catch (error) {
      this.logger.error('Redis health check failed:', error)
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown Redis error'
      }
    }
  }

  private async checkMemory(): Promise<ServiceHealth> {
    try {
      const memUsage = process.memoryUsage()
      const totalMemoryMB = Math.round(memUsage.rss / 1024 / 1024)
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
      const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
      
      // Alertar si el uso de memoria es mayor al 80%
      const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100
      const status = heapUsagePercent > 80 ? 'down' : 'up'
      
      return {
        status,
        details: {
          totalMemoryMB,
          heapUsedMB,
          heapTotalMB,
          heapUsagePercent: Math.round(heapUsagePercent),
          externalMB: Math.round(memUsage.external / 1024 / 1024),
        }
      }
    } catch (error) {
      this.logger.error('Memory health check failed:', error)
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown memory error'
      }
    }
  }

  private async checkDisk(): Promise<ServiceHealth> {
    try {
      // En un entorno real, aquí se verificaría el espacio en disco
      // Por ahora, simulamos un chequeo exitoso
      const fs = require('fs').promises
      const stats = await fs.stat('/tmp')
      
      return {
        status: 'up',
        details: {
          tempDirAvailable: stats.isDirectory(),
          note: 'Disk space check would be implemented here'
        }
      }
    } catch (error) {
      this.logger.error('Disk health check failed:', error)
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown disk error'
      }
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit()
    }
  }
}