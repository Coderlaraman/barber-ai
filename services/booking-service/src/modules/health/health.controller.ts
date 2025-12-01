import { Controller, Get, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { HealthService, HealthStatus } from './health.service'

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name)

  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener estado de salud del sistema',
    description: 'Verifica el estado de todos los servicios críticos del sistema incluyendo base de datos, Redis, memoria y disco'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sistema saludable',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        version: { type: 'string', example: '1.0.0' },
        uptime: { type: 'number', example: 3600 },
        services: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
                responseTime: { type: 'number', example: 25 },
                details: {
                  type: 'object',
                  properties: {
                    activeConnections: { type: 'number', example: 5 },
                    database: { type: 'string', example: 'barber_booking' },
                    host: { type: 'string', example: 'localhost' }
                  }
                }
              }
            },
            redis: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
                responseTime: { type: 'number', example: 5 },
                details: {
                  type: 'object',
                  properties: {
                    connected: { type: 'boolean', example: true },
                    ready: { type: 'boolean', example: true },
                    host: { type: 'string', example: 'localhost' },
                    port: { type: 'number', example: 6379 }
                  }
                }
              }
            },
            memory: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'healthy' },
                details: {
                  type: 'object',
                  properties: {
                    used: { type: 'number', example: 134217728 },
                    total: { type: 'number', example: 1073741824 },
                    percentage: { type: 'number', example: 12.5 },
                    heapUsed: { type: 'number', example: 67108864 },
                    heapTotal: { type: 'number', example: 134217728 }
                  }
                }
              }
            },
            disk: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'healthy' },
                details: {
                  type: 'object',
                  properties: {
                    used: { type: 'number', example: 10737418240 },
                    total: { type: 'number', example: 107374182400 },
                    percentage: { type: 'number', example: 10.0 },
                    available: { type: 'number', example: 96636764160 }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Sistema no saludable',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'unhealthy' },
        timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        version: { type: 'string', example: '1.0.0' },
        uptime: { type: 'number', example: 3600 },
        services: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'down' },
                error: { type: 'string', example: 'Connection timeout' }
              }
            }
          }
        }
      }
    }
  })
  async getHealth(): Promise<HealthStatus> {
    this.logger.log('Health check requested')
    return this.healthService.getHealthStatus()
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar si el servicio está listo para recibir tráfico',
    description: 'Endpoint de readiness probe para Kubernetes. Verifica que el servicio esté completamente inicializado'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Servicio listo',
    schema: {
      type: 'object',
      properties: {
        ready: { type: 'boolean', example: true },
        timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        checks: {
          type: 'object',
          properties: {
            database: { type: 'boolean', example: true },
            redis: { type: 'boolean', example: true }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Servicio no listo',
    schema: {
      type: 'object',
      properties: {
        ready: { type: 'boolean', example: false },
        timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        checks: {
          type: 'object',
          properties: {
            database: { type: 'boolean', example: false },
            redis: { type: 'boolean', example: true }
          }
        }
      }
    }
  })
  async getReadiness(): Promise<{ ready: boolean; timestamp: Date; checks: Record<string, boolean> }> {
    this.logger.log('Readiness check requested')
    
    const health = await this.healthService.getHealthStatus()
    
    // Verificar servicios críticos para readiness
    const checks = {
      database: health.services.database.status === 'up',
      redis: health.services.redis.status === 'up'
    }
    
    const ready = Object.values(checks).every(check => check)
    
    return {
      ready,
      timestamp: health.timestamp,
      checks
    }
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar si el servicio está vivo',
    description: 'Endpoint de liveness probe para Kubernetes. Verifica que el proceso esté ejecutándose'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Servicio vivo',
    schema: {
      type: 'object',
      properties: {
        alive: { type: 'boolean', example: true },
        timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        uptime: { type: 'number', example: 3600 }
      }
    }
  })
  async getLiveness(): Promise<{ alive: boolean; timestamp: Date; uptime: number }> {
    this.logger.log('Liveness check requested')
    
    // Si podemos responder, estamos vivos
    const uptime = Date.now() - this.healthService.getStartTime()
    
    return {
      alive: true,
      timestamp: new Date(),
      uptime
    }
  }
}