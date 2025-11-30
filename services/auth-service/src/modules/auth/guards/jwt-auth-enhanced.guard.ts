import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { TokenBlacklistService } from '../services/token-blacklist.service'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private tokenBlacklistService: TokenBlacklistService
  ) {
    super()
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const canActivate = await super.canActivate(context)
    
    if (!canActivate) {
      return false
    }

    const request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(request)
    
    if (!token) {
      throw new UnauthorizedException('Token not found')
    }

    // Check if token is blacklisted
    const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(token)
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked')
    }

    return true
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}