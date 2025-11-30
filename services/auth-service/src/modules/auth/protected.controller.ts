import { Controller, Get, UseGuards, Req } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { EmailVerifiedGuard } from './guards/email-verified.guard'
import { AuthRequest } from './interfaces/auth-request.interface'

@ApiTags('Protected Routes Example')
@ApiBearerAuth()
@Controller('protected')
export class ProtectedController {
  
  @Get('profile')
  @UseGuards(JwtAuthGuard) // Solo requiere autenticación
  @ApiOperation({ summary: 'Obtener perfil de usuario' })
  @ApiResponse({ status: 200, description: 'Perfil obtenido exitosamente' })
  getProfile(@Req() request: AuthRequest) {
    const user = request.user
    if (!user) {
      throw new Error('Usuario no autenticado')
    }
    return {
      message: 'Perfil accesible para usuarios autenticados',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      }
    }
  }

  @Get('bookings')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard) // Requiere autenticación Y email verificado
  @ApiOperation({ 
    summary: 'Obtener reservas del usuario',
    description: 'Este endpoint requiere que el usuario tenga su email verificado'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Reservas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Acceso permitido a reservas' },
        bookings: { 
          type: 'array',
          items: { type: 'string' },
          example: ['booking1', 'booking2']
        }
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Email no verificado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Debes verificar tu dirección de email antes de acceder a este recurso...' },
        error: { type: 'string', example: 'Forbidden' }
      }
    }
  })
  getBookings(@Req() request: AuthRequest) {
    const user = request.user
    if (!user) {
      throw new Error('Usuario no autenticado')
    }
    return {
      message: 'Acceso permitido a reservas - email verificado',
      bookings: [] // Aquí irían las reservas reales
    }
  }

  @Get('admin/users')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard) // Requiere autenticación Y email verificado
  @ApiOperation({ 
    summary: 'Obtener todos los usuarios (Admin)',
    description: 'Este endpoint requiere email verificado para acceso administrativo'
  })
  @ApiResponse({ status: 200, description: 'Lista de usuarios obtenida' })
  @ApiResponse({ status: 403, description: 'Email no verificado o sin permisos' })
  getUsers(@Req() _request: AuthRequest) {
    return {
      message: 'Acceso permitido a gestión de usuarios - email verificado',
      users: [] // Aquí irían los usuarios reales
    }
  }
}