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
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { RatingService } from '../services/rating.service';
import { Rating, RatingStatus } from '../entities/rating.entity';
import {
  CreateRatingDto,
  UpdateRatingDto,
  ModerateRatingDto,
  RatingResponseDto,
  BarberRatingStatsDto,
  ClientRatingHistoryDto,
} from '../dto/rating.dto';
import { Request } from 'express';

@ApiTags('ratings')
@Controller('ratings')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Crear una nueva calificación',
    description: 'Crea una calificación para una cita completada. Solo puede crearla el cliente que recibió el servicio.'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Calificación creada exitosamente',
    type: RatingResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Ya existe una calificación para esta cita' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Datos inválidos o la cita no está completada' 
  })
  async createRating(
    @Body() createRatingDto: CreateRatingDto,
    @Req() req: Request
  ): Promise<Rating> {
    // En producción, obtener userId del contexto de autenticación
    const userId = req.user?.userId || createRatingDto.clientId; // Temporal hasta tener auth
    return this.ratingService.createRating(createRatingDto, userId);
  }

  @Get('barbers/:barberId')
  @ApiOperation({ 
    summary: 'Obtener calificaciones de un barbero',
    description: 'Obtiene todas las calificaciones de un barbero específico con opción de filtrar por estado'
  })
  @ApiParam({ name: 'barberId', description: 'ID del barbero', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    enum: RatingStatus,
    description: 'Filtrar por estado de calificación' 
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Límite de resultados (máximo 100)' 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Lista de calificaciones',
    type: [RatingResponseDto] 
  })
  async getRatingsByBarber(
    @Param('barberId') barberId: string,
    @Query('status') status?: RatingStatus,
    @Query('limit') limit?: number
  ): Promise<Rating[]> {
    const ratings = await this.ratingService.getRatingsByBarber(barberId, status);
    return limit ? ratings.slice(0, Math.min(limit, 100)) : ratings;
  }

  @Get('barbers/:barberId/stats')
  @ApiOperation({ 
    summary: 'Obtener estadísticas de calificaciones de un barbero',
    description: 'Obtiene estadísticas detalladas incluyendo promedio, distribución y promedios por aspectos'
  })
  @ApiParam({ name: 'barberId', description: 'ID del barbero', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Estadísticas de calificaciones',
    type: BarberRatingStatsDto 
  })
  async getBarberRatingStats(@Param('barberId') barberId: string): Promise<BarberRatingStatsDto> {
    return this.ratingService.getBarberRatingStats(barberId);
  }

  @Get('barbers/:barberId/featured')
  @ApiOperation({ 
    summary: 'Obtener reseñas destacadas de un barbero',
    description: 'Obtiene las reseñas marcadas como destacadas para mostrar en el perfil del barbero'
  })
  @ApiParam({ name: 'barberId', description: 'ID del barbero', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Número de reseñas a obtener (por defecto 3)' 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Reseñas destacadas',
    type: [RatingResponseDto] 
  })
  async getFeaturedReviews(
    @Param('barberId') barberId: string,
    @Query('limit') limit?: number
  ): Promise<Rating[]> {
    return this.ratingService.getFeaturedReviews(barberId, limit || 3);
  }

  @Get('clients/:clientId')
  @ApiOperation({ 
    summary: 'Obtener calificaciones de un cliente',
    description: 'Obtiene el historial de calificaciones que un cliente ha dado'
  })
  @ApiParam({ name: 'clientId', description: 'ID del cliente', example: '123e4567-e89b-12d3-a456-426614174002' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Historial de calificaciones del cliente',
    type: ClientRatingHistoryDto 
  })
  async getClientRatingHistory(@Param('clientId') clientId: string): Promise<ClientRatingHistoryDto> {
    return this.ratingService.getClientRatingHistory(clientId);
  }

  @Get('appointments/:appointmentId')
  @ApiOperation({ 
    summary: 'Obtener calificación de una cita específica',
    description: 'Obtiene la calificación asociada a una cita específica si existe'
  })
  @ApiParam({ name: 'appointmentId', description: 'ID de la cita', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Calificación de la cita',
    type: RatingResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'No existe calificación para esta cita' 
  })
  async getRatingByAppointment(@Param('appointmentId') appointmentId: string): Promise<Rating | null> {
    return this.ratingService.getRatingByAppointment(appointmentId);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener calificación por ID',
    description: 'Obtiene una calificación específica por su ID'
  })
  @ApiParam({ name: 'id', description: 'ID de la calificación', example: '123e4567-e89b-12d3-a456-426614174004' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Calificación encontrada',
    type: RatingResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Calificación no encontrada' 
  })
  async getRatingById(@Param('id') id: string): Promise<Rating> {
    return this.ratingService.getRatingById(id);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Actualizar calificación',
    description: 'Permite al cliente actualizar su calificación y comentario'
  })
  @ApiParam({ name: 'id', description: 'ID de la calificación', example: '123e4567-e89b-12d3-a456-426614174004' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Calificación actualizada',
    type: RatingResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Calificación no encontrada' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'No tienes permiso para actualizar esta calificación' 
  })
  async updateRating(
    @Param('id') id: string,
    @Body() updateRatingDto: UpdateRatingDto,
    @Req() req: Request
  ): Promise<Rating> {
    // En producción, obtener userId del contexto de autenticación
    const userId = req.user?.userId || 'system'; // Temporal hasta tener auth
    return this.ratingService.updateRating(id, updateRatingDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Eliminar calificación',
    description: 'Permite al cliente eliminar su calificación (soft delete)'
  })
  @ApiParam({ name: 'id', description: 'ID de la calificación', example: '123e4567-e89b-12d3-a456-426614174004' })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: 'Calificación eliminada exitosamente' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Calificación no encontrada' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'No tienes permiso para eliminar esta calificación' 
  })
  async deleteRating(
    @Param('id') id: string,
    @Req() req: Request
  ): Promise<void> {
    // En producción, obtener userId del contexto de autenticación
    const userId = req.user?.userId || 'system'; // Temporal hasta tener auth
    await this.ratingService.deleteRating(id, userId);
  }

  @Put(':id/helpful')
  @ApiOperation({ 
    summary: 'Marcar calificación como útil',
    description: 'Permite a los usuarios marcar una reseña como útil'
  })
  @ApiParam({ name: 'id', description: 'ID de la calificación', example: '123e4567-e89b-12d3-a456-426614174004' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Calificación marcada como útil',
    type: RatingResponseDto 
  })
  async markAsHelpful(
    @Param('id') id: string,
    @Req() req: Request
  ): Promise<Rating> {
    // En producción, obtener userId del contexto de autenticación
    const userId = req.user?.userId || 'system'; // Temporal hasta tener auth
    return this.ratingService.markAsHelpful(id, userId);
  }

  @Put(':id/flag')
  @ApiOperation({ 
    summary: 'Reportar calificación',
    description: 'Permite a los usuarios reportar una reseña inapropiada'
  })
  @ApiParam({ name: 'id', description: 'ID de la calificación', example: '123e4567-e89b-12d3-a456-426614174004' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Calificación reportada',
    type: RatingResponseDto 
  })
  async flagRating(
    @Param('id') id: string,
    @Req() req: Request
  ): Promise<Rating> {
    // En producción, obtener userId del contexto de autenticación
    const userId = req.user?.userId || 'system'; // Temporal hasta tener auth
    return this.ratingService.flagRating(id, userId);
  }

  @Put(':id/moderate')
  @ApiOperation({ 
    summary: 'Moderar calificación',
    description: 'Permite a moderadores aprobar, rechazar o marcar una calificación'
  })
  @ApiParam({ name: 'id', description: 'ID de la calificación', example: '123e4567-e89b-12d3-a456-426614174004' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Calificación moderada',
    type: RatingResponseDto 
  })
  async moderateRating(
    @Param('id') id: string,
    @Body() moderateRatingDto: ModerateRatingDto,
    @Req() req: Request
  ): Promise<Rating> {
    // En producción, obtener moderatorId del contexto de autenticación con rol de moderador
    const moderatorId = req.user?.userId || 'system'; // Temporal hasta tener auth
    return this.ratingService.moderateRating(id, moderateRatingDto, moderatorId);
  }
}