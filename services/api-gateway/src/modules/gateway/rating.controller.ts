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
  ParseUUIDPipe,
  Res,
  Req,
} from '@nestjs/common'
import { Response, Request } from 'express'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger'

@ApiTags('ratings')
@Controller('ratings')
export class RatingController {
  // Rating endpoints
  @Post()
  @ApiOperation({ summary: 'Crear una nueva calificación' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Calificación creada exitosamente' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'El usuario ya calificó esta cita' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Cita no encontrada' })
  @ApiBody({ description: 'Datos de la calificación a crear' })
  async createRating(@Body() createRatingDto: any, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una calificación por ID' })
  @ApiParam({ name: 'id', description: 'ID de la calificación', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Calificación encontrada' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Calificación no encontrada' })
  async getRating(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las calificaciones con filtros opcionales' })
  @ApiQuery({ name: 'barberId', required: false, description: 'ID del barbero' })
  @ApiQuery({ name: 'clientId', required: false, description: 'ID del cliente' })
  @ApiQuery({ name: 'appointmentId', required: false, description: 'ID de la cita' })
  @ApiQuery({ name: 'rating', required: false, description: 'Valor de calificación (1-5)' })
  @ApiQuery({ name: 'minRating', required: false, description: 'Calificación mínima' })
  @ApiQuery({ name: 'maxRating', required: false, description: 'Calificación máxima' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha de inicio del rango (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha de fin del rango (YYYY-MM-DD)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de calificaciones' })
  async getRatings(@Query() query: any, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una calificación' })
  @ApiParam({ name: 'id', description: 'ID de la calificación', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Calificación actualizada' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Calificación no encontrada' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'No tiene permiso para actualizar esta calificación' })
  @ApiBody({ description: 'Datos de la calificación a actualizar' })
  async updateRating(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRatingDto: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una calificación' })
  @ApiParam({ name: 'id', description: 'ID de la calificación', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Calificación eliminada exitosamente' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Calificación no encontrada' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'No tiene permiso para eliminar esta calificación' })
  async deleteRating(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Get('barber/:barberId/stats')
  @ApiOperation({ summary: 'Obtener estadísticas de calificaciones de un barbero' })
  @ApiParam({ name: 'barberId', description: 'ID del barbero', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Estadísticas de calificaciones' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Barbero no encontrado' })
  async getBarberRatingStats(@Param('barberId', ParseUUIDPipe) barberId: string, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Get('appointment/:appointmentId/check')
  @ApiOperation({ summary: 'Verificar si una cita ya fue calificada' })
  @ApiParam({ name: 'appointmentId', description: 'ID de la cita', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Estado de calificación de la cita' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Cita no encontrada' })
  async checkAppointmentRating(@Param('appointmentId', ParseUUIDPipe) appointmentId: string, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }
}