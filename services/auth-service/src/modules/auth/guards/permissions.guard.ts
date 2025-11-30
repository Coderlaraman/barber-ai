import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Permission } from '../entities/permission.entity'
import { hasPermission } from '../entities/role-permissions.entity'

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ])
    
    if (!requiredPermissions) {
      return true
    }
    
    const { user } = context.switchToHttp().getRequest()
    return requiredPermissions.every((permission) => hasPermission(user.role, permission))
  }
}