import { Body, Controller, Post, Get, Req, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { Request } from 'express'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { LogoutDto } from './dto/logout.dto'
import { SocialAuthDto } from './dto/social-auth.dto'
import { AuditQueryDto } from './dto/audit-query.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { RegisterThrottlerGuard, LoginThrottlerGuard, SocialAuthThrottlerGuard } from './guards/throttle.guard'
import { AuditService } from './services/audit.service'
import { AuditAction, AuditStatus } from './entities/access-audit.entity'

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly auditService: AuditService
  ) {}

  @Post('register')
  @UseGuards(RegisterThrottlerGuard)
  @ApiOperation({ 
    summary: 'Register a new user',
    description: `Creates a new user account with role-based permissions. Returns JWT tokens for authentication.
    
    **Auditoría**: Este endpoint registra automáticamente:
    - IP del cliente
    - User Agent del navegador
    - Timestamp del registro
    - Resultado de la operación (éxito/error)
    
    **Rate Limiting**: Máximo 5 registros por minuto por IP`
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully registered',
    schema: {
      type: 'object',
      properties: {
        user: { 
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'User ID' },
            email: { type: 'string', format: 'email', description: 'User email' },
            role: { type: 'string', enum: ['CLIENT', 'BARBER', 'ADMIN'], description: 'User role' }
          }
        },
        accessToken: { type: 'string', description: 'JWT access token' },
        refreshToken: { type: 'string', description: 'JWT refresh token' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Email already taken' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const auditData = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
    return this.auth.register(dto.email, dto.password, dto.role, auditData)
  }

  @Post('login')
  @UseGuards(LoginThrottlerGuard)
  @ApiOperation({ 
    summary: 'User login',
    description: `Authenticates user credentials and returns JWT tokens with role-based permissions.
    
    **Rate Limiting**: Máximo 10 intentos de login por minuto por IP
    
    **Auditoría**: Este endpoint registra automáticamente:
    - IP del cliente
    - User Agent del navegador
    - Timestamp del intento de login
    - Resultado (éxito/error)
    - Razón del fallo (si aplica)
    
    **Seguridad**: Los intentos fallidos se registran para detección de actividad sospechosa.`
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        user: { 
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'User ID' },
            email: { type: 'string', format: 'email', description: 'User email' },
            role: { type: 'string', enum: ['CLIENT', 'BARBER', 'ADMIN'], description: 'User role' }
          }
        },
        accessToken: { 
          type: 'string', 
          description: 'JWT access token containing user permissions' 
        },
        refreshToken: { type: 'string', description: 'JWT refresh token' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const auditData = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
    return this.auth.login(dto.email, dto.password, auditData)
  }

  @Post('refresh')
  @ApiOperation({ 
    summary: 'Refresh access token',
    description: 'Generates a new access token using a valid refresh token.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { 
          type: 'string', 
          description: 'New JWT access token with updated permissions' 
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body('refreshToken') token: string, @Req() req: Request) {
    const auditData = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
    return this.auth.refresh(token, auditData)
  }

  @Post('logout')
  @ApiOperation({ 
    summary: 'User logout',
    description: `Logs out the user and records the logout event for audit purposes.
    
    **Auditoría**: Este endpoint registra automáticamente:
    - IP del cliente
    - User Agent del navegador
    - Timestamp del logout
    - Token de refresco (si se proporciona) para invalidación
    
    **Nota**: Actualmente se registra el evento de logout. La invalidación de tokens se implementará en futuras versiones.`
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logout successful' }
      }
    }
  })
  async logout(@Body() dto: LogoutDto, @Req() req: Request) {
    const auditData = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
    return this.auth.logout(dto.refreshToken, auditData)
  }

  @Post('social')
  @UseGuards(SocialAuthThrottlerGuard)
  @ApiOperation({ 
    summary: 'Social media authentication',
    description: `Authenticate users via social media providers (Google, Facebook).
    
    **Rate Limiting**: Máximo 10 autenticaciones sociales por minuto por IP
    
    **Proveedores soportados**:
    - Google: Autenticación con cuenta de Google
    - Facebook: Autenticación con cuenta de Facebook
    
    **Proceso**:
    1. El cliente obtiene un token de acceso del proveedor OAuth
    2. Envía el token a este endpoint
    3. El servidor valida el token con el proveedor
    4. Si el usuario no existe, se crea automáticamente
    5. Se generan tokens JWT para el usuario
    
    **Auditoría**: Se registra el método de autenticación social utilizado.`
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Social authentication successful',
    schema: {
      type: 'object',
      properties: {
        user: { 
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'User ID' },
            email: { type: 'string', format: 'email', description: 'User email' },
            role: { type: 'string', enum: ['CLIENT', 'BARBER', 'ADMIN'], description: 'User role' }
          }
        },
        accessToken: { type: 'string', description: 'JWT access token' },
        refreshToken: { type: 'string', description: 'JWT refresh token' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid social token or unsupported provider' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  async socialAuth(@Body() dto: SocialAuthDto, @Req() req: Request) {
    const auditData = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
    return this.auth.socialAuth(dto.provider, dto.accessToken, auditData)
  }

  @Get('health')
  @ApiOperation({ 
    summary: 'Health check',
    description: 'Checks if the authentication service is running and accessible.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'auth' }
      }
    }
  })
  health() {
    return { status: 'ok', service: 'auth' }
  }

  @Get('audit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Query audit logs',
    description: `Retrieves audit logs with optional filtering. Requires authentication.
    
    **Filtros disponibles**:
    - userId: Filtrar por ID de usuario
    - action: Filtrar por tipo de acción (LOGIN, LOGOUT, REGISTER, TOKEN_REFRESH)
    - status: Filtrar por estado (SUCCESS, FAILURE)
    - startDate/endDate: Filtrar por rango de fechas
    
    **Seguridad**: Solo usuarios autenticados pueden acceder a los logs de auditoría.`
  })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction, description: 'Filter by audit action' })
  @ApiQuery({ name: 'status', required: false, enum: AuditStatus, description: 'Filter by audit status' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Audit logs retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Audit log ID' },
          userId: { type: 'string', format: 'uuid', description: 'User ID' },
          email: { type: 'string', format: 'email', description: 'User email' },
          role: { type: 'string', enum: ['CLIENT', 'BARBER', 'ADMIN'], description: 'User role' },
          action: { type: 'string', enum: Object.values(AuditAction), description: 'Action performed' },
          status: { type: 'string', enum: Object.values(AuditStatus), description: 'Action status' },
          ipAddress: { type: 'string', description: 'Client IP address' },
          userAgent: { type: 'string', description: 'Client user agent' },
          createdAt: { type: 'string', format: 'date-time', description: 'Timestamp of the action' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async getAuditLogs(@Query() query: AuditQueryDto) {
    const filters = {
      userId: query.userId,
      action: query.action,
      status: query.status,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined
    }
    
    return this.auditService.queryAudits(filters)
  }
}