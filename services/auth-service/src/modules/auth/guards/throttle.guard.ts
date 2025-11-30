import { ThrottlerGuard } from '@nestjs/throttler'
import { Injectable } from '@nestjs/common'

@Injectable()
export class RegisterThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ip
  }
  
  protected async getOptions(): Promise<{ ttl: number; limit: number }> {
    return {
      ttl: 60000, // 1 minuto
      limit: 5 // máximo 5 registros por minuto
    }
  }
}

@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ip
  }
  
  protected async getOptions(): Promise<{ ttl: number; limit: number }> {
    return {
      ttl: 60000, // 1 minuto
      limit: 10 // máximo 10 intentos de login por minuto
    }
  }
}

@Injectable()
export class SocialAuthThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ip
  }
  
  protected async getOptions(): Promise<{ ttl: number; limit: number }> {
    return {
      ttl: 60000, // 1 minuto
      limit: 10 // máximo 10 autenticaciones sociales por minuto
    }
  }
}