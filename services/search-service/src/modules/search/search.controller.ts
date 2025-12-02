import { Controller, Get, Query, HttpStatus, HttpCode } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger'

@ApiTags('search')
@Controller('search')
export class SearchController {
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Buscar barberos',
    description: 'Busca barberos basándose en filtros y criterios específicos'
  })
  @ApiQuery({ 
    name: 'q', 
    required: false, 
    description: 'Término de búsqueda general',
    example: 'barbería cerca de mí'
  })
  @ApiQuery({ 
    name: 'location', 
    required: false, 
    description: 'Ubicación para búsqueda geográfica',
    example: 'Madrid'
  })
  @ApiQuery({ 
    name: 'specialty', 
    required: false, 
    description: 'Especialidad del barbero',
    example: 'fade,corte-clásico'
  })
  @ApiQuery({ 
    name: 'minRating', 
    required: false, 
    description: 'Calificación mínima',
    example: 4.0
  })
  @ApiQuery({ 
    name: 'maxPrice', 
    required: false, 
    description: 'Precio máximo',
    example: 25
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Búsqueda realizada exitosamente',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Estado de la búsqueda' },
        results: { 
          type: 'array', 
          description: 'Lista de resultados de búsqueda',
          items: { type: 'object' }
        }
      }
    }
  })
  search(@Query() _q: any) {
    return { status: 'stub', results: [] }
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Health check del servicio de búsqueda',
    description: 'Verifica el estado de salud del servicio de búsqueda'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Servicio funcionando correctamente',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Estado del servicio' },
        service: { type: 'string', description: 'Nombre del servicio' }
      }
    }
  })
  health() {
    return { status: 'ok', service: 'search' }
  }
}