import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  HttpStatus, 
  HttpCode,
  ValidationPipe,
  UsePipes
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger'
import { RankingService } from './ranking.service'
import { CreateRankingDto, UpdateRankingDto, RankingQueryDto, RankingMetricsDto } from './dto/ranking.dto'
import { RankingResponseDto } from './dto/ranking.dto'

@ApiTags('ranking')
@Controller('ranking')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Crear un nuevo ranking',
    description: 'Crea un nuevo ranking para un barbero en un período específico'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Ranking creado exitosamente',
    type: RankingResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'El ranking ya existe para este barbero y período' 
  })
  async createRanking(@Body() createRankingDto: CreateRankingDto): Promise<RankingResponseDto> {
    return this.rankingService.createRanking(createRankingDto)
  }

  @Get('barbers/:barberId')
  @ApiOperation({ 
    summary: 'Obtener ranking de un barbero',
    description: 'Obtiene el ranking de un barbero específico para un período dado'
  })
  @ApiParam({ name: 'barberId', description: 'ID del barbero' })
  @ApiQuery({ name: 'period', required: true, enum: ['daily', 'weekly', 'monthly', 'yearly', 'all_time'] })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Ranking obtenido exitosamente',
    type: RankingResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Ranking no encontrado' 
  })
  async getBarberRanking(
    @Param('barberId') barberId: string,
    @Query('period') period: string
  ): Promise<RankingResponseDto> {
    return this.rankingService.getRankingByBarberAndPeriod(barberId, period)
  }

  @Get('top')
  @ApiOperation({ 
    summary: 'Obtener top rankings',
    description: 'Obtiene los barberos mejor rankeados para un período específico'
  })
  @ApiQuery({ 
    name: 'period', 
    required: true, 
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'all_time'],
    description: 'Período para el ranking' 
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Número máximo de resultados (por defecto: 10)'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Top rankings obtenidos exitosamente',
    type: [RankingResponseDto] 
  })
  async getTopRankings(
    @Query('period') period: string,
    @Query('limit') limit?: number
  ): Promise<RankingResponseDto[]> {
    return this.rankingService.getTopRankings(period, limit || 10)
  }

  @Get('metrics/barbers/:barberId')
  @ApiOperation({ 
    summary: 'Obtener métricas detalladas de un barbero',
    description: 'Obtiene métricas detalladas de rendimiento para un barbero específico'
  })
  @ApiParam({ name: 'barberId', description: 'ID del barbero' })
  @ApiQuery({ name: 'period', required: true, enum: ['daily', 'weekly', 'monthly', 'yearly', 'all_time'] })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Métricas obtenidas exitosamente',
    type: RankingMetricsDto 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Ranking no encontrado' 
  })
  async getRankingMetrics(
    @Param('barberId') barberId: string,
    @Query('period') period: string
  ): Promise<any> {
    return this.rankingService.getRankingMetrics(barberId, period)
  }

  @Put('barbers/:barberId')
  @ApiOperation({ 
    summary: 'Actualizar ranking de un barbero',
    description: 'Actualiza manualmente el ranking de un barbero para un período específico'
  })
  @ApiParam({ name: 'barberId', description: 'ID del barbero' })
  @ApiQuery({ name: 'period', required: true, enum: ['daily', 'weekly', 'monthly', 'yearly', 'all_time'] })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Ranking actualizado exitosamente',
    type: RankingResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Ranking no encontrado' 
  })
  async updateRanking(
    @Param('barberId') barberId: string,
    @Query('period') period: string,
    @Body() updateRankingDto: UpdateRankingDto
  ): Promise<RankingResponseDto> {
    return this.rankingService.updateRanking(barberId, period, updateRankingDto)
  }

  @Post('recalculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Recalcular rankings',
    description: 'Recalcula los rankings de barberos basados en eventos y métricas actualizadas'
  })
  @ApiQuery({ 
    name: 'period', 
    required: true, 
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'all_time'],
    description: 'Período para recalcular rankings' 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Recálculo de rankings iniciado exitosamente',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Estado de la operación' },
        message: { type: 'string', description: 'Mensaje de confirmación' },
        period: { type: 'string', description: 'Período recalculado' }
      }
    }
  })
  async recalculateRankings(@Query('period') period: string): Promise<{ status: string; message: string; period: string }> {
    await this.rankingService.recalculateAllRankings(period)
    return { 
      status: 'success', 
      message: `Rankings recalculados exitosamente para el período ${period}`,
      period 
    }
  }

  @Post('events/rating')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Procesar evento de calificación',
    description: 'Procesa un evento de calificación para actualizar rankings en tiempo real'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Evento procesado exitosamente',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Estado del procesamiento' },
        message: { type: 'string', description: 'Mensaje de confirmación' }
      }
    }
  })
  async processRatingEvent(@Body() ratingEvent: {
    ratingId: string
    barberId: string
    rating: number
    aspects?: Record<string, number>
    timestamp?: Date
  }): Promise<{ status: string; message: string }> {
    await this.rankingService.processRatingEvent(ratingEvent)
    return { 
      status: 'success', 
      message: 'Evento de calificación procesado exitosamente' 
    }
  }

  @Post('events/business')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Procesar evento de negocio',
    description: 'Procesa un evento de negocio (ingresos, citas completadas) para actualizar rankings'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Evento procesado exitosamente',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Estado del procesamiento' },
        message: { type: 'string', description: 'Mensaje de confirmación' }
      }
    }
  })
  async processBusinessEvent(@Body() businessEvent: {
    barberId: string
    revenue: number
    completedAppointments: number
    timestamp?: Date
  }): Promise<{ status: string; message: string }> {
    await this.rankingService.processBusinessEvent(businessEvent)
    return { 
      status: 'success', 
      message: 'Evento de negocio procesado exitosamente' 
    }
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Health check del servicio de ranking',
    description: 'Verifica el estado de salud del servicio de ranking'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Servicio funcionando correctamente',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Estado del servicio' },
        service: { type: 'string', description: 'Nombre del servicio' },
        timestamp: { type: 'string', description: 'Timestamp de la verificación' }
      }
    }
  })
  health(): { status: string; service: string; timestamp: string } {
    return { 
      status: 'ok', 
      service: 'ranking',
      timestamp: new Date().toISOString()
    }
  }
}