import { Body, Controller, Post, Get, Param, Put, Delete, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger'
import { CreatePortfolioItemDto } from './dto/create-portfolio-item.dto'
import { UpdatePortfolioItemDto } from './dto/update-portfolio-item.dto'
import { PortfolioItemResponseDto } from './dto/portfolio-item-response.dto'
import { HealthResponseDto } from './dto/health-response.dto'

@ApiTags('Portfolio')
@Controller('portfolio')
export class PortfolioController {
  @Post('items')
  @ApiOperation({ 
    summary: 'Agregar elemento al portafolio',
    description: 'Agrega un nuevo elemento al portafolio de un barbero'
  })
  @ApiBody({
    type: CreatePortfolioItemDto,
    description: 'Datos del elemento del portafolio a crear'
  })
  @ApiResponse({
    status: 201,
    description: 'Elemento del portafolio creado exitosamente',
    type: PortfolioItemResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos'
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  addItem(@Body() dto: CreatePortfolioItemDto): PortfolioItemResponseDto {
    // Stub implementation - replace with actual service call
    return {
      id: '123e4567-e89b-12d3-a456-426614174000',
      barberId: dto.barberId,
      title: dto.title,
      description: dto.description,
      imageUrl: dto.imageUrl,
      tags: dto.tags,
      createdAt: new Date()
    }
  }

  @Put('items/:itemId')
  @ApiOperation({ 
    summary: 'Actualizar elemento del portafolio',
    description: 'Actualiza un elemento existente del portafolio de un barbero'
  })
  @ApiParam({
    name: 'itemId',
    description: 'ID del elemento del portafolio a actualizar',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({
    type: UpdatePortfolioItemDto,
    description: 'Datos del elemento del portafolio a actualizar'
  })
  @ApiResponse({
    status: 200,
    description: 'Elemento del portafolio actualizado exitosamente',
    type: PortfolioItemResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos'
  })
  @ApiResponse({
    status: 404,
    description: 'Elemento no encontrado'
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdatePortfolioItemDto
  ): PortfolioItemResponseDto {
    // Stub implementation - replace with actual service call
    return {
      id: itemId,
      barberId: '123e4567-e89b-12d3-a456-426614174000',
      title: dto.title || 'Corte actualizado',
      description: dto.description || 'Descripción actualizada',
      imageUrl: dto.imageUrl || 'https://example.com/updated-image.jpg',
      tags: dto.tags || ['actualizado', 'modificado'],
      createdAt: new Date('2024-01-01')
    }
  }

  @Get('items/:barberId')
  @ApiOperation({ 
    summary: 'Obtener portafolio de un barbero',
    description: 'Obtiene todos los elementos del portafolio de un barbero específico'
  })
  @ApiParam({
    name: 'barberId',
    description: 'ID del barbero',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiQuery({
    name: 'limit',
    description: 'Número máximo de elementos a devolver',
    required: false,
    type: Number,
    example: 10
  })
  @ApiQuery({
    name: 'offset',
    description: 'Número de elementos a saltar para paginación',
    required: false,
    type: Number,
    example: 0
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de elementos del portafolio',
    type: PortfolioItemResponseDto,
    isArray: true
  })
  @ApiResponse({
    status: 404,
    description: 'Barbero no encontrado'
  })
  getPortfolioItems(
    @Param('barberId') barberId: string,
    @Query('limit') _limit?: number,
    @Query('offset') _offset?: number
  ): PortfolioItemResponseDto[] {
    // Stub implementation - replace with actual service call
    return [
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        barberId: barberId,
        title: 'Corte clásico con degradado',
        description: 'Corte clásico con degradado perfecto para caballeros',
        imageUrl: 'https://example.com/image.jpg',
        tags: ['corte-clasico', 'degradado', 'hombre'],
        createdAt: new Date()
      }
    ]
  }

  @Get('items/:barberId/search')
  @ApiOperation({ 
    summary: 'Buscar elementos en el portafolio',
    description: 'Busca elementos del portafolio por etiquetas o título'
  })
  @ApiParam({
    name: 'barberId',
    description: 'ID del barbero',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiQuery({
    name: 'query',
    description: 'Término de búsqueda para título o etiquetas',
    required: true,
    type: String,
    example: 'corte'
  })
  @ApiQuery({
    name: 'tags',
    description: 'Filtrar por etiquetas específicas (separadas por comas)',
    required: false,
    type: String,
    example: 'corte-clasico,hombre'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de elementos del portafolio que coinciden con la búsqueda',
    type: PortfolioItemResponseDto,
    isArray: true
  })
  searchPortfolioItems(
    @Param('barberId') barberId: string,
    @Query('query') _query: string,
    @Query('tags') _tags?: string
  ): PortfolioItemResponseDto[] {
    // Stub implementation - replace with actual service call
    return [
      {
        id: '123e4567-e89b-12d3-a456-426614174002',
        barberId: barberId,
        title: 'Corte clásico moderno',
        description: 'Corte clásico con toque moderno y elegante',
        imageUrl: 'https://example.com/modern-image.jpg',
        tags: ['corte-clasico', 'moderno', 'hombre'],
        createdAt: new Date()
      }
    ]
  }

  @Delete('items/:itemId')
  @ApiOperation({ 
    summary: 'Eliminar elemento del portafolio',
    description: 'Elimina un elemento específico del portafolio'
  })
  @ApiParam({
    name: 'itemId',
    description: 'ID del elemento del portafolio a eliminar',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Elemento eliminado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Elemento eliminado exitosamente' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Elemento no encontrado'
  })
  deleteItem(@Param('itemId') _itemId: string): { success: boolean; message: string } {
    // Stub implementation - replace with actual service call
    return {
      success: true,
      message: 'Elemento eliminado exitosamente'
    }
  }

  @Get('health')
  @ApiOperation({ 
    summary: 'Verificar salud del servicio',
    description: 'Verifica el estado de salud del servicio de portafolio'
  })
  @ApiResponse({
    status: 200,
    description: 'Servicio funcionando correctamente',
    type: HealthResponseDto
  })
  health(): HealthResponseDto {
    return { status: 'ok', service: 'portfolio' }
  }
}