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

@ApiTags('appointments')
@Controller('appointments')
export class GatewayController {
  // Appointments endpoints
  @Post()
  @ApiOperation({ summary: 'Crear una nueva cita' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Cita creada exitosamente' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Conflicto: horario no disponible' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Servicio o franja horaria no encontrada' })
  @ApiBody({ description: 'Datos de la cita a crear' })
  async createAppointment(@Body() createAppointmentDto: any, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una cita por ID' })
  @ApiParam({ name: 'id', description: 'ID de la cita', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cita encontrada' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Cita no encontrada' })
  async getAppointment(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las citas con filtros opcionales' })
  @ApiQuery({ name: 'barberId', required: false, description: 'ID del barbero' })
  @ApiQuery({ name: 'clientId', required: false, description: 'ID del cliente' })
  @ApiQuery({ name: 'date', required: false, description: 'Fecha específica (YYYY-MM-DD)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha de inicio del rango (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha de fin del rango (YYYY-MM-DD)' })
  @ApiQuery({ name: 'status', required: false, description: 'Estado de la cita' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de citas' })
  async getAppointments(@Query() query: any, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una cita' })
  @ApiParam({ name: 'id', description: 'ID de la cita', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cita actualizada' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Cita no encontrada' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Conflicto: horario no disponible' })
  @ApiBody({ description: 'Datos de la cita a actualizar' })
  async updateAppointment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAppointmentDto: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Put(':id/confirm')
  @ApiOperation({ summary: 'Confirmar una cita' })
  @ApiParam({ name: 'id', description: 'ID de la cita', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cita confirmada' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Cita no encontrada' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'La cita no puede ser confirmada' })
  async confirmAppointment(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Put(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar una cita' })
  @ApiParam({ name: 'id', description: 'ID de la cita', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cita cancelada' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Cita no encontrada' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'La cita no puede ser cancelada' })
  @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string' } } } })
  async cancelAppointment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Completar una cita' })
  @ApiParam({ name: 'id', description: 'ID de la cita', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cita completada' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Cita no encontrada' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'La cita no puede ser completada' })
  @ApiBody({ schema: { type: 'object', properties: { notes: { type: 'string' } } } })
  async completeAppointment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('notes') notes: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Obtener el historial de cambios de una cita' })
  @ApiParam({ name: 'id', description: 'ID de la cita', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Historial de la cita' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Cita no encontrada' })
  async getAppointmentHistory(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validar la disponibilidad de un horario para una cita' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Validación exitosa' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Horario no disponible' })
  @ApiBody({ description: 'Datos de la cita a validar' })
  async validateAppointmentAvailability(@Body() createAppointmentDto: any, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }
}

@ApiTags('availability')
@Controller('availability')
export class AvailabilityController {
  // Availability endpoints
  @Post()
  @ApiOperation({ summary: 'Crear una nueva disponibilidad de barbero' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Disponibilidad creada exitosamente' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Conflicto: horario superpuesto' })
  @ApiBody({ description: 'Datos de la disponibilidad a crear' })
  async createAvailability(@Body() createAvailabilityDto: any, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una disponibilidad por ID' })
  @ApiParam({ name: 'id', description: 'ID de la disponibilidad', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Disponibilidad encontrada' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Disponibilidad no encontrada' })
  async getAvailability(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Get()
  @ApiOperation({ summary: 'Obtener disponibilidades con filtros opcionales' })
  @ApiQuery({ name: 'barberId', required: false, description: 'ID del barbero' })
  @ApiQuery({ name: 'dayOfWeek', required: false, description: 'Día de la semana (0-6)', type: Number })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha de inicio del rango (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha de fin del rango (YYYY-MM-DD)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de disponibilidades' })
  async getAvailabilities(@Query() query: any, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una disponibilidad' })
  @ApiParam({ name: 'id', description: 'ID de la disponibilidad', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Disponibilidad actualizada' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Disponibilidad no encontrada' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Conflicto: horario superpuesto' })
  @ApiBody({ description: 'Datos de la disponibilidad a actualizar' })
  async updateAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAvailabilityDto: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una disponibilidad' })
  @ApiParam({ name: 'id', description: 'ID de la disponibilidad', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Disponibilidad eliminada exitosamente' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Disponibilidad no encontrada' })
  async deleteAvailability(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Post('generate-slots')
  @ApiOperation({ summary: 'Generar franjas horarias para un rango de fechas' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Franjas horarias generadas exitosamente' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        barberId: { type: 'string' },
        startDate: { type: 'string', format: 'date' },
        endDate: { type: 'string', format: 'date' },
      },
      required: ['barberId', 'startDate', 'endDate'],
    },
  })
  async generateTimeSlots(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Post('block-slot')
  @ApiOperation({ summary: 'Bloquear una franja horaria específica' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Franja horaria bloqueada' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        barberId: { type: 'string' },
        date: { type: 'string', format: 'date' },
        startTime: { type: 'string' },
        endTime: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['barberId', 'date', 'startTime', 'endTime'],
    },
  })
  async blockTimeSlot(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Put('unblock-slot/:slotId')
  @ApiOperation({ summary: 'Desbloquear una franja horaria' })
  @ApiParam({ name: 'slotId', description: 'ID de la franja horaria', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Franja horaria desbloqueada' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Franja horaria no encontrada' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'La franja horaria no está bloqueada' })
  async unblockTimeSlot(@Param('slotId', ParseUUIDPipe) slotId: string, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }
}