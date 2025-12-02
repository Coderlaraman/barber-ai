import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { CreateUserPreferenceDto, UpdateUserPreferenceDto } from '../dto/user-preference.dto';
import { CreateUserAddressDto, UpdateUserAddressDto } from '../dto/user-address.dto';
import { UserResponseDto } from '../dto/user.dto';
import { UserPreference } from '../entities/user-preference.entity';
import { UserAddress } from '../entities/user-address.entity';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Crear un nuevo usuario',
    description: 'Crea un nuevo usuario en el sistema con su información personal'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Usuario creado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID único del usuario' },
        email: { type: 'string', description: 'Email del usuario' },
        firstName: { type: 'string', description: 'Nombre del usuario' },
        lastName: { type: 'string', description: 'Apellido del usuario' },
        role: { type: 'string', description: 'Rol del usuario (customer, barber, admin)' },
        isActive: { type: 'boolean', description: 'Estado activo del usuario' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Obtener todos los usuarios',
    description: 'Retorna una lista paginada de todos los usuarios con opciones de filtrado'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    description: 'Número de página (por defecto: 1)',
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Cantidad de usuarios por página (por defecto: 10)',
    example: 10
  })
  @ApiQuery({ 
    name: 'role', 
    required: false, 
    description: 'Filtrar por rol de usuario',
    example: 'customer'
  })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    description: 'Filtrar por estado (active, inactive)',
    example: 'active'
  })
  @ApiQuery({ 
    name: 'search', 
    required: false, 
    description: 'Búsqueda por nombre o email',
    example: 'john'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de usuarios obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'ID único del usuario' },
              email: { type: 'string', description: 'Email del usuario' },
              firstName: { type: 'string', description: 'Nombre del usuario' },
              lastName: { type: 'string', description: 'Apellido del usuario' },
              role: { type: 'string', description: 'Rol del usuario' },
              isActive: { type: 'boolean', description: 'Estado activo del usuario' }
            }
          }
        },
        total: { type: 'number', description: 'Total de usuarios' },
        page: { type: 'number', description: 'Página actual' },
        totalPages: { type: 'number', description: 'Total de páginas' }
      }
    }
  })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ): Promise<{ data: UserResponseDto[]; total: number; page: number; totalPages: number }> {
    return this.userService.findAll(
      parseInt(page, 10),
      parseInt(limit, 10),
      role as any,
      status as any,
      search
    );
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener usuario por ID',
    description: 'Retorna la información detallada de un usuario específico por su ID'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único del usuario',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Usuario encontrado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID único del usuario' },
        email: { type: 'string', description: 'Email del usuario' },
        firstName: { type: 'string', description: 'Nombre del usuario' },
        lastName: { type: 'string', description: 'Apellido del usuario' },
        role: { type: 'string', description: 'Rol del usuario' },
        isActive: { type: 'boolean', description: 'Estado activo del usuario' },
        createdAt: { type: 'string', format: 'date-time', description: 'Fecha de creación' },
        updatedAt: { type: 'string', format: 'date-time', description: 'Fecha de actualización' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.findById(id);
  }

  @Get('email/:email')
  async findByEmail(@Param('email') email: string): Promise<UserResponseDto | null> {
    return this.userService.findByEmail(email);
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string): Promise<void> {
    return this.userService.deleteUser(id);
  }

  @Put(':id/activate')
  async activateUser(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.activateUser(id);
  }

  @Put(':id/deactivate')
  async deactivateUser(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.deactivateUser(id);
  }

  @Put(':id/last-login')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateLastLogin(@Param('id') id: string): Promise<void> {
    return this.userService.updateLastLogin(id);
  }

  // Preference endpoints
  @Post(':id/preferences')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Crear preferencias de usuario',
    description: 'Crea las preferencias de un usuario específico'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único del usuario',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Preferencias creadas exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID único de la preferencia' },
        userId: { type: 'string', description: 'ID del usuario' },
        notifications: { type: 'boolean', description: 'Preferencia de notificaciones' },
        marketing: { type: 'boolean', description: 'Preferencia de marketing' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async createUserPreference(
    @Param('id') userId: string,
    @Body() createPreferenceDto: CreateUserPreferenceDto,
  ): Promise<UserPreference> {
    createPreferenceDto.userId = userId;
    return this.userService.createUserPreference(createPreferenceDto);
  }

  @Get(':id/preferences')
  async getUserPreferences(@Param('id') userId: string): Promise<UserPreference[]> {
    return this.userService.getUserPreferences(userId);
  }

  @Put('preferences/:preferenceId')
  async updateUserPreference(
    @Param('preferenceId') preferenceId: string,
    @Body() updatePreferenceDto: UpdateUserPreferenceDto,
  ): Promise<UserPreference> {
    return this.userService.updateUserPreference(preferenceId, updatePreferenceDto);
  }

  // Address endpoints
  @Post(':id/addresses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Crear dirección de usuario',
    description: 'Crea una nueva dirección para un usuario específico'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único del usuario',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Dirección creada exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID único de la dirección' },
        userId: { type: 'string', description: 'ID del usuario' },
        street: { type: 'string', description: 'Calle' },
        city: { type: 'string', description: 'Ciudad' },
        state: { type: 'string', description: 'Estado/Provincia' },
        zipCode: { type: 'string', description: 'Código postal' },
        country: { type: 'string', description: 'País' },
        isPrimary: { type: 'boolean', description: 'Es la dirección principal' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async createUserAddress(
    @Param('id') userId: string,
    @Body() createAddressDto: CreateUserAddressDto,
  ): Promise<UserAddress> {
    createAddressDto.userId = userId;
    return this.userService.createUserAddress(createAddressDto);
  }

  @Get(':id/addresses')
  async getUserAddresses(@Param('id') userId: string): Promise<UserAddress[]> {
    return this.userService.getUserAddresses(userId);
  }

  @Put('addresses/:addressId')
  async updateUserAddress(
    @Param('addressId') addressId: string,
    @Body() updateAddressDto: UpdateUserAddressDto,
  ): Promise<UserAddress> {
    return this.userService.updateUserAddress(addressId, updateAddressDto);
  }
}