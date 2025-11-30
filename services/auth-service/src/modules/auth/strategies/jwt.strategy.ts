import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../entities/user.entity'
import { JwtPayload } from '../interfaces/jwt-payload.interface'
import { TokenBlacklistService } from '../services/token-blacklist.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly tokenBlacklistService: TokenBlacklistService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
    })
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.users.findOne({ where: { id: payload.sub } })
    if (!user) {
      throw new UnauthorizedException('INVALID_TOKEN')
    }
    return user
  }
}