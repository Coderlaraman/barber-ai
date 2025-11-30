import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserRole } from '../entities/user.entity'

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const param = this.reflector.getAllAndOverride<string>('ownerParam', [
      context.getHandler(),
      context.getClass(),
    ])
    
    const { user, params } = context.switchToHttp().getRequest()
    
    // Admin can access any resource
    if (user.role === UserRole.ADMIN) {
      return true
    }
    
    // If no param specified, allow access (use other guards for role/permission checks)
    if (!param) {
      return true
    }
    
    // Check if the user is the owner of the resource
    const resourceId = params[param]
    return user.id === resourceId
  }
}