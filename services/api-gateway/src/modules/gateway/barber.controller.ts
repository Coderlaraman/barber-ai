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

@ApiTags('barbers')
@Controller('barbers')
export class BarberController {
  // Barber endpoints
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo perfil de barbero' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Barbero creado exitosamente' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Conflicto: licencia ya existe' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Datos inválidos' })
  @ApiBody({ description: 'Datos del barbero a crear' })
  async createBarber(@Body() createBarberDto: any, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un barbero por ID' })
  @ApiParam({ name: 'id', description: 'ID del barbero', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Barbero encontrado' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Barbero no encontrado' })
  async getBarber(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los barberos con filtros opcionales' })
  @ApiQuery({ name: 'city', required: false, description: 'Ciudad' })
  @ApiQuery({ name: 'specialty', required: false, description: 'Especialidad' })
  @ApiQuery({ name: 'isVerified', required: false, description: '¿Está verificado?' })
  @ApiQuery({ name: 'minRating', required: false, description: 'Calificación mínima', type: Number })
  @ApiQuery({ name: 'latitude', required: false, description: 'Latitud para búsqueda por ubicación', type: Number })
  @ApiQuery({ name: 'longitude', required: false, description: 'Longitud para búsqueda por ubicación', type: Number })
  @ApiQuery({ name: 'radius', required: false, description: 'Radio de búsqueda en km', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de barberos' })
  async getBarbers(@Query() query: any, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un barbero' })
  @ApiParam({ name: 'id', description: 'ID del barbero', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Barbero actualizado' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Barbero no encontrado' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Datos inválidos' })
  @ApiBody({ description: 'Datos del barbero a actualizar' })
  async updateBarber(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBarberDto: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un barbero' })
  @ApiParam({ name: 'id', description: 'ID del barbero', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Barbero eliminado exitosamente' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Barbero no encontrado' })
  async deleteBarber(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Verificar un barbero' })
  @ApiParam({ name: 'id', description: 'ID del barbero', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Barbero verificado' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Barbero no encontrado' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'El barbero no puede ser verificado' })
  async verifyBarber(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Post(':id/locations')
  @ApiOperation({ summary: 'Agregar ubicación a un barbero' })
  @ApiParam({ name: 'id', description: 'ID del barbero', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Ubicación agregada exitosamente' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Barbero no encontrado' })
  @ApiBody({ description: 'Datos de la ubicación' })
  async addBarberLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() locationDto: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Get(':id/locations')
  @ApiOperation({ summary: 'Obtener ubicaciones de un barbero' })
  @ApiParam({ name: 'id', description: 'ID del barbero', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de ubicaciones' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Barbero no encontrado' })
  async getBarberLocations(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }
}

@ApiTags('specialties')
@Controller('specialties')
export class SpecialtyController {
  // Specialty endpoints
  @Get()
  @ApiOperation({ summary: 'Obtener todas las especialidades' })
  @ApiQuery({ name: 'category', required: false, description: 'Categoría de especialidad' })
  @ApiQuery({ name: 'isActive', required: false, description: '¿Está activa?' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de especialidades' })
  async getSpecialties(@Query() query: any, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una especialidad por ID' })
  @ApiParam({ name: 'id', description: 'ID de la especialidad', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Especialidad encontrada' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Especialidad no encontrada' })
  async getSpecialty(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva especialidad' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Especialidad creada exitosamente' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Datos inválidos' })
  @ApiBody({ description: 'Datos de la especialidad' })
  async createSpecialty(@Body() createSpecialtyDto: any, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una especialidad' })
  @ApiParam({ name: 'id', description: 'ID de la especialidad', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Especialidad actualizada' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Especialidad no encontrada' })
  @ApiBody({ description: 'Datos de la especialidad a actualizar' })
  async updateSpecialty(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSpecialtyDto: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }
}

@ApiTags('services')
@Controller('services')
export class ServiceController {
  // Service endpoints
  @Get()
  @ApiOperation({ summary: 'Obtener todos los servicios' })
  @ApiQuery({ name: 'specialtyId', required: false, description: 'ID de la especialidad' })
  @ApiQuery({ name: 'category', required: false, description: 'Categoría' })
  @ApiQuery({ name: 'isActive', required: false, description: '¿Está activo?' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de servicios' })
  async getServices(@Query() query: any, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un servicio por ID' })
  @ApiParam({ name: 'id', description: 'ID del servicio', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Servicio encontrado' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Servicio no encontrado' })
  async getService(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo servicio' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Servicio creado exitosamente' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Datos inválidos' })
  @ApiBody({ description: 'Datos del servicio' })
  async createService(@Body() createServiceDto: any, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un servicio' })
  @ApiParam({ name: 'id', description: 'ID del servicio', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Servicio actualizado' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Servicio no encontrado' })
  @ApiBody({ description: 'Datos del servicio a actualizar' })
  async updateService(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServiceDto: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un servicio' })
  @ApiParam({ name: 'id', description: 'ID del servicio', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Servicio eliminado exitosamente' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Servicio no encontrado' })
  async deleteService(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by the proxy middleware in main.ts
    res.status(HttpStatus.NOT_IMPLEMENTED).json({ message: 'Use proxy endpoint' })
  }
}