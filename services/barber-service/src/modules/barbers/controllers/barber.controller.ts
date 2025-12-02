import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { BarberService } from '../services/barber.service';
import { CreateBarberDto, UpdateBarberDto } from '../dto/barber.dto';
import { CreateSpecialtyDto, UpdateSpecialtyDto } from '../dto/specialty.dto';
import { CreateServiceDto, UpdateServiceDto, ServiceSearchDto } from '../dto/service.dto';

@ApiTags('Barbers')
@ApiBearerAuth()
@Controller('barbers')
export class BarberController {
  constructor(private readonly barberService: BarberService) {}

  // ===== BARBER ENDPOINTS =====

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Crear un nuevo barbero',
    description: 'Crea un nuevo barbero en el sistema con su información personal y profesional'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Barbero creado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID único del barbero' },
        name: { type: 'string', description: 'Nombre del barbero' },
        email: { type: 'string', description: 'Email del barbero' },
        phone: { type: 'string', description: 'Teléfono del barbero' },
        isActive: { type: 'boolean', description: 'Estado activo del barbero' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  async createBarber(@Body(ValidationPipe) createBarberDto: CreateBarberDto) {
    return this.barberService.createBarber(createBarberDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener todos los barberos',
    description: 'Retorna una lista de todos los barberos registrados en el sistema'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de barberos obtenida exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID único del barbero' },
          name: { type: 'string', description: 'Nombre del barbero' },
          email: { type: 'string', description: 'Email del barbero' },
          phone: { type: 'string', description: 'Teléfono del barbero' },
          isActive: { type: 'boolean', description: 'Estado activo del barbero' },
          specialties: { 
            type: 'array', 
            description: 'Especialidades del barbero',
            items: { type: 'string' }
          }
        }
      }
    }
  })
  async findAllBarbers() {
    return this.barberService.findAllBarbers();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener barbero por ID',
    description: 'Retorna la información detallada de un barbero específico por su ID'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único del barbero',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Barbero encontrado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID único del barbero' },
        name: { type: 'string', description: 'Nombre del barbero' },
        email: { type: 'string', description: 'Email del barbero' },
        phone: { type: 'string', description: 'Teléfono del barbero' },
        isActive: { type: 'boolean', description: 'Estado activo del barbero' },
        specialties: { 
          type: 'array', 
          description: 'Especialidades del barbero',
          items: { type: 'string' }
        },
        services: {
          type: 'array',
          description: 'Servicios que ofrece el barbero',
          items: { type: 'string' }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Barbero no encontrado' })
  async findBarberById(@Param('id') id: string) {
    return this.barberService.findBarberById(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Actualizar barbero',
    description: 'Actualiza la información de un barbero existente'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único del barbero a actualizar',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Barbero actualizado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID único del barbero' },
        name: { type: 'string', description: 'Nombre actualizado del barbero' },
        email: { type: 'string', description: 'Email actualizado del barbero' },
        phone: { type: 'string', description: 'Teléfono actualizado del barbero' },
        isActive: { type: 'boolean', description: 'Estado actualizado del barbero' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Barbero no encontrado' })
  async updateBarber(
    @Param('id') id: string,
    @Body(ValidationPipe) updateBarberDto: UpdateBarberDto,
  ) {
    return this.barberService.updateBarber(id, updateBarberDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Eliminar barbero',
    description: 'Elimina un barbero del sistema (borrado lógico)'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único del barbero a eliminar',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ status: 204, description: 'Barbero eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Barbero no encontrado' })
  async deleteBarber(@Param('id') id: string) {
    await this.barberService.deleteBarber(id);
  }

  // ===== SPECIALTY ENDPOINTS =====

  @Post('specialties')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Crear una nueva especialidad',
    description: 'Crea una nueva especialidad de barbería en el sistema'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Especialidad creada exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID único de la especialidad' },
        name: { type: 'string', description: 'Nombre de la especialidad' },
        description: { type: 'string', description: 'Descripción de la especialidad' },
        isActive: { type: 'boolean', description: 'Estado activo de la especialidad' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  async createSpecialty(@Body(ValidationPipe) createSpecialtyDto: CreateSpecialtyDto) {
    return this.barberService.createSpecialty(createSpecialtyDto);
  }

  @Get('specialties')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener todas las especialidades',
    description: 'Retorna una lista de todas las especialidades de barbería disponibles'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de especialidades obtenida exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID único de la especialidad' },
          name: { type: 'string', description: 'Nombre de la especialidad' },
          description: { type: 'string', description: 'Descripción de la especialidad' },
          isActive: { type: 'boolean', description: 'Estado activo de la especialidad' }
        }
      }
    }
  })
  async findAllSpecialties() {
    return this.barberService.findAllSpecialties();
  }

  @Get('specialties/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener una especialidad por ID',
    description: 'Retorna los detalles de una especialidad específica por su ID'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la especialidad',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Especialidad encontrada exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID único de la especialidad' },
        name: { type: 'string', description: 'Nombre de la especialidad' },
        description: { type: 'string', description: 'Descripción de la especialidad' },
        isActive: { type: 'boolean', description: 'Estado activo de la especialidad' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Especialidad no encontrada' })
  async findSpecialtyById(@Param('id') id: string) {
    return this.barberService.findSpecialtyById(id);
  }

  @Put('specialties/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Actualizar una especialidad',
    description: 'Actualiza los datos de una especialidad existente'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la especialidad a actualizar',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Especialidad actualizada exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID único de la especialidad' },
        name: { type: 'string', description: 'Nombre de la especialidad' },
        description: { type: 'string', description: 'Descripción de la especialidad' },
        isActive: { type: 'boolean', description: 'Estado activo de la especialidad' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Especialidad no encontrada' })
  async updateSpecialty(
    @Param('id') id: string,
    @Body(ValidationPipe) updateSpecialtyDto: UpdateSpecialtyDto,
  ) {
    return this.barberService.updateSpecialty(id, updateSpecialtyDto);
  }

  @Delete('specialties/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSpecialty(@Param('id') id: string) {
    await this.barberService.deleteSpecialty(id);
  }

  // ===== SERVICE ENDPOINTS =====

  @Post(':id/services')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Crear un nuevo servicio para un barbero',
    description: 'Crea un nuevo servicio de barbería asociado a un barbero específico'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID del barbero al que se le asignará el servicio',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Servicio creado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID único del servicio' },
        name: { type: 'string', description: 'Nombre del servicio' },
        basePrice: { type: 'number', description: 'Precio base del servicio' },
        duration: { type: 'number', description: 'Duración del servicio' },
        status: { type: 'string', description: 'Estado del servicio' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Barbero no encontrado' })
  async createService(
    @Param('id') barberId: string,
    @Body(ValidationPipe) createServiceDto: CreateServiceDto
  ) {
    return this.barberService.createService(barberId, createServiceDto);
  }

  @Get('services')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener todos los servicios',
    description: 'Retorna una lista de todos los servicios de barbería disponibles con opciones de búsqueda'
  })
  @ApiQuery({ 
    name: 'name', 
    required: false, 
    description: 'Filtrar por nombre del servicio',
    example: 'Corte de cabello'
  })
  @ApiQuery({ 
    name: 'minPrice', 
    required: false, 
    description: 'Precio mínimo del servicio',
    example: 10
  })
  @ApiQuery({ 
    name: 'maxPrice', 
    required: false, 
    description: 'Precio máximo del servicio',
    example: 100
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de servicios obtenida exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID único del servicio' },
          name: { type: 'string', description: 'Nombre del servicio' },
          description: { type: 'string', description: 'Descripción del servicio' },
          price: { type: 'number', description: 'Precio del servicio' },
          duration: { type: 'number', description: 'Duración en minutos' },
          isActive: { type: 'boolean', description: 'Estado activo del servicio' }
        }
      }
    }
  })
  async findAllServices(@Query(ValidationPipe) searchDto?: ServiceSearchDto) {
    return this.barberService.findAllServices(searchDto);
  }

  @Get('services/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener un servicio por ID',
    description: 'Retorna los detalles de un servicio específico por su ID'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID del servicio',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Servicio encontrado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID único del servicio' },
        name: { type: 'string', description: 'Nombre del servicio' },
        basePrice: { type: 'number', description: 'Precio base del servicio' },
        duration: { type: 'number', description: 'Duración del servicio' },
        status: { type: 'string', description: 'Estado del servicio' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  async findServiceById(@Param('id') id: string) {
    return this.barberService.findServiceById(id);
  }

  @Put('services/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Actualizar un servicio',
    description: 'Actualiza los datos de un servicio existente'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID del servicio a actualizar',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Servicio actualizado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID único del servicio' },
        name: { type: 'string', description: 'Nombre del servicio' },
        basePrice: { type: 'number', description: 'Precio base del servicio' },
        duration: { type: 'number', description: 'Duración del servicio' },
        status: { type: 'string', description: 'Estado del servicio' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  async updateService(
    @Param('id') id: string,
    @Body(ValidationPipe) updateServiceDto: UpdateServiceDto,
  ) {
    return this.barberService.updateService(id, updateServiceDto);
  }

  @Delete('services/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteService(@Param('id') id: string) {
    await this.barberService.deleteService(id);
  }

  // ===== LOCATION ENDPOINTS =====

  @Post(':id/locations')
  @HttpCode(HttpStatus.CREATED)
  async addBarberLocation(
    @Param('id') barberId: string,
    @Body(ValidationPipe) locationData: {
      address: string;
      latitude: number;
      longitude: number;
      isPrimary?: boolean;
    },
  ) {
    return this.barberService.addBarberLocation(barberId, locationData);
  }

  @Get('nearby')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Buscar barberos cercanos',
    description: 'Encuentra barberos dentro de un radio específico desde una ubicación dada'
  })
  @ApiQuery({ 
    name: 'lat', 
    required: true, 
    description: 'Latitud de la ubicación de referencia',
    example: 40.7128
  })
  @ApiQuery({ 
    name: 'lng', 
    required: true, 
    description: 'Longitud de la ubicación de referencia',
    example: -74.0060
  })
  @ApiQuery({ 
    name: 'radius', 
    required: false, 
    description: 'Radio de búsqueda en kilómetros (por defecto: 5km)',
    example: 10
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de barberos cercanos obtenida exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID único del barbero' },
          name: { type: 'string', description: 'Nombre del barbero' },
          distance: { type: 'number', description: 'Distancia en kilómetros' },
          rating: { type: 'number', description: 'Calificación promedio' },
          specialties: { 
            type: 'array', 
            description: 'Especialidades del barbero',
            items: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Parámetros de ubicación inválidos' })
  async findBarbersNearby(
    @Query('lat') latitude: number,
    @Query('lng') longitude: number,
    @Query('radius') radius: number = 5,
  ) {
    return this.barberService.findBarbersNearby(latitude, longitude, radius);
  }
}