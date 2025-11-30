import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthRequest } from '../interfaces/auth-request.interface'

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>()
    const user = request.user

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado')
    }

    if (!user.emailVerified) {
      throw new ForbiddenException(
        'Debes verificar tu dirección de email antes de acceder a este recurso. ' +
        'Por favor, revisa tu bandeja de entrada o solicita un nuevo email de verificación.'
      )
    }

    return true
  }
}